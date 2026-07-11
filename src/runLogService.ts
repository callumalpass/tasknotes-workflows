import type { App } from "obsidian";
import { PLUGIN_ID } from "./constants";
import { safePathSegment } from "./path";
import type { RunSummary, TaskNotesWorkflowsSettings, WorkflowRunDetail } from "./types";

export class RunLogService {
	private writeQueue: Promise<unknown> = Promise.resolve();

	constructor(
		private readonly app: App,
		private readonly getSettings: () => TaskNotesWorkflowsSettings
	) {}

	async recordRun(detail: WorkflowRunDetail): Promise<RunSummary> {
		const summary: RunSummary = {
			ts: detail.startedAt,
			runId: detail.runId,
			workflowId: detail.workflowId,
			workflowName: detail.workflowName,
			status: detail.status,
			trigger: detail.trigger.event ?? detail.trigger.type,
			durationMs: detail.durationMs ?? 0,
			steps: detail.steps.length,
			dryRun: detail.dryRun,
			error: detail.error,
		};

		await this.enqueueWrite(async () => {
			await this.ensureFolder(this.rootPath());
			await this.appendHistory(summary);
			await this.writeDetail(detail);
		});
		// Retention runs outside the write lock: removeFileIfPresent tolerates a
		// file another pass already pruned, so concurrent retention is safe and
		// need not serialize (which would also deadlock a blocked listing).
		await this.applyRetention(detail.workflowId);
		return summary;
	}

	async recentRuns(workflowId?: string): Promise<RunSummary[]> {
		const historyPath = this.historyPath();
		if (!(await this.exists(historyPath))) return [];
		const text = await this.app.vault.adapter.read(historyPath);
		return text
			.split("\n")
			.filter((line) => line.trim().length > 0)
			.flatMap((line) => {
				try {
					return [JSON.parse(line) as RunSummary];
				} catch {
					return [];
				}
			})
			.filter((summary) => !workflowId || summary.workflowId === workflowId)
			.reverse();
	}

	async readRunDetail(workflowId: string, runId: string): Promise<WorkflowRunDetail | null> {
		const path = this.detailPath(workflowId, runId);
		try {
			if (!(await this.exists(path))) return null;
			return JSON.parse(await this.app.vault.adapter.read(path)) as WorkflowRunDetail;
		} catch {
			return null;
		}
	}

	async clearHistory(): Promise<void> {
		await this.enqueueWrite(async () => {
			const rootPath = this.rootPath();
			if (await this.exists(rootPath)) {
				await this.removeRecursively(rootPath);
			}
			await this.ensureFolder(rootPath);
		});
	}

	private enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
		const result = this.writeQueue.then(operation);
		this.writeQueue = result.catch(() => undefined);
		return result;
	}

	private async appendHistory(summary: RunSummary): Promise<void> {
		const settings = this.getSettings();
		const historyPath = this.historyPath();
		const existing = (await this.exists(historyPath))
			? await this.app.vault.adapter.read(historyPath)
			: "";
		const lines = [...existing.split("\n").filter(Boolean), JSON.stringify(summary)].slice(
			-settings.maxHistoryEntries
		);
		await this.app.vault.adapter.write(historyPath, `${lines.join("\n")}\n`);
	}

	private async writeDetail(detail: WorkflowRunDetail): Promise<void> {
		const folder = this.detailFolder(detail.workflowId);
		await this.ensureFolder(folder);
		await this.app.vault.adapter.write(
			this.detailPath(detail.workflowId, detail.runId),
			JSON.stringify(detail, null, 2)
		);
	}

	private async applyRetention(workflowId: string): Promise<void> {
		const folder = this.detailFolder(workflowId);
		if (!(await this.exists(folder))) return;

		const listed = await this.app.vault.adapter.list(folder);
		const files = listed.files.filter((path) => path.endsWith(".json"));
		const excessCount = files.length - this.getSettings().maxRunsPerWorkflow;
		if (excessCount <= 0) return;

		// Run ids are random, so file names carry no ordering; prune oldest by mtime.
		const stats = await Promise.all(
			files.map(async (path) => ({
				path,
				mtime: (await this.app.vault.adapter.stat(path))?.mtime ?? 0,
			}))
		);
		stats.sort((left, right) => left.mtime - right.mtime || left.path.localeCompare(right.path));
		for (const { path } of stats.slice(0, excessCount)) {
			await this.removeFileIfPresent(path);
		}
	}

	private async removeFileIfPresent(path: string): Promise<void> {
		try {
			await this.app.vault.adapter.remove(path);
		} catch (error) {
			if (isMissingPathError(error)) return;
			throw error;
		}
	}

	private historyPath(): string {
		return `${this.rootPath()}/history.jsonl`;
	}

	private detailFolder(workflowId: string): string {
		return `${this.rootPath()}/workflows/${safePathSegment(workflowId)}`;
	}

	private detailPath(workflowId: string, runId: string): string {
		return `${this.detailFolder(workflowId)}/${safePathSegment(runId)}.json`;
	}

	private async ensureFolder(path: string): Promise<void> {
		const segments = path.split("/").filter(Boolean);
		let current = "";
		for (const segment of segments) {
			current = current ? `${current}/${segment}` : segment;
			if (!(await this.exists(current))) {
				await this.app.vault.adapter.mkdir(current);
			}
		}
	}

	private rootPath(): string {
		const configured = this.getSettings().runLogRoot.trim();
		if (configured.length > 0) return configured;
		return `${this.app.vault.configDir}/plugins/${PLUGIN_ID}/runs`;
	}

	private async exists(path: string): Promise<boolean> {
		return await this.app.vault.adapter.exists(path);
	}

	private async removeRecursively(path: string): Promise<void> {
		if (!(await this.exists(path))) return;
		const listed = await this.app.vault.adapter.list(path);
		for (const file of listed.files) {
			await this.removeFileIfPresent(file);
		}
		for (const folder of listed.folders) {
			await this.removeRecursively(folder);
		}
		await this.app.vault.adapter.rmdir(path, true);
	}
}

function isMissingPathError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	const code = "code" in error ? String(error.code) : "";
	return code === "ENOENT" || error.message.includes("ENOENT");
}
