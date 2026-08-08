import { describe, expect, it, vi } from "vitest";
import type { Plugin } from "obsidian";
import { WorkflowScheduler } from "../src/scheduler";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { TaskNotesBridge } from "../src/tasknotesBridge";
import type {
	LoadedWorkflow,
	TaskNotesWorkflowsSettings,
	WorkflowRunDetail,
	WorkflowRunOptions,
} from "../src/types";

function workflow(id: string, enabled: boolean): LoadedWorkflow {
	return {
		file: { path: `TaskNotes/Workflows/${id}.md`, basename: id } as LoadedWorkflow["file"],
		body: "",
		source: "",
		sourceFormat: "runtime-v0.2",
		diagnostics: [],
		workflow: {
			type: "workflow",
			schemaVersion: 1,
			id,
			name: id,
			enabled,
			triggers: [{ id: "on-created", type: "tasknotes.event", event: "task.created" }],
			vars: {},
			conditions: [],
			steps: [],
			run: {
				mode: "sequential",
				concurrency: { group: "workflow", policy: "skip" },
				limits: { maxItems: 50 },
				source: "tasknotes-workflows",
				onError: "stop",
			},
		},
	};
}

function createScheduler(workflows: LoadedWorkflow[]) {
	const handlers = new Map<string, (payload: unknown) => void>();
	const bridge = {
		api: null,
		onTaskEvent(event: string, handler: (payload: unknown) => void) {
			handlers.set(event, handler);
			return { event };
		},
	} as unknown as TaskNotesBridge;
	const settings: TaskNotesWorkflowsSettings = {
		...DEFAULT_SETTINGS,
		enableScheduledTriggers: false,
		enableObsidianTriggers: false,
	};
	const runWorkflow = vi.fn((workflow: LoadedWorkflow, options: WorkflowRunOptions) => {
		void workflow;
		void options;
		return Promise.resolve({} as WorkflowRunDetail);
	});
	const scheduler = new WorkflowScheduler(
		{} as Plugin,
		bridge,
		() => settings,
		() => workflows,
		runWorkflow
	);
	return { scheduler, handlers, runWorkflow };
}

describe("WorkflowScheduler task events", () => {
	it("runs enabled workflows whose trigger matches", async () => {
		const { scheduler, handlers, runWorkflow } = createScheduler([workflow("active", true)]);
		scheduler.start();

		handlers.get("task.created")?.({ task: { path: "Tasks/a.md" } });
		await Promise.resolve();

		expect(runWorkflow).toHaveBeenCalledTimes(1);
	});

	it("does not run disabled workflows on task events", async () => {
		const { scheduler, handlers, runWorkflow } = createScheduler([
			workflow("inactive", false),
			workflow("active", true),
		]);
		scheduler.start();

		handlers.get("task.created")?.({ task: { path: "Tasks/a.md" } });
		await Promise.resolve();

		expect(runWorkflow).toHaveBeenCalledTimes(1);
		expect(runWorkflow.mock.calls[0][0].workflow?.id).toBe("active");
	});
});
