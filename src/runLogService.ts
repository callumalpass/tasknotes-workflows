import type { App } from "obsidian";
import { PLUGIN_ID } from "./constants";
import { safePathSegment } from "./path";
import type { RunSummary, TaskNotesWorkflowsSettings, WorkflowRunDetail } from "./types";

export class RunLogService {
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

		await this.ensureFolder(this.rootPath());
		await this.appendHistory(summary);
		await this.writeDetail(detail);
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
			.map((line) => JSON.parse(line) as RunSummary)
			.filter((summary) => !workflowId || summary.workflowId === workflowId)
			.reverse();
	}

	async readRunDetail(workflowId: string, runId: string): Promise<WorkflowRunDetail | null> {
		const path = this.detailPath(workflowId, runId);
		if (!(await this.exists(path))) return null;
		return JSON.parse(await this.app.vault.adapter.read(path)) as WorkflowRunDetail;
	}

	async clearHistory(): Promise<void> {
		const rootPath = this.rootPath();
		if (await this.exists(rootPath)) {
			await this.removeRecursively(rootPath);
		}
		await this.ensureFolder(rootPath);
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
		const files = listed.files
			.filter((path) => path.endsWith(".json"))
			.sort((left, right) => left.localeCompare(right));
		const excess = files.slice(0, Math.max(0, files.length - this.getSettings().maxRunsPerWorkflow));
		for (const path of excess) {
			await this.app.vault.adapter.remove(path);
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
			await this.app.vault.adapter.remove(file);
		}
		for (const folder of listed.folders) {
			await this.removeRecursively(folder);
		}
		await this.app.vault.adapter.rmdir(path, true);
	}
}
