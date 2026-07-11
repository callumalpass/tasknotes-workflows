import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { RunLogService } from "../src/runLogService";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { TaskNotesWorkflowsSettings, WorkflowRunDetail } from "../src/types";

interface FakeFile {
	content: string;
	mtime: number;
}

class FakeAdapter {
	files = new Map<string, FakeFile>();
	folders = new Set<string>();
	private clock = 0;

	async exists(path: string): Promise<boolean> {
		return this.files.has(path) || this.folders.has(path);
	}

	async read(path: string): Promise<string> {
		const file = this.files.get(path);
		if (!file) throw new Error(`ENOENT: no such file or directory, open '${path}'`);
		return file.content;
	}

	async write(path: string, content: string): Promise<void> {
		this.files.set(path, { content, mtime: ++this.clock });
	}

	async mkdir(path: string): Promise<void> {
		this.folders.add(path);
	}

	async remove(path: string): Promise<void> {
		if (!this.files.delete(path)) {
			throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
		}
	}

	async rmdir(path: string): Promise<void> {
		this.folders.delete(path);
	}

	async stat(path: string): Promise<{ mtime: number } | null> {
		const file = this.files.get(path);
		return file ? { mtime: file.mtime } : null;
	}

	async list(path: string): Promise<{ files: string[]; folders: string[] }> {
		const prefix = `${path}/`;
		const files: string[] = [];
		const folders = new Set<string>();
		for (const filePath of this.files.keys()) {
			if (!filePath.startsWith(prefix)) continue;
			const rest = filePath.slice(prefix.length);
			if (rest.includes("/")) {
				folders.add(`${prefix}${rest.split("/")[0]}`);
			} else {
				files.push(filePath);
			}
		}
		for (const folderPath of this.folders) {
			if (folderPath.startsWith(prefix) && !folderPath.slice(prefix.length).includes("/")) {
				folders.add(folderPath);
			}
		}
		return { files, folders: [...folders] };
	}
}

function createService(overrides: Partial<TaskNotesWorkflowsSettings> = {}) {
	const adapter = new FakeAdapter();
	const app = { vault: { adapter, configDir: "config" } } as unknown as App;
	const settings: TaskNotesWorkflowsSettings = { ...DEFAULT_SETTINGS, ...overrides };
	return { adapter, service: new RunLogService(app, () => settings) };
}

function runDetail(runId: string, workflowId = "wf"): WorkflowRunDetail {
	return {
		runId,
		workflowId,
		workflowName: "Workflow",
		workflowPath: "TaskNotes/Workflows/wf.md",
		dryRun: false,
		startedAt: "2026-07-10T00:00:00.000Z",
		status: "success",
		trigger: { type: "manual", event: "manual" },
		steps: [],
	};
}

const RUNS_ROOT = "config/plugins/tasknotes-workflows/runs";

describe("RunLogService", () => {
	it("records a run to history and detail", async () => {
		const { adapter, service } = createService();
		await service.recordRun(runDetail("run-1"));

		const history = await adapter.read(`${RUNS_ROOT}/history.jsonl`);
		expect(history).toContain('"runId":"run-1"');
		expect(await adapter.exists(`${RUNS_ROOT}/workflows/wf/run-1.json`)).toBe(true);
	});

	it("prunes the oldest runs by mtime, not by file name", async () => {
		const { adapter, service } = createService({ maxRunsPerWorkflow: 2 });
		// Written oldest to newest; lexicographic order would keep the wrong files.
		await service.recordRun(runDetail("zz-oldest"));
		await service.recordRun(runDetail("mm-middle"));
		await service.recordRun(runDetail("aa-newest"));

		expect(await adapter.exists(`${RUNS_ROOT}/workflows/wf/zz-oldest.json`)).toBe(false);
		expect(await adapter.exists(`${RUNS_ROOT}/workflows/wf/mm-middle.json`)).toBe(true);
		expect(await adapter.exists(`${RUNS_ROOT}/workflows/wf/aa-newest.json`)).toBe(true);
	});

	it("does not lose history entries under concurrent recording", async () => {
		const { service } = createService();
		await Promise.all(
			Array.from({ length: 20 }, (_, index) => service.recordRun(runDetail(`run-${index}`)))
		);

		const runs = await service.recentRuns();
		expect(runs).toHaveLength(20);
	});

	it("keeps every concurrently recorded detail within retention", async () => {
		const { adapter, service } = createService({ maxRunsPerWorkflow: 100 });
		await Promise.all(
			Array.from({ length: 20 }, (_, index) => service.recordRun(runDetail(`run-${index}`)))
		);

		const listed = await adapter.list(`${RUNS_ROOT}/workflows/wf`);
		expect(listed.files).toHaveLength(20);
	});

	it("returns null for a missing run detail", async () => {
		const { service } = createService();
		expect(await service.readRunDetail("wf", "gone")).toBeNull();
	});

	it("returns null when reading a run detail fails", async () => {
		const { adapter, service } = createService();
		await service.recordRun(runDetail("run-1"));
		adapter.read = async () => {
			throw new Error("ENOENT: no such file or directory, open 'run-1.json'");
		};
		expect(await service.readRunDetail("wf", "run-1")).toBeNull();
	});

	it("skips corrupt history lines", async () => {
		const { adapter, service } = createService();
		await service.recordRun(runDetail("run-1"));
		const historyPath = `${RUNS_ROOT}/history.jsonl`;
		const history = await adapter.read(historyPath);
		await adapter.write(historyPath, `not-json\n${history}`);

		const runs = await service.recentRuns();
		expect(runs).toHaveLength(1);
		expect(runs[0].runId).toBe("run-1");
	});
});
