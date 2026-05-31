import { describe, expect, it } from "vitest";
import { parseMarkdownFrontmatter } from "../src/frontmatter";
import { parseWorkflowDefinition } from "../src/workflowParser";

describe("workflow parser", () => {
	it("parses a valid workflow definition", () => {
		const markdown = `---
type: tasknotes-workflow
schemaVersion: 1
id: auto-start
name: Auto start
enabled: true
triggers:
  - id: status
    type: tasknotes.event
    event: task.status.changed
    to: active
steps:
  - id: start
    type: time.start
    input:
      task: "{{trigger.after.path}}"
run:
  mode: sequential
  noOverlap: true
  source: tasknotes-workflows
  onError: stop
---

# Auto start
`;

		const parsed = parseMarkdownFrontmatter(markdown);
		const result = parseWorkflowDefinition(parsed.data, markdown);

		expect(result.diagnostics).toEqual([]);
		expect(result.workflow?.id).toBe("auto-start");
		expect(result.workflow?.triggers[0]?.type).toBe("tasknotes.event");
		expect(result.workflow?.steps[0]?.type).toBe("time.start");
	});

	it("rejects missing required fields", () => {
		const result = parseWorkflowDefinition({ type: "tasknotes-workflow" }, "");

		expect(result.workflow).toBeNull();
		expect(result.diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
	});

	it("accepts additional Obsidian workspace events", () => {
		const result = parseWorkflowDefinition(
			{
				type: "tasknotes-workflow",
				schemaVersion: 1,
				id: "active-leaf",
				name: "Active leaf",
				enabled: true,
				triggers: [
					{ id: "leaf", type: "obsidian.workspace", event: "active-leaf-change", path: { glob: "**/*.md" } },
				],
				steps: [{ id: "notice", type: "notice.show", input: { message: "Changed" } }],
				run: { mode: "sequential", noOverlap: true, source: "tasknotes-workflows", onError: "stop" },
			},
			""
		);

		expect(result.diagnostics).toEqual([]);
		expect(result.workflow?.triggers[0]).toMatchObject({
			type: "obsidian.workspace",
			event: "active-leaf-change",
		});
	});
});
