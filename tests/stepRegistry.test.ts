import { describe, expect, it } from "vitest";
import { StepRegistry } from "../src/stepRegistry";

describe("step registry", () => {
	it("describes expected inputs and outputs for editor scaffolding", () => {
		const registry = new StepRegistry();
		const patch = registry.get("task.patch");
		const startTimer = registry.get("time.start");
		const subtasks = registry.get("task.subtasks");
		const createNote = registry.get("obsidian.createNote");

		expect(patch?.inputFields.map((field) => field.key)).toEqual(["task", "patch"]);
		expect(patch?.outputFields.map((field) => field.key)).toEqual(["task", "path"]);
		expect(startTimer?.category).toBe("Time tracking");
		expect(startTimer?.inputFields.some((field) => field.key === "options.description")).toBe(true);
		expect(subtasks?.category).toBe("Task relationships");
		expect(subtasks?.outputFields.map((field) => field.key)).toEqual(["tasks", "count"]);
		expect(createNote?.category).toBe("Obsidian");
		expect(createNote?.inputFields.map((field) => field.key)).toEqual(["path", "content"]);
		expect(createNote?.mutatesTasks).toBe(false);
		expect(createNote?.writesVault).toBe(true);
	});
});
