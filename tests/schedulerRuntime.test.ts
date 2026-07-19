import { describe, expect, it, vi } from "vitest";
import type { MdbaseRuntimeEventEnvelope } from "@callumalpass/mdbase-runtime";
import { WorkflowScheduler } from "../src/scheduler";
import type { TaskNotesBridge } from "../src/tasknotesBridge";
import type {
	LoadedWorkflow,
	TaskNotesWorkflowsSettings,
	WorkflowRunDetail,
	WorkflowRunOptions,
} from "../src/types";

describe("workflow runtime event scheduling", () => {
	it("subscribes to canvas.drop and runs only matching provider events", async () => {
		let handler: ((event: MdbaseRuntimeEventEnvelope) => Promise<void>) | undefined;
		const bridge = {
			onTaskEvent: () => null,
			onRuntimeEvent: (_event: string, candidate: (event: MdbaseRuntimeEventEnvelope) => Promise<void>) => {
				handler = candidate;
				return { dispose: vi.fn() };
			},
			api: null,
		} as unknown as TaskNotesBridge;
		const workflow = runtimeWorkflow();
		let receivedOptions: WorkflowRunOptions | undefined;
		const runWorkflow = vi.fn(async (_workflow: LoadedWorkflow, options: WorkflowRunOptions) => {
			receivedOptions = options;
			return { status: "success" } as WorkflowRunDetail;
		});
		const scheduler = new WorkflowScheduler(
			{ app: {} } as never,
			bridge,
			() => settings(),
			() => [workflow],
			runWorkflow
		);
		scheduler.start();
		const envelope: MdbaseRuntimeEventEnvelope = {
			type: "canvas.drop",
			contract_version: 1,
			id: "evt-1",
			occurred_at: "2026-07-16T00:00:00.000Z",
			source: { runtime: "obsidian", provider: "canvas-bases" },
			payload: { record: { path: "Tasks/Alpha.md" } },
			trace: { correlation_id: "corr-1" },
		};

		await handler?.(envelope);
		expect(receivedOptions).toMatchObject({
			trigger: {
				id: "drop",
				type: "canvas.drop",
				triggerType: "runtime.event",
				path: "Tasks/Alpha.md",
				source: "canvas-bases",
				correlationId: "corr-1",
			},
		});

		await handler?.({ ...envelope, id: "evt-2", source: { runtime: "obsidian", provider: "other" } });
		expect(runWorkflow).toHaveBeenCalledTimes(1);
		scheduler.stop();
	});
});

function runtimeWorkflow(): LoadedWorkflow {
	return {
		file: { path: "TaskNotes/Workflows/canvas.md" } as LoadedWorkflow["file"],
		body: "",
		source: "",
		sourceFormat: "runtime-v0.1",
		diagnostics: [],
		workflow: {
			type: "workflow",
			schemaVersion: 1,
			id: "canvas-drop",
			name: "Canvas drop",
			enabled: true,
			triggers: [{ id: "drop", type: "runtime.event", event: "canvas.drop", provider: "canvas-bases" }],
			vars: {},
			conditions: [],
			steps: [],
			run: {
				mode: "sequential",
				concurrency: { group: "workflow", policy: "skip" },
				limits: { maxItems: 25 },
				source: "tasknotes-workflows",
				onError: "stop",
			},
		},
	};
}

function settings(): TaskNotesWorkflowsSettings {
	return {
		workflowFolder: "TaskNotes/Workflows",
		workflowViewPath: "TaskNotes/Views/workflows.base",
		autoCreateDefaultWorkflows: false,
		autoCreateWorkflowView: false,
		enableScheduledTriggers: false,
		enableTaskEventTriggers: true,
		enableObsidianTriggers: false,
		runLogRoot: "TaskNotes/Workflow Runs",
		runLogLevel: "summary",
		maxRunsPerWorkflow: 10,
		maxHistoryEntries: 100,
		minIntervalMs: 60_000,
		uiLanguage: "en",
	};
}
