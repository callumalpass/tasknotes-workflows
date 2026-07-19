import { describe, expect, it } from "vitest";
import { validateCanonicalSchema } from "@callumalpass/mdbase-runtime";
import { parse } from "yaml";
import { parseMarkdownFrontmatter } from "../src/frontmatter";
import { parseWorkflowDefinition, workflowToFrontmatter } from "../src/workflowParser";

describe("workflow parser", () => {
	it("parses a valid workflow definition", () => {
		const markdown = `---
type: workflow
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
      task: "{{event.after.path}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
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
		expect(result.sourceFormat).toBe("tasknotes-v1");
	});

	it("writes canonical mdbase runtime workflow records and reads TaskNotes extensions", () => {
		const legacy = parseWorkflowDefinition({
			type: "tasknotes-workflow",
			schemaVersion: 1,
			id: "daily-review",
			name: "Daily review",
			enabled: false,
			triggers: [{ id: "daily", type: "cron", schedule: "0 9 * * *", timezone: "local" }],
			conditions: [{ field: "event.path", operator: "exists" }],
			steps: [{
				id: "show",
				type: "notice.show",
				forEach: "{{steps.query.tasks}}",
				input: { message: "{{event.path}}" },
			}],
			run: { mode: "sequential", noOverlap: true, maxTasks: 10, source: "tasknotes-workflows", onError: "stop" },
		}, "");
		expect(legacy.workflow).not.toBeNull();

		const frontmatter = workflowToFrontmatter(legacy.workflow!);
		const record = parse(frontmatter) as Record<string, unknown>;
		expect(validateCanonicalSchema("workflow", record)).toMatchObject({ valid: true });
		expect(record).toMatchObject({
			type: "workflow",
			version: 1,
			triggers: [{ id: "daily", event: "tasknotes-workflows.schedule.cron" }],
			steps: [{ id: "show", action: "notice.show", for_each: { items: { $expr: "steps.query.output.tasks" } } }],
			run: { limits: { max_items: 10 }, on_error: "stop" },
		});
		expect(record).not.toHaveProperty("schemaVersion");

		const canonical = parseWorkflowDefinition(record, frontmatter);
		expect(canonical.diagnostics).toEqual([]);
		expect(canonical.sourceFormat).toBe("runtime-v0.1");
		expect(canonical.workflow?.triggers[0]).toMatchObject({ type: "cron", schedule: "0 9 * * *" });
		expect(canonical.workflow?.steps[0]).toMatchObject({ type: "notice.show" });
		expect(canonical.workflow?.conditions).toEqual([{ field: "event.path", operator: "exists" }]);
	});

	it("rejects a noncanonical record that mixes runtime and TaskNotes version markers", () => {
		const result = parseWorkflowDefinition({
			type: "workflow",
			version: 1,
			schemaVersion: 1,
			id: "ambiguous",
			name: "Ambiguous",
			enabled: false,
			triggers: [],
			steps: [],
		}, "");
		expect(result.sourceFormat).toBe("unknown");
		expect(result.workflow).toBeNull();
	});

	it("rejects missing required fields", () => {
		const result = parseWorkflowDefinition({ type: "workflow" }, "");

		expect(result.workflow).toBeNull();
		expect(result.diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
	});

	it("accepts additional Obsidian workspace events", () => {
		const result = parseWorkflowDefinition(
			{
				type: "workflow",
				schemaVersion: 1,
				id: "active-leaf",
				name: "Active leaf",
				enabled: true,
				triggers: [
					{ id: "leaf", type: "obsidian.workspace", event: "active-leaf-change", path: { glob: "**/*.md" } },
				],
				steps: [{ id: "notice", type: "notice.show", input: { message: "Changed" } }],
				run: {
					mode: "sequential",
					concurrency: { group: "workflow", policy: "skip" },
					limits: { maxItems: 50 },
					source: "tasknotes-workflows",
					onError: "stop",
				},
			},
			""
		);

		expect(result.diagnostics).toEqual([]);
		expect(result.workflow?.triggers[0]).toMatchObject({
			type: "obsidian.workspace",
			event: "active-leaf-change",
		});
	});

	it("parses mdbase runtime event triggers and versioned provider requirements", () => {
		const result = parseWorkflowDefinition(
			{
				type: "workflow",
				schemaVersion: 1,
				id: "canvas-drop",
				name: "Canvas drop",
				enabled: true,
				requires: {
					providers: [{ id: "canvas-bases", version: ">=0.1.0 <1.0.0" }],
				},
				triggers: [
					{ id: "drop", type: "runtime.event", event: "canvas.drop", provider: "canvas-bases" },
				],
				steps: [{ id: "notice", type: "notice.show", input: { message: "Dropped" } }],
				run: {
					mode: "sequential",
					concurrency: { group: "workflow", policy: "skip" },
					limits: { maxItems: 50 },
					source: "tasknotes-workflows",
					onError: "stop",
				},
			},
			""
		);

		expect(result.diagnostics).toEqual([]);
		expect(result.workflow?.requires?.providers).toEqual([
			{ id: "canvas-bases", version: ">=0.1.0 <1.0.0" },
		]);
		expect(result.workflow?.triggers[0]).toMatchObject({
			type: "runtime.event",
			event: "canvas.drop",
			provider: "canvas-bases",
		});
	});

	it("accepts structured expressions in step inputs and forEach", () => {
		const result = parseWorkflowDefinition(
			{
				type: "workflow",
				schemaVersion: 1,
				id: "relative-date",
				name: "Relative date",
				enabled: true,
				triggers: [{ id: "manual", type: "manual" }],
				steps: [
					{
						id: "schedule",
						type: "task.setScheduled",
						forEach: { items: { $expr: "vars.tasks.slice(0, 5)" }, as: "task" },
						input: {
							task: "{{task.path}}",
							date: { $expr: 'date(event.after.due) - duration("1w")' },
						},
					},
				],
				run: {
					mode: "sequential",
					concurrency: { group: "workflow", policy: "skip" },
					limits: { maxItems: 50 },
					source: "tasknotes-workflows",
					onError: "stop",
				},
			},
			""
		);

		expect(result.diagnostics).toEqual([]);
		expect(result.workflow?.steps[0]?.forEach).toEqual({
			items: { $expr: "vars.tasks.slice(0, 5)" },
			as: "task",
		});
	});

	it("diagnoses invalid expression syntax", () => {
		const result = parseWorkflowDefinition(
			{
				type: "workflow",
				schemaVersion: 1,
				id: "bad-expression",
				name: "Bad expression",
				enabled: true,
				triggers: [{ id: "manual", type: "manual" }],
				steps: [
					{
						id: "notice",
						type: "notice.show",
						input: { message: { $expr: "date(" } },
					},
				],
				run: {
					mode: "sequential",
					concurrency: { group: "workflow", policy: "skip" },
					limits: { maxItems: 50 },
					source: "tasknotes-workflows",
					onError: "stop",
				},
			},
			""
		);

		expect(result.workflow).toBeNull();
		expect(
			result.diagnostics.some(
				(diagnostic) =>
					diagnostic.path === "steps[0].input.message.$expr" &&
					diagnostic.message.includes("Expected")
			)
		).toBe(true);
	});

	it("normalizes the released 0.1.x workflow shape", () => {
		const result = parseWorkflowDefinition(
			{
				type: "tasknotes-workflow",
				schemaVersion: 1,
				id: "legacy",
				name: "Legacy",
				enabled: true,
				triggers: [{ id: "status", type: "tasknotes.event", event: "task.status.changed" }],
				conditions: [{ $expr: 'trigger.after.status != "done"' }],
				steps: [
					{
						id: "notify",
						type: "notice.show",
						forEach: "{{steps.query-old.tasks}}",
						input: { message: "{{trigger.after.path}}" },
					},
				],
				run: { mode: "sequential", noOverlap: false, maxTasks: 10, source: "tasknotes-workflows", onError: "stop" },
			},
			""
		);

		expect(result.diagnostics).toEqual([]);
		expect(result.workflow?.type).toBe("workflow");
		expect(result.workflow?.conditions[0]).toEqual({ id: undefined, $expr: 'event.after.status != "done"' });
		expect(result.workflow?.steps[0]?.forEach).toEqual({ items: '{{steps["query-old"].output.tasks}}' });
		expect(result.workflow?.steps[0]?.input).toEqual({ message: "{{event.after.path}}" });
		expect(result.workflow?.run.concurrency.policy).toBe("allow");
		expect(result.workflow?.run.limits.maxItems).toBe(10);
	});
});
