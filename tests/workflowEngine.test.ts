import { describe, expect, it, vi } from "vitest";
import { StepRegistry } from "../src/stepRegistry";
import { WorkflowEngine } from "../src/workflowEngine";
import type { LoadedWorkflow, TaskNotesRuntimeApi } from "../src/types";
import type { TaskNotesBridge } from "../src/tasknotesBridge";

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
			triggers: [{ id: "manual", type: "manual" }],
			vars: {},
			conditions: [],
			steps: [
				{
					id: "patch",
					type: "task.patch",
					input: {
						task: "Tasks/a.md",
						patch: { status: "active" },
					},
				},
			],
			run: {
				mode: "sequential",
				concurrency: {
					group: "workflow",
					policy: "skip",
				},
				source: "tasknotes-workflows",
				limits: {
					maxItems: 5,
				},
				onError: "stop",
			},
		},
	};
}

describe("workflow engine", () => {
	it("invokes a selected event/action contract provider and retains exact outcome evidence", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [{
			id: "card",
			type: "canvas.card.create",
			contract: { version: "^1.0.0" },
			provider: { application: "canvas-bases" },
			input: {
				canvas_path: "Completed.canvas",
				card: { kind: "file", file: "{{event.data.task_path}}" },
			},
		}];
		const invokeContractAction = vi.fn(async () => ({
			kind: "mdbase.action.outcome",
			profile_version: "0.1",
			outcome_id: "out-1",
			request_id: "req-1",
			invocation_id: "inv-1",
			attempt_id: "attempt-1",
			contract: { id: "canvas.card.create", version: "1.0.0", digest: `sha256:${"a".repeat(64)}` },
			provider: {
				application: "canvas-bases",
				implementation: "canvas-bases.obsidian",
				version: "0.1.2",
			},
			provider_declaration_digest: `sha256:${"b".repeat(64)}`,
			status: "succeeded",
			completed_at: "2026-07-28T10:15:01.000Z",
			output: { canvas_path: "Completed.canvas", card_id: "card-1", created: true },
		}));
		const bridge = {
			interopDescription: () => ({
				action_providers: [{
					handlers: [{
						resolved: {
							id: "canvas.card.create",
							version: "1.0.0",
							digest: `sha256:${"a".repeat(64)}`,
						},
					}],
				}],
			}),
			invokeContractAction,
		} as unknown as TaskNotesBridge;
		const engine = new WorkflowEngine(
			new StepRegistry(),
			() => null,
			() => null,
			(key) => key,
			() => bridge,
		);

		const run = await engine.runWorkflow(loaded, {
			trigger: {
				type: "tasknotes.task.completed",
				triggerType: "contract.event",
				path: "Tasks/A.md",
				correlationId: "corr-1",
				data: { task_path: "Tasks/A.md", eventId: "evt-1" },
			},
		});

		expect(run.status).toBe("success");
		expect(invokeContractAction).toHaveBeenCalledWith(expect.objectContaining({
			contract: { id: "canvas.card.create", version: "^1.0.0" },
			requested_provider: { application: "canvas-bases" },
			correlation_id: "corr-1",
			causation_id: "evt-1",
			subject: "Tasks/A.md",
			input: {
				canvas_path: "Completed.canvas",
				card: { kind: "file", file: "Tasks/A.md" },
			},
		}));
		expect(run.steps[0]).toMatchObject({
			output: { card_id: "card-1", created: true },
			evidence: {
				status: "succeeded",
				contract: { id: "canvas.card.create", version: "1.0.0" },
				provider: { application: "canvas-bases" },
			},
		});
	});

	it("checks local TaskNotes capability requirements before any step runs", async () => {
		const loaded = workflow();
		loaded.workflow!.requires = {
			capabilities: ["task.patch"],
		};
		const patch = vi.fn();
		const api = { capabilities: [], tasks: { patch } } as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(
			new StepRegistry(),
			() => api,
			() => null,
			(key) => key
		);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toContain("task.patch");
		expect(run.steps).toEqual([]);
		expect(patch).not.toHaveBeenCalled();
	});

	it("dry-runs mutating steps without calling TaskNotes", async () => {
		const patch = vi.fn();
		const api = {
			tasks: {
				patch,
			},
		} as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(new StepRegistry(), () => api);

		const run = await engine.runWorkflow(workflow(), {
			dryRun: true,
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("success");
		expect(patch).not.toHaveBeenCalled();
		expect(run.steps[0]?.output).toEqual({
			dryRun: true,
			wouldRun: "task.patch",
			input: { task: "Tasks/a.md", patch: { status: "active" } },
		});
	});

	it("dry-runs Obsidian write steps without requiring app context", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "create",
				type: "obsidian.createNote",
				input: { path: "Notes/new-note.md", content: "# New note\n" },
			},
		];
		const engine = new WorkflowEngine(new StepRegistry(), () => null);

		const run = await engine.runWorkflow(loaded, {
			dryRun: true,
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("success");
		expect(run.steps[0]?.output).toEqual({
			dryRun: true,
			wouldRun: "obsidian.createNote",
			input: { path: "Notes/new-note.md", content: "# New note\n" },
		});
	});

	it("fails batch steps that exceed run.limits.maxItems", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "batch",
				type: "notice.show",
				forEach: { items: { $expr: "vars.tasks" } },
				input: { message: "{{item}}" },
			},
		];
		loaded.workflow!.vars = { tasks: ["one", "two", "three"] };
		loaded.workflow!.run.limits.maxItems = 2;
		const engine = new WorkflowEngine(new StepRegistry(), () => null);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toBe("forEach selected 3 items, above run.limits.maxItems 2.");
		expect(run.steps).toHaveLength(1);
		expect(run.steps[0]?.status).toBe("failed");
	});

	it("resolves expressions for step input and keeps source input for audit", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "schedule",
				type: "task.setScheduled",
				input: {
					task: "{{event.after.path}}",
					date: { $expr: 'date(event.after.due) - duration("7d")' },
				},
			},
		];
		const api = {
			tasks: {
				setScheduled: vi.fn(),
			},
		} as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(new StepRegistry(), () => api);

		const run = await engine.runWorkflow(loaded, {
			dryRun: true,
			trigger: {
				type: "tasknotes.event",
				event: "task.due.changed",
				after: { path: "Tasks/a.md", due: "2026-06-14" },
			},
		});

		expect(run.status).toBe("success");
		expect(run.steps[0]?.sourceInput).toEqual({
			task: "{{event.after.path}}",
			date: { $expr: 'date(event.after.due) - duration("7d")' },
		});
		expect(run.steps[0]?.input).toEqual({ task: "Tasks/a.md", date: "2026-06-07" });
		expect(run.steps[0]?.output).toEqual({
			dryRun: true,
			wouldRun: "task.setScheduled",
			input: { task: "Tasks/a.md", date: "2026-06-07" },
		});
	});

	it("runs forEach from structured list expressions", async () => {
		const loaded = workflow();
		loaded.workflow!.vars = { tasks: ["one", "two", "three"] };
		loaded.workflow!.steps = [
			{
				id: "notice",
				type: "notice.show",
				forEach: { items: { $expr: "vars.tasks.slice(0, 2)" }, as: "task" },
				input: { message: "{{item}}" },
			},
		];
		const engine = new WorkflowEngine(new StepRegistry(), () => null);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("success");
		expect(run.steps).toHaveLength(2);
		expect(run.steps.map((step) => step.input)).toEqual([{ message: "one" }, { message: "two" }]);
	});

	it("runs canonical TaskNotes runtime task queries", async () => {
		const loaded = workflow();
		const query = {
			where: { field: "task.projects", op: "contains", value: "Project A" },
			sort: [{ field: "task.due", direction: "asc" }],
			limit: 25,
		};
		loaded.workflow!.steps = [
			{
				id: "query",
				type: "task.query",
				input: { query },
			},
		];
		const normalizedQuery = {
			...query,
			offset: 0,
			group: [],
			scope: { includeArchived: false },
		};
		const queryTasks = vi.fn(async () => ({
			tasks: [{ path: "Tasks/a.md", projects: ["Project A"] }],
			total: 2,
			matched: 1,
			returned: 1,
			groups: [{ key: "default", label: "All tasks", taskPaths: ["Tasks/a.md"] }],
			query: normalizedQuery,
			warnings: [],
		}));
		const listTasks = vi.fn();
		const api = {
			query: {
				tasks: queryTasks,
			},
			tasks: { list: listTasks },
		} as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(new StepRegistry(), () => api);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("success");
		expect(queryTasks).toHaveBeenCalledWith(query);
		expect(listTasks).not.toHaveBeenCalled();
		expect(run.steps[0]?.output).toEqual({
			tasks: [{ path: "Tasks/a.md", projects: ["Project A"] }],
			count: 1,
			total: 2,
			matched: 1,
			returned: 1,
			groups: [{ key: "default", label: "All tasks", taskPaths: ["Tasks/a.md"] }],
			groupPaths: { default: ["Tasks/a.md"] },
			query: normalizedQuery,
			warnings: [],
		});
	});

	it("rejects compact task query objects", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "query",
				type: "task.query",
				input: { query: { status: "active" } },
			},
		];
		const queryTasks = vi.fn();
		const api = {
			query: {
				tasks: queryTasks,
			},
		} as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(new StepRegistry(), () => api);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toBe("task.query requires a TaskNotes runtime query object.");
		expect(queryTasks).not.toHaveBeenCalled();
	});

	it("records typed TaskNotes API error details in failed step runs", async () => {
		const loaded = workflow();
		const apiError = Object.assign(new Error("Task not found: Tasks/a.md"), {
			name: "TaskNotesApiError" as const,
			code: "task_not_found",
			message: "Task not found: Tasks/a.md",
			status: 404,
			details: { path: "Tasks/a.md" },
		});
		const api = {
			tasks: {
				patch: vi.fn(async () => {
					throw apiError;
				}),
			},
			errors: {
				isApiError: vi.fn((error) => error === apiError),
				normalize: vi.fn(() => apiError),
			},
		} as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(new StepRegistry(), () => api);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toBe("task_not_found: Task not found: Tasks/a.md");
		expect(run.steps[0]).toEqual(
			expect.objectContaining({
				status: "failed",
				error: "task_not_found: Task not found: Tasks/a.md",
				errorCode: "task_not_found",
				errorStatus: 404,
				errorDetails: { path: "Tasks/a.md" },
			})
		);
	});
});
