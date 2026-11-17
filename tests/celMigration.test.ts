import { describe, expect, it } from "vitest";
import { convertBases, migrateExpressions } from "../src/migrateExpressions";
import { parseWorkflowDefinition } from "../src/workflowParser";
import { resolveCel } from "../src/cel";

function legacy(input: unknown, conditions: unknown[] = []) {
	const parsed = parseWorkflowDefinition({ type: "workflow", schemaVersion: 1, id: "legacy", name: "Legacy", enabled: true, triggers: [{ id: "change", type: "tasknotes.event", event: "task.status.changed", from: "open", to: "active" }], conditions, steps: [{ id: "show", type: "notice.show", input }], run: { mode: "sequential", concurrency: { group: "workflow", policy: "skip" }, limits: { maxItems: 5 }, source: "tasknotes-workflows", onError: "stop" } }, "");
	if (!parsed.workflow) throw new Error(JSON.stringify(parsed.diagnostics));
	return parsed;
}
describe("CEL workflow migration", () => {
	it("converts templates including hyphenated ids, mixed text, Bases dates and conditions", () => {
		const { record, warnings } = migrateExpressions(legacy({ message: 'Task {{event.after.title}} ({{steps.some-step.output.count}})', due: { $expr: 'today() + duration("3d")' } }, [{ field: "event.after.status", operator: "is", value: "active" }]));
		expect(warnings).toEqual([]);
		expect(record.enabled).toBe(true);
		expect(record["x-tasknotes"]).toMatchObject({ format_version: 2 });
		expect(record.triggers[0]?.if?.$expr).toContain('event.data.after.status == "active"');
		expect(resolveCel(record.steps[0]?.input, { event: { data: { after: { title: "Review" } } }, steps: { "some-step": { output: { count: 2 } } } }, { now: new Date("2026-11-17T00:00:00Z") })).toEqual({ message: "Task Review (2)", due: "2026-11-20" });
	});
	it("converts exists/missing guards without invalid CEL has(index) macros", () => {
		const present = migrateExpressions(legacy({}, [{ field: "event.after.due", operator: "exists" }]));
		const absent = migrateExpressions(legacy({}, [{ field: "event.after.due", operator: "missing" }]));
		expect(resolveCel(present.record.triggers[0]?.if, { event: { data: { before: { status: "open" }, after: { status: "active", due: "2026-11-17" } } } })).toBe(true);
		expect(resolveCel(absent.record.triggers[0]?.if, { event: { data: { before: { status: "open" }, after: { status: "active" } } } })).toBe(true);
	});
	it("disables and explains unsupported Bases expressions without losing the review candidate", () => {
		const { record, warnings } = migrateExpressions(legacy({ message: { $expr: 'file("Notes/a.md").asFile().name' } }));
		expect(record.enabled).toBe(false);
		expect(warnings).toHaveLength(1);
		expect(record["x-tasknotes"]).toMatchObject({ format_version: 2, comment: expect.stringContaining("Manual conversion required") });
	});
	it("migrates runtime format v1 while retaining native policies and trigger conditions", () => {
		const parsed = legacy({ message: "{{event.after.title}}" });
		const runtime = { type: "runtime_workflow" as const, id: "legacy", version: "1.0.0", name: "Legacy", enabled: true, "x-tasknotes": { format_version: 1 }, triggers: [{ id: "change", event: { id: "task.status.changed", version: "1.0.0" }, if: { $expr: 'event.after.status == "active"' } }], steps: [{ id: "show", action: { id: "notice.show", version: "1.0.0" }, input: { message: "{{event.after.title}}" } }], run: { idempotency: { key: { $expr: "event.path" } } } };
		const { record } = migrateExpressions({ ...parsed, runtime });
		expect(record.run?.idempotency?.key).toEqual({ $expr: 'event.data["path"]' });
		expect(record.triggers[0]?.if?.$expr).toContain('event.data["after"]["status"]');
	});
	it("keeps format v1 on its legacy evaluator and recognizes v2 CEL without Bases validation", () => {
		const base = { type: "runtime_workflow", id: "cel", name: "CEL", version: "1.0.0", enabled: true, triggers: [{ id: "m", event: { id: "manual", version: "1.0.0" } }], steps: [{ id: "m", action: { id: "notice.show", version: "1.0.0" }, input: { message: { $expr: '[1,2].map(x, x + 1)' } } }] };
		expect(parseWorkflowDefinition({ ...base, "x-tasknotes": { format_version: 2 } }, "").workflow).not.toBeNull();
		expect(convertBases('date(event.after.due) - duration("1w")')).toBe('(date(event.data["after"]["due"])).addDays(-7)');
	});
});
