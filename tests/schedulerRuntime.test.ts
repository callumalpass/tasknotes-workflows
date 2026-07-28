import { describe, expect, it, vi } from "vitest";
import type { MdbaseRuntimeEventEnvelope } from "@callumalpass/mdbase-runtime";
import type { CloudEvent } from "@callumalpass/mdbase-interop";
import { WorkflowScheduler } from "../src/scheduler";
import type { TaskNotesBridge } from "../src/tasknotesBridge";
import type {
	LoadedWorkflow,
	TaskNotesWorkflowsSettings,
	WorkflowRunDetail,
	WorkflowRunOptions,
} from "../src/types";

describe("workflow runtime event scheduling", () => {
	it("subscribes by event contract range and preserves CloudEvents evidence", async () => {
		let handler: ((event: CloudEvent) => Promise<void>) | undefined;
		const onContractEvent = vi.fn(async (
			_contract: { id: string; version: string },
			candidate: (event: CloudEvent) => Promise<void>,
		) => {
			handler = candidate;
			return { dispose: vi.fn() };
		});
		const bridge = {
			onTaskEvent: () => null,
			onRuntimeEvent: () => null,
			onContractEvent,
			api: null,
		} as unknown as TaskNotesBridge;
		const workflow = runtimeWorkflow();
		workflow.workflow!.triggers = [{
			id: "completed",
			type: "contract.event",
			contract: "tasknotes.task.completed",
			version: "^1.0.0",
			source: "tasknotes",
		}];
		const runWorkflow = vi.fn(async (
			_workflow: LoadedWorkflow,
			_options: WorkflowRunOptions,
		) => ({ status: "success" }) as WorkflowRunDetail);
		const scheduler = new WorkflowScheduler(
			{ app: {} } as never,
			bridge,
			() => settings(),
			() => [workflow],
			runWorkflow,
		);
		scheduler.start();
		await vi.waitFor(() => expect(handler).toBeTypeOf("function"));

		await handler?.({
			specversion: "1.0",
			id: "evt-1",
			source: "urn:mdbase:application:tasknotes:tasknotes.obsidian",
			type: "tasknotes.task.completed",
			time: "2026-07-28T10:15:00.000Z",
			subject: "Tasks/Alpha.md",
			datacontenttype: "application/json",
			dataschema: "urn:mdbase:contract:tasknotes.task.completed:1.0.0",
			data: { task_path: "Tasks/Alpha.md", title: "Alpha" },
			mdbaseprofile: "0.1",
			mdbasecontractversion: "1.0.0",
			mdbasecontractdigest: `sha256:${"a".repeat(64)}`,
			mdbaseapplication: "tasknotes",
			mdbaseimplementation: "tasknotes.obsidian",
			mdbaseimplementationversion: "5.0.0",
			correlationid: "corr-1",
		});

		expect(onContractEvent).toHaveBeenCalledWith(
			{ id: "tasknotes.task.completed", version: "^1.0.0" },
			expect.any(Function),
		);
		expect(runWorkflow).toHaveBeenCalledTimes(1);
		const runCall = runWorkflow.mock.calls[0];
		expect(runCall?.[0]).toBe(workflow);
		expect(runCall?.[1].trigger).toMatchObject({
			id: "completed",
			event: "tasknotes.task.completed",
			triggerType: "contract.event",
			path: "Tasks/Alpha.md",
			source: "tasknotes",
			correlationId: "corr-1",
			data: {
				eventId: "evt-1",
				contractVersion: "1.0.0",
			},
		});
		scheduler.stop();
	});

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
