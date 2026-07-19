import { describe, expect, it } from "vitest";
import { conditionMatches } from "../src/conditions";
import { resolveTemplateValue } from "../src/template";
import type { WorkflowRunContext } from "../src/types";

const context: WorkflowRunContext = {
	workflow: { id: "wf", name: "Workflow", filePath: "TaskNotes/Workflows/wf.md" },
	trigger: {
		id: "status",
		type: "tasknotes.event",
		event: "task.status.changed",
	},
	event: {
		type: "task.status.changed",
		triggerType: "tasknotes.event",
		after: { path: "Tasks/a.md", status: "active", due: "2026-06-14" },
	},
	vars: {},
	steps: {
		query: { status: "success", output: { tasks: [{ path: "Tasks/a.md" }] } },
	},
	now: "2026-05-31T10:00:00.000Z",
	today: "2026-05-31",
};

describe("template references", () => {
	it("preserves exact reference values", () => {
		expect(resolveTemplateValue("{{steps.query.output.tasks}}", context)).toEqual([
			{ path: "Tasks/a.md" },
		]);
	});

	it("interpolates embedded references", () => {
		expect(resolveTemplateValue("Task {{event.after.path}} is {{event.after.status}}", context)).toBe(
			"Task Tasks/a.md is active"
		);
	});

	it("evaluates conditions against context", () => {
		expect(
			conditionMatches(
				{ field: "event.after.status", operator: "is", value: "active" },
				context
			)
		).toBe(true);
	});

	it("evaluates structured date expressions", () => {
		expect(
			resolveTemplateValue(
				{ $expr: 'date(event.after.due) - duration("7d")' },
				context
			)
		).toBe("2026-06-07");
	});

	it("evaluates expressions against workflow globals", () => {
		expect(
			resolveTemplateValue(
				{ $expr: 'date(today) + duration("1w")' },
				context
			)
		).toBe("2026-06-07");
	});

	it("transforms text without evaluating arbitrary code", () => {
		expect(() => resolveTemplateValue("{{dateAdd(event.after.due, -7, 'day')}}", context)).toThrow(
			"Unsupported workflow reference"
		);
	});

	it("throws on unresolved references", () => {
		expect(() => resolveTemplateValue("Task {{event.after.missing}}", context)).toThrow(
			"Unresolved workflow reference: event.after.missing"
		);
	});
});
