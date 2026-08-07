import { describe, expect, it } from "vitest";
import {
	evaluateWorkflowExpression,
	validateExpressionTree,
	workflowExpressionSchema,
} from "../src/expressions";
import { StepRegistry } from "../src/stepRegistry";
import type { WorkflowRunContext } from "../src/types";

function context(): WorkflowRunContext {
	return {
		workflow: { id: "inherit-area", name: "Inherit area", filePath: "Workflows/inherit-area.md" },
		trigger: { id: "projects", type: "tasknotes.event" },
		event: {
			type: "task.projects.changed",
			after: {
				path: "20 actions/25 tasks/2026/08/Example.md",
				projects: ["20 actions/23 projects/Example.md"],
				customProperties: { area: ["Work"] },
			},
		},
		vars: {},
		steps: {},
		now: "2026-08-07T10:00:00.000Z",
		today: "2026-08-07",
	};
}

describe("workflow expressions", () => {
	it("validates and reads TaskNotes custom properties", () => {
		const expression = { $expr: "event.after.customProperties.area" };

		expect(validateExpressionTree(expression)).toEqual([]);
		expect(evaluateWorkflowExpression(expression, context())).toEqual(["Work"]);
	});

	it("accepts custom properties returned by a task relationship step", () => {
		const registry = new StepRegistry();
		const schema = workflowExpressionSchema({
			steps: [{ id: "read-parent", type: "task.parents", input: {} }],
			stepDefinitions: (type) => registry.get(type),
		});

		expect(validateExpressionTree({
			$expr: "steps.read-parent.output.tasks[0].customProperties.area",
		}, "$", schema)).toEqual([]);
	});
});
