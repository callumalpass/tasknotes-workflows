import { describe, expect, it } from "vitest";
import { conditionMatches } from "../src/conditions";
import { resolveTemplateValue } from "../src/template";
import type { WorkflowRunContext } from "../src/types";

const context: WorkflowRunContext = {
	workflow: { id: "wf", name: "Workflow", filePath: "TaskNotes/Workflows/wf.md" },
	trigger: {
		type: "tasknotes.event",
		event: "task.status.changed",
		after: { path: "Tasks/a.md", status: "active" },
	},
	vars: {},
	steps: {
		query: { tasks: [{ path: "Tasks/a.md" }] },
	},
	now: "2026-05-31T10:00:00.000Z",
	today: "2026-05-31",
};

describe("template references", () => {
	it("preserves exact reference values", () => {
		expect(resolveTemplateValue("{{steps.query.tasks}}", context)).toEqual([
			{ path: "Tasks/a.md" },
		]);
	});

	it("interpolates embedded references", () => {
		expect(resolveTemplateValue("Task {{trigger.after.path}} is {{trigger.after.status}}", context)).toBe(
			"Task Tasks/a.md is active"
		);
	});

	it("evaluates conditions against context", () => {
		expect(
			conditionMatches(
				{ field: "trigger.after.status", operator: "is", value: "active" },
				context
			)
		).toBe(true);
	});
});
