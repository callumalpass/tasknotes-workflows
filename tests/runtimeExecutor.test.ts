import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateRuntimeRecord } from "@callumalpass/mdbase-runtime";
import { StepRegistry } from "../src/stepRegistry";
import { RuntimeWorkflowExecutor } from "../src/runtimeExecutor";
import { parseWorkflowDefinition } from "../src/workflowParser";
import { RuntimeStateStore, RESERVATION_RETENTION_MS } from "../src/runtimeState";
import { resolveCel, evaluateVariables } from "../src/cel";
import type { LoadedWorkflow, StepDefinition, WorkflowRunDetail, WorkflowRunOptions } from "../src/types";
import type { CloudEvent } from "@callumalpass/mdbase-interop";

function loaded(overrides: Record<string, unknown> = {}): LoadedWorkflow {
	const parsed = parseWorkflowDefinition({
		type: "runtime_workflow", id: "test", version: "1.0.0", name: "Test", enabled: true,
		"x-tasknotes": { format_version: 2 },
		triggers: [{ id: "event", event: { id: "task.updated", version: "1.0.0" } }],
		steps: [{ id: "first", action: { id: "test.action", version: "1.0.0" }, input: { message: { $expr: "event.data.after.status" } } }],
		...overrides,
	}, "");
	expect(parsed.diagnostics).toEqual([]);
	return { ...parsed, file: { path: "Workflows/test.md" }, body: "", source: "" } as LoadedWorkflow;
}
function event(id = "one"): WorkflowRunOptions {
	return { trigger: { id: "event", type: "task.updated", cloudEvent: {
		id, type: "task.updated", time: "2026-11-17T01:00:00Z", source: "obsidian://tasknotes", specversion: "1.0",
		data: { after: { status: "active" } }, datacontenttype: "application/json", dataschema: "task.updated/1.0.0",
		mdbaseprofile: "0.1", mdbasecontractversion: "1.0.0", mdbasecontractdigest: `sha256:${"a".repeat(64)}`,
		mdbaseapplication: "tasknotes", mdbaseimplementation: "tasknotes-v5", mdbaseimplementationversion: "5.0.0-beta.13",
	} satisfies CloudEvent } };
}
function setup(run: StepDefinition["run"] = async (input) => input, store = new RuntimeStateStore()) {
	const registry = new StepRegistry();
	registry.register({ type: "test.action", run } as StepDefinition);
	const evidence: WorkflowRunDetail[] = [];
	const executor = new RuntimeWorkflowExecutor(registry, () => null, () => null, () => null, store, async (detail) => { evidence.push(structuredClone(detail)); });
	return { executor, evidence };
}
function deferred() {
	let resolve: (value?: unknown) => void = () => {};
	const promise = new Promise<unknown>((done) => { resolve = done; });
	return { promise, resolve };
}

