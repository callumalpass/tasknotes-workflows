import { describe, expect, it } from "vitest";
import {
	createTaskNotesEventTrigger,
	normalizeWorkflowIdInput,
	slugifyWorkflowId,
} from "../src/workflowScaffolding";

describe("workflow editor normalization", () => {
	it("preserves a trailing hyphen while an ID is being typed", () => {
		expect(normalizeWorkflowIdInput("foo-")).toBe("foo-");
		expect(normalizeWorkflowIdInput("Foo-Bar")).toBe("foo-bar");
		expect(slugifyWorkflowId("foo-")).toBe("foo");
	});

	it("removes status filters when the selected event is not a status change", () => {
		expect(createTaskNotesEventTrigger({
			id: "when-recurring",
			event: "recurring.instance.completed",
			from: "open",
			to: "active",
		})).toEqual({
			id: "when-recurring",
			type: "tasknotes.event",
			event: "recurring.instance.completed",
			from: undefined,
			to: undefined,
			path: undefined,
			allowSelfTrigger: undefined,
		});
	});
});
