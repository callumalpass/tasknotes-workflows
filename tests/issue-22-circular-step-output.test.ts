import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { RunLogService } from "../src/runLogService";
import { DEFAULT_SETTINGS } from "../src/settings";
import { StepRegistry } from "../src/stepRegistry";
import { WorkflowEngine } from "../src/workflowEngine";
import type { LoadedWorkflow, TaskNotesRuntimeApi, WorkflowRunDetail } from "../src/types";

// Issue #22: once TaskNotes renders a task in a Bases view it attaches
// `basesData` (a Bases entry that reaches the Obsidian `app`) to the cached
// TaskInfo, and `tasks.get` returns that object. The app graph is circular.
class FakeApp {
	appMenuBarManager: { app: FakeApp };
	constructor() {
		this.appMenuBarManager = { app: this };
	}
}

class FakeBasesEntry {
	constructor(readonly app: FakeApp, readonly file: { path: string }) {}
}

function taskInfoRenderedInBases(): Record<string, unknown> {
	return {
		path: "Tasks/a.md",
		title: "Write report",
		status: "in-progress",
		due: "2026-10-08",
		tags: ["task"],
		customProperties: { area: ["Work"] },
		basesData: new FakeBasesEntry(new FakeApp(), { path: "Tasks/a.md" }),
	};
}

function workflow(): LoadedWorkflow {
	return {
		file: { path: "TaskNotes/Workflows/test.md", basename: "test" } as LoadedWorkflow["file"],
		body: "",
		source: "",
		sourceFormat: "runtime-v0.2",
		diagnostics: [],
		workflow: {
			type: "workflow",
			schemaVersion: 1,
			id: "test",
			name: "Test",
			enabled: true,
			triggers: [{ id: "status", type: "tasknotes.event", event: "task.status.changed" }],
			vars: {},
			conditions: [],
			steps: [
				{ id: "read", type: "task.get", input: { task: "{{event.after.path}}" } },
				{
					id: "tag",
					type: "task.patch",
					input: {
						task: { $expr: "steps.read.output.task.path" },
						patch: { title: { $expr: 'steps.read.output.task.title + " (started)"' } },
					},
				},
			],
			run: {
				mode: "sequential",
				concurrency: { group: "workflow", policy: "skip" },
				source: "tasknotes-workflows",
				limits: { maxItems: 5 },
				onError: "stop",
			},
		},
	};
}

function statusChangedTrigger() {
	return {
		id: "status",
		type: "task.status.changed",
		triggerType: "tasknotes.event",
		event: "task.status.changed",
		path: "Tasks/a.md",
		after: taskInfoRenderedInBases(),
		changes: { status: { before: "open", after: "in-progress" } },
	};
}

function engineWithTask(): { engine: WorkflowEngine; patch: ReturnType<typeof vi.fn> } {
	// TaskNotes returns the cached TaskInfo from writes too.
	const patch = vi.fn(async () => taskInfoRenderedInBases());
	const api = {
		tasks: {
			get: vi.fn(async () => taskInfoRenderedInBases()),
			patch,
		},
	} as unknown as TaskNotesRuntimeApi;
	return { engine: new WorkflowEngine(new StepRegistry(), () => api), patch };
}

function recordingService() {
	const files = new Map<string, string>();
	const folders = new Set<string>();
	const adapter = {
		exists: async (path: string) => files.has(path) || folders.has(path),
		read: async (path: string) => files.get(path) ?? "",
		write: async (path: string, content: string) => {
			files.set(path, content);
		},
		mkdir: async (path: string) => {
			folders.add(path);
		},
		list: async () => ({ files: [], folders: [] }),
		stat: async () => null,
	};
	const app = { vault: { adapter, configDir: "config" } } as unknown as App;
	return { files, service: new RunLogService(app, () => DEFAULT_SETTINGS) };
}

describe("issue #22: TaskInfo carrying circular basesData", () => {
	it("evaluates expressions over a step output whose task carries basesData", async () => {
		const { engine, patch } = engineWithTask();

		const run = await engine.runWorkflow(workflow(), { trigger: statusChangedTrigger() });

		expect(run.steps.map((step) => [step.id, step.status, step.error])).toEqual([
			["read", "success", undefined],
			["tag", "success", undefined],
		]);
		expect(run.status).toBe("success");
		expect(patch).toHaveBeenCalledWith(
			"Tasks/a.md",
			{ title: "Write report (started)" },
			expect.anything()
		);
	});

	it("evaluates expressions over a trigger event task that carries basesData", async () => {
		const { engine } = engineWithTask();
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "notice",
				type: "notice.show",
				input: { message: { $expr: 'event.after.title + " (" + event.after.status + ")"' } },
			},
		];

		const run = await engine.runWorkflow(loaded, { dryRun: true, trigger: statusChangedTrigger() });

		expect(run.status).toBe("success");
		expect(run.steps[0]?.input).toEqual({ message: "Write report (in-progress)" });
	});

	it("keeps plain task data in step outputs and drops runtime internals", async () => {
		const { engine } = engineWithTask();

		const run = await engine.runWorkflow(workflow(), { trigger: statusChangedTrigger() });

		expect(run.steps[0]?.output).toEqual({
			task: {
				path: "Tasks/a.md",
				title: "Write report",
				status: "in-progress",
				due: "2026-10-08",
				tags: ["task"],
				customProperties: { area: ["Work"] },
			},
		});
		expect(run.trigger.after).not.toHaveProperty("basesData");
	});

	it("records the run detail log for a run that touched basesData", async () => {
		const { engine } = engineWithTask();
		const { files, service } = recordingService();
		const run = await engine.runWorkflow(workflow(), { trigger: statusChangedTrigger() });

		await expect(service.recordRun(run)).resolves.toMatchObject({ status: "success" });

		const detailPath = `config/plugins/tasknotes-workflows/runs/workflows/test/${run.runId}.json`;
		const stored = JSON.parse(files.get(detailPath) ?? "null") as WorkflowRunDetail;
		expect(stored.steps[0]?.output).toEqual(run.steps[0]?.output);
	});

	it("still writes a detail log if a circular value reaches the run log", async () => {
		const { files, service } = recordingService();
		const app = new FakeApp();
		const detail: WorkflowRunDetail = {
			runId: "run-1",
			workflowId: "wf",
			workflowName: "Workflow",
			workflowPath: "TaskNotes/Workflows/wf.md",
			dryRun: false,
			startedAt: "2026-10-06T00:00:00.000Z",
			status: "failed",
			error: "Real step error",
			trigger: { type: "manual", event: "manual" },
			steps: [
				{
					id: "read",
					type: "task.get",
					status: "failed",
					startedAt: "2026-10-06T00:00:00.000Z",
					error: "Real step error",
					errorDetails: { app },
				},
			],
		};

		await expect(service.recordRun(detail)).resolves.toMatchObject({ error: "Real step error" });

		const stored = JSON.parse(
			files.get("config/plugins/tasknotes-workflows/runs/workflows/wf/run-1.json") ?? "null"
		) as WorkflowRunDetail;
		expect(stored.steps[0]?.error).toBe("Real step error");
	});
});
