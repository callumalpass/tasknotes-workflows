import { describe, expect, it } from "vitest";
import { RunLogService } from "../src/runLogService";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { TaskNotesWorkflowsSettings, WorkflowRunDetail } from "../src/types";

class RacingAdapter {
	readonly files = new Map<string, string>();
	readonly folders = new Set<string>();
	private detailListWaiter: (() => void) | null = null;

	constructor(private readonly detailFolder: string) {
		this.folders.add("config");
		this.folders.add("config/plugins");
		this.folders.add("config/plugins/tasknotes-workflows");
		this.folders.add("config/plugins/tasknotes-workflows/runs");
		this.folders.add("config/plugins/tasknotes-workflows/runs/workflows");
		this.folders.add(detailFolder);
		this.files.set(`${detailFolder}/000-old.json`, "{}");
		this.files.set(`${detailFolder}/001-old.json`, "{}");
	}

	async exists(path: string): Promise<boolean> {
		return this.files.has(path) || this.folders.has(path);
	}

	async read(path: string): Promise<string> {
		const text = this.files.get(path);
		if (text === undefined) throw enoent(path);
		return text;
	}

	async write(path: string, content: string): Promise<void> {
		this.files.set(path, content);
	}

	async mkdir(path: string): Promise<void> {
		this.folders.add(path);
	}

	async list(path: string): Promise<{ files: string[]; folders: string[] }> {
		const snapshot = {
			files: [...this.files.keys()].filter((file) => parentPath(file) === path),
			folders: [...this.folders].filter((folder) => parentPath(folder) === path),
		};

		if (path !== this.detailFolder) return snapshot;

		if (this.detailListWaiter) {
			this.detailListWaiter();
			this.detailListWaiter = null;
			return snapshot;
		}

		await new Promise<void>((resolve) => {
			this.detailListWaiter = resolve;
		});
		return snapshot;
	}

	async remove(path: string): Promise<void> {
		if (!this.files.delete(path)) throw enoent(path);
	}
}

describe("issue #2076 - run log retention cleanup", () => {
	it("treats concurrently removed detail files as already cleaned up", async () => {
		const workflowId = "daily-review";
		const detailFolder = `config/plugins/tasknotes-workflows/runs/workflows/${workflowId}`;
		const adapter = new RacingAdapter(detailFolder);
		const settings: TaskNotesWorkflowsSettings = {
			...DEFAULT_SETTINGS,
			maxRunsPerWorkflow: 1,
		};
		const service = new RunLogService(
			{
				vault: {
					configDir: "config",
					adapter,
				},
			} as never,
			() => settings
		);

		await expect(
			Promise.all([service.recordRun(runDetail(workflowId, "run-a")), service.recordRun(runDetail(workflowId, "run-b"))])
		).resolves.toHaveLength(2);
	});
});

function runDetail(workflowId: string, runId: string): WorkflowRunDetail {
	return {
		runId,
		workflowId,
		workflowName: "Daily review",
		workflowPath: "TaskNotes/Workflows/daily-review.md",
		dryRun: false,
		startedAt: `2026-06-25T04:20:47.${runId === "run-a" ? "000" : "001"}Z`,
		status: "success",
		trigger: {
			type: "tasknotes.event",
			event: "task.created",
			actualAt: "2026-06-25T04:20:47.000Z",
		},
		steps: [],
	};
}

function parentPath(path: string): string {
	const index = path.lastIndexOf("/");
	return index === -1 ? "" : path.slice(0, index);
}

function enoent(path: string): Error {
	const error = new Error(`ENOENT: no such file or directory, unlink '${path}'`) as Error & { code: string };
	error.code = "ENOENT";
	return error;
}