beforeEach(() => { vi.stubGlobal("window", globalThis); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("CEL runtime", () => {
	it("evaluates CEL maps, lists, macros, dates and literal strings with strict expression objects", () => {
		expect(resolveCel({ $expr: '[1, 2, 3].filter(x, x > 1).map(x, x * 2)' }, {})).toEqual([4, 6]);
		expect(resolveCel({ $expr: 'today().addDays(2)' }, {}, { now: new Date("2026-11-17T00:00:00Z"), timezone: "UTC" })).toBe("2026-11-19");
		expect(resolveCel("{{event.after.path}}", {})).toBe("{{event.after.path}}");
		expect(resolveCel({ $expr: "bad", literal: true }, {})).toEqual({ $expr: "bad", literal: true });
		expect(() => resolveCel({ $expr: "1 / 0" }, {})).toThrow();
	});
	it("orders dependent variables and rejects cycles", () => {
		expect(evaluateVariables({ b: { $expr: 'vars.a + "!"' }, a: "hello" }, {})).toEqual({ a: "hello", b: "hello!" });
		expect(() => evaluateVariables({ a: { $expr: "vars.b" }, b: { $expr: "vars.a" } }, {})).toThrow(/Cyclic/);
	});
	it("does not record automatic runs whose trigger condition does not match", async () => {
		const run = vi.fn(async (input) => input);
		const { executor, evidence } = setup(run);
		const workflow = loaded({ triggers: [{ id: "event", event: { id: "task.updated", version: "1.0.0" }, if: { $expr: 'event.data.after.status == "done"' } }] });
		const result = await executor.run(workflow, event());
		expect(result.notAdmitted).toBe(true);
		expect(evidence).toEqual([]);
		expect(run).not.toHaveBeenCalled();
		const manual = await executor.run(workflow, { ...event("two"), manual: true });
		expect(manual.notAdmitted).toBe(false);
		expect(evidence).toHaveLength(1);
	});
	it("executes runtime fields directly and writes schema-valid run and attempt evidence before dispatch", async () => {
		const run = vi.fn(async (input) => input);
		const { executor, evidence } = setup(run);
		const result = await executor.run(loaded(), event());
		expect(result.runtime?.status).toBe("succeeded");
		expect(run.mock.calls[0]?.[0]).toEqual({ message: "active" });
		expect(evidence.some((detail) => detail.attempts?.[0]?.status === "dispatching")).toBe(true);
		expect(validateRuntimeRecord(result.runtime)).toMatchObject({ valid: true });
		expect(validateRuntimeRecord(result.attempts?.[0])).toMatchObject({ valid: true });
	});
	it("honors trigger if and rejects non-boolean conditions", async () => {
		const run = vi.fn(); const { executor } = setup(run);
		const trigger = (source: string) => [{ id: "event", event: { id: "task.updated", version: "1.0.0" }, if: { $expr: source } }];
		expect((await executor.run(loaded({ triggers: trigger('event.data.after.status == "done"') }), event())).runtime?.status).toBe("cancelled");
		expect((await executor.run(loaded({ triggers: trigger('"active"') }), event())).status).toBe("failed");
		expect(run).not.toHaveBeenCalled();
	});
	it("does not consume minimum interval on a false guard, and manual runs bypass automatic throttling", async () => {
		const run = vi.fn(async () => "done"); const { executor } = setup(run);
		const trigger = { id: "event", event: { id: "task.updated", version: "1.0.0" }, minimum_interval: "1h", if: { $expr: 'event.data.after.status == "active"' } };
		const current = loaded({ triggers: [trigger] });
		const unmatched = event("false");
		if (unmatched.trigger.cloudEvent) unmatched.trigger.cloudEvent.data = { after: { status: "open" } };
		await executor.run(current, unmatched);
		expect((await executor.run(current, event("one"))).runtime?.status).toBe("succeeded");
		expect((await executor.run(current, event("two"))).runtime?.status).toBe("cancelled");
		await executor.run(current, { ...event("three"), manual: true });
		expect(run).toHaveBeenCalledTimes(2);
	});
	it("keeps each for_each output in order and enforces max_items", async () => {
		const { executor } = setup(async (input) => input);
		const steps = [{ id: "items", action: { id: "test.action", version: "1.0.0" }, for_each: { items: ["a", "b"] }, input: { value: { $expr: "item" } } }, { id: "after", action: { id: "test.action", version: "1.0.0" }, input: { output: { $expr: "steps.items.output" } } }];
		const result = await executor.run(loaded({ steps }), event());
		expect(result.steps[2]?.input).toEqual({ output: [{ value: "a" }, { value: "b" }] });
		const capped = await executor.run(loaded({ steps, run: { limits: { max_items: 1 } } }), event("two"));
		expect(capped.error).toMatch(/max_items/);
	});
	it("continues after failed actions with on_error but retains a failed run", async () => {
		const run = vi.fn(async () => { if (run.mock.calls.length === 1) throw new Error("rejected"); return "done"; });
		const { executor } = setup(run);
		const steps = ["a", "b"].map((id) => ({ id, action: { id: "test.action", version: "1.0.0" } }));
		const result = await executor.run(loaded({ steps, run: { on_error: "continue" } }), event());
		// Local failures are known failures, not lost transport outcomes.
		expect(result.runtime?.status).toBe("failed");
		expect(run).toHaveBeenCalledTimes(2);
	});
	it("checks timeout before dispatching subsequent steps", async () => {
		vi.useFakeTimers();
		const run = vi.fn(async () => { vi.advanceTimersByTime(20); return "done"; });
		const { executor } = setup(run);
		const steps = ["a", "b"].map((id) => ({ id, action: { id: "test.action", version: "1.0.0" } }));
		const result = await executor.run(loaded({ steps, run: { limits: { timeout: "10ms" } } }), event());
		expect(result.runtime?.status).toBe("failed"); expect(run).toHaveBeenCalledTimes(1);
	});
});

describe("persistent reservations", () => {
	it("survives restart, serializes competing admission, expires after retention, and persists before action", async () => {
		const files = new Map<string, string>();
		const app = { vault: { configDir: ".obsidian", adapter: { exists: async (path: string) => files.has(path), read: async (path: string) => files.get(path), write: async (path: string, text: string) => { files.set(path, text); } } } } as never;
		const store = new RuntimeStateStore(app);
		expect(await Promise.all([store.reserve("same", 0), store.reserve("same", 0)])).toEqual([true, false]);
		expect(await new RuntimeStateStore(app).reserve("same", 1)).toBe(false);
		expect(await store.reserve("same", RESERVATION_RETENTION_MS)).toBe(true);
		const run = vi.fn(async () => { expect([...files.values()].join()).toContain("test:one:event"); });
		await setup(run, store).executor.run(loaded(), event());
		await setup(run, new RuntimeStateStore(app)).executor.run(loaded(), event());
		expect(run).toHaveBeenCalledTimes(1);
	});
	it("does not dispatch if reservation persistence fails", async () => {
		const app = { vault: { configDir: ".obsidian", adapter: { exists: async () => false, write: async () => { throw new Error("disk full"); } } } } as never;
		const run = vi.fn();
		const result = await setup(run, new RuntimeStateStore(app)).executor.run(loaded(), event());
		expect(result.error).toBe("disk full"); expect(run).not.toHaveBeenCalled();
	});
});

describe("concurrency policies with expression-valued groups", () => {
	it.each(["skip", "queue", "replace", "allow"] as const)("implements %s", async (policy) => {
		const blocked = deferred();
		const run = vi.fn(async () => { if (run.mock.calls.length === 1) await blocked.promise; return "done"; });
		const { executor, evidence } = setup(run);
		const workflow = loaded({ run: { concurrency: { policy, group: { $expr: '"status:" + event.data.after.status' } } } });
		const first = executor.run(workflow, event("one"));
		await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1));
		const second = executor.run(workflow, event("two"));
		await vi.waitFor(() => expect(evidence.some((detail) => detail.runtime?.event_id === "two")).toBe(true));
		if (policy !== "allow") expect(run).toHaveBeenCalledTimes(1);
		blocked.resolve();
		const results = await Promise.all([first, second]);
		expect(run).toHaveBeenCalledTimes(policy === "skip" ? 1 : 2);
		expect(results[0]?.runtime?.status).toBe(policy === "replace" ? "cancelled" : "succeeded");
		expect(results[1]?.runtime?.status).toBe(policy === "skip" ? "cancelled" : "succeeded");
	});
});
