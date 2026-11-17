import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CloudEvent } from "@callumalpass/mdbase-interop";
import { WorkflowScheduler } from "../src/scheduler";
import { RuntimeStateStore } from "../src/runtimeState";
import { parseWorkflowDefinition } from "../src/workflowParser";
import { DEFAULT_SETTINGS } from "../src/settings";
import { cronMatches } from "../src/cron";
import type { LoadedWorkflow, WorkflowRunOptions } from "../src/types";

function workflow(enabled = true): LoadedWorkflow {
	return { ...parseWorkflowDefinition({ type: "runtime_workflow", id: "test", version: "1.0.0", name: "Test", enabled,
		triggers: [{ id: "change", event: { id: "test.changed", version: "1.0.0" } }], steps: [{ id: "show", action: { id: "notice.show", version: "1.0.0" } }], "x-tasknotes": { format_version: 2 } }, ""), file: { path: "test.md" }, body: "", source: "" } as LoadedWorkflow;
}
function setup(workflows = [workflow()], automaticEnabled = () => true, state = new RuntimeStateStore()) {
	const run = vi.fn<(workflow: LoadedWorkflow, options: WorkflowRunOptions) => Promise<never>>().mockResolvedValue({} as never);
	const scheduler = new WorkflowScheduler({} as never, {} as never, () => DEFAULT_SETTINGS, () => workflows, run, automaticEnabled, state);
	return { scheduler, run };
}
beforeEach(() => { vi.stubGlobal("window", globalThis); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("runtime trigger admission", () => {
	it("does not run or log disabled contract event workflows", async () => {
		const { scheduler, run } = setup([workflow(false), workflow(true)]);
		await scheduler["handleContractEvent"]("test.changed\u00001.0.0", { id: "event", type: "test.changed", data: {}, mdbaseapplication: "test" } as CloudEvent);
		expect(run).toHaveBeenCalledTimes(1);
	});
	it("allows manual runs with automatic execution off", async () => {
		const current = workflow();
		const { scheduler, run } = setup([current], () => false);
		await scheduler["handleContractEvent"]("test.changed\u00001.0.0", { id: "event", type: "test.changed", data: {} } as CloudEvent);
		expect(run).not.toHaveBeenCalled();
		await scheduler.runManual(current);
		expect(run).toHaveBeenCalledTimes(1);
	});
	it("debounces to the latest event and persists minimum interval suppression", async () => {
		vi.useFakeTimers();
		const current = workflow();
		delete current.runtime;
		Object.assign(current.workflow!.triggers[0]!, { debounce: "100ms", minimumInterval: "1s" });
		const store = new RuntimeStateStore();
		const { scheduler, run } = setup([current], () => true, store);
		const first = scheduler["runAutomatic"](current, { trigger: { id: "change", type: "event", data: 1 } });
		const second = scheduler["runAutomatic"](current, { trigger: { id: "change", type: "event", data: 2 } });
		await vi.advanceTimersByTimeAsync(100); await Promise.all([first, second]);
		expect(run).toHaveBeenCalledTimes(1);
		expect(run.mock.calls[0]?.[1]).toMatchObject({ trigger: { data: 2 } });
		const restarted = setup([current], () => true, store);
		const third = restarted.scheduler["runAutomatic"](current, { trigger: { id: "change", type: "event" } });
		await vi.advanceTimersByTimeAsync(100); await third;
		expect(restarted.run).not.toHaveBeenCalled();
	});
	it("fires a missed cron once after restart and observes timezone", async () => {
		const state = new RuntimeStateStore();
		const first = setup([], () => true, state).scheduler;
		expect(await first["shouldRunCron"]("w", "t", "0 9 * * *", new Date("2026-11-16T21:30:00Z"), "Australia/Melbourne")).toBe(false);
		const restarted = setup([], () => true, state).scheduler;
		const now = new Date("2026-11-17T01:00:00Z");
		expect(await restarted["shouldRunCron"]("w", "t", "0 9 * * *", now, "Australia/Melbourne")).toBe(true);
		expect(await restarted["shouldRunCron"]("w", "t", "0 9 * * *", now, "Australia/Melbourne")).toBe(false);
		expect(cronMatches("0 9 * * *", new Date("2026-11-16T22:00:00Z"), "Australia/Melbourne")).toBe(true);
	});
	it("coalesces interval downtime into one fire", async () => {
		vi.useFakeTimers(); vi.setSystemTime(1000);
		const state = new RuntimeStateStore(); const first = setup([], () => true, state).scheduler;
		expect(await first["shouldRunInterval"]("w", "t", "1m")).toBe(true);
		vi.setSystemTime(1000 + 12 * 60_000);
		const next = setup([], () => true, state).scheduler;
		expect(await next["shouldRunInterval"]("w", "t", "1m")).toBe(true);
		expect(await next["shouldRunInterval"]("w", "t", "1m")).toBe(false);
	});
});
