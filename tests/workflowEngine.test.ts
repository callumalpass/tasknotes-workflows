import { describe, expect, it, vi } from "vitest";
import { StepRegistry } from "../src/stepRegistry";
import { WorkflowEngine } from "../src/workflowEngine";
import type { LoadedWorkflow, TaskNotesRuntimeApi } from "../src/types";

function workflow(): LoadedWorkflow {
	return {
		file: { path: "TaskNotes/Workflows/test.md", basename: "test" } as LoadedWorkflow["file"],
		body: "",
		source: "",
		diagnostics: [],
		workflow: {
			type: "tasknotes-workflow",
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
				noOverlap: true,
				source: "tasknotes-workflows",
				maxTasks: 5,
				onError: "stop",
			},
		},
	};
}

describe("workflow engine", () => {
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

	it("fails batch steps that exceed run.maxTasks", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "batch",
				type: "notice.show",
				forEach: "{{vars.tasks}}",
				input: { message: "{{item}}" },
			},
		];
		loaded.workflow!.vars = { tasks: ["one", "two", "three"] };
		loaded.workflow!.run.maxTasks = 2;
		const engine = new WorkflowEngine(new StepRegistry(), () => null);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("failed");
		expect(run.error).toBe("forEach selected 3 items, above run.maxTasks 2.");
		expect(run.steps).toHaveLength(1);
		expect(run.steps[0]?.status).toBe("failed");
	});

	it("supports contains filters in task.query", async () => {
		const loaded = workflow();
		loaded.workflow!.steps = [
			{
				id: "query",
				type: "task.query",
				input: {
					query: {
						projects: { operator: "contains", value: "Project A" },
					},
				},
			},
		];
		const api = {
			tasks: {
				list: vi.fn(async () => [
					{ path: "Tasks/a.md", projects: ["Project A"] },
					{ path: "Tasks/b.md", projects: ["Project B"] },
				]),
			},
		} as unknown as TaskNotesRuntimeApi;
		const engine = new WorkflowEngine(new StepRegistry(), () => api);

		const run = await engine.runWorkflow(loaded, {
			trigger: { type: "manual", event: "manual" },
		});

		expect(run.status).toBe("success");
		expect(run.steps[0]?.output).toEqual({
			tasks: [{ path: "Tasks/a.md", projects: ["Project A"] }],
			count: 1,
		});
	});
});
