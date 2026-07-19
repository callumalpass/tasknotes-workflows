import { describe, expect, it, vi } from "vitest";
import type { MdbaseRuntimeHostApi } from "@callumalpass/mdbase-runtime";
import { StepRegistry } from "../src/stepRegistry";
import { WorkflowEngine } from "../src/workflowEngine";
import type { LoadedWorkflow, TaskNotesRuntimeApi } from "../src/types";

function workflow(): LoadedWorkflow {
	return {
		file: { path: "TaskNotes/Workflows/test.md", basename: "test" } as LoadedWorkflow["file"],
		body: "",
		source: "",
		sourceFormat: "runtime-v0.1",
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
	it("dispatches registered actions through the mdbase runtime host", async () => {
		const loaded = workflow();
		const localPatch = vi.fn();
		const dispatch = vi.fn(async () => ({ path: "Tasks/a.md", status: "active" }));
		const runtime = {
			contracts: () => [{ type: "action", id: "task.patch" }],
			preflight: () => ({ valid: true, diagnostics: [] }),
			dispatch,
		} as unknown as MdbaseRuntimeHostApi;
		const engine = new WorkflowEngine(
			new StepRegistry(),
			() => ({ tasks: { patch: localPatch } }) as unknown as TaskNotesRuntimeApi,
			() => null,
			(key) => key,
			() => runtime
		);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual", correlationId: "corr-1" },
		});

		expect(run.status).toBe("success");
		expect(dispatch).toHaveBeenCalledWith(
			"task.patch",
			{ task: "Tasks/a.md", patch: { status: "active" } },
			expect.objectContaining({
				origin: { workflow: "test", path: "TaskNotes/Workflows/test.md" },
				correlation_id: "corr-1",
				executor: "tasknotes-workflows",
			})
		);
		expect(localPatch).not.toHaveBeenCalled();
	});

	it("does not bypass a runtime policy denial through the local step adapter", async () => {
		const localPatch = vi.fn();
		const dispatch = vi.fn();
		const runtime = {
			contracts: () => [{ type: "action", id: "task.patch" }],
			preflight: () => ({
				valid: false,
				diagnostics: [{ code: "capability_denied", message: "Denied by policy", severity: "error" as const }],
			}),
			dispatch,
		} as unknown as MdbaseRuntimeHostApi;
		const engine = new WorkflowEngine(
			new StepRegistry(),
			() => ({ tasks: { patch: localPatch } }) as unknown as TaskNotesRuntimeApi,
			() => null,
			(key) => key,
			() => runtime
		);

		const run = await engine.runWorkflow(workflow(), {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toContain("capability_denied");
		expect(localPatch).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it("does not bypass the runtime host when action preflight throws", async () => {
		const localPatch = vi.fn();
		const dispatch = vi.fn();
		const runtime = {
			contracts: () => [{ type: "action", id: "task.patch" }],
			preflight: () => { throw new Error("Host policy unavailable"); },
			dispatch,
		} as unknown as MdbaseRuntimeHostApi;
		const engine = new WorkflowEngine(
			new StepRegistry(),
			() => ({ tasks: { patch: localPatch } }) as unknown as TaskNotesRuntimeApi,
			() => null,
			(key) => key,
			() => runtime
		);

		const run = await engine.runWorkflow(workflow(), {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toContain("Host policy unavailable");
		expect(localPatch).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	it("fails workflow preflight before any step runs", async () => {
		const loaded = workflow();
		loaded.workflow!.requires = {
			providers: [{ id: "canvas-bases", version: ">=1.0.0" }],
			capabilities: ["task.patch"],
		};
		const patch = vi.fn();
		const preflight = vi.fn(() => ({
			valid: false,
			diagnostics: [
				{ code: "provider_unavailable", message: "Required provider canvas-bases is not registered.", severity: "error" as const },
			],
		}));
		const api = { tasks: { patch } } as unknown as TaskNotesRuntimeApi;
		const runtime = { preflight } as unknown as MdbaseRuntimeHostApi;
		const engine = new WorkflowEngine(
			new StepRegistry(),
			() => api,
			() => null,
			(key) => key,
			() => runtime
		);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toContain("provider_unavailable");
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
