import { describe, expect, it, vi } from "vitest";
import { InMemoryInteropBridge, type ActionContractArtifact, type ActionHandlerContext } from "@callumalpass/mdbase-interop";
import { validateRuntimeRecord } from "@callumalpass/mdbase-runtime";
import { RuntimeWorkflowExecutor } from "../src/runtimeExecutor";
import { TaskNotesBridge } from "../src/tasknotesBridge";
import { StepRegistry } from "../src/stepRegistry";
import { parseWorkflowDefinition } from "../src/workflowParser";
import type { LoadedWorkflow } from "../src/types";

it("derives interop item keys from run idempotency and keeps exact outcome identities", async () => {
	const bridge = new InMemoryInteropBridge({ authorize: () => true });
	const client = bridge.connect({ application: "workflows", implementation: "client", version: "1.0.0" });
	const provider = bridge.connect({ application: "provider", implementation: "client", version: "1.0.0" });
	const contract: ActionContractArtifact = { kind: "mdbase.contract", contract_type: "action", id: "test.action", version: "1.0.0", input_schema: { dialect: "json-schema-2020-12", value: { type: "object" } } };
	const handler = vi.fn(async (_input: unknown, context: ActionHandlerContext) => ({ key: context.invocation.idempotency_key }));
	await provider.registerActionProvider({ declaration_id: "actions", handlers: [{ handler_id: "action", contract, handler }] });
	const pluginBridge = new TaskNotesBridge({ plugins: { getPlugin: () => ({ api: { apiVersion: 1, interop: { profileVersion: "0.1", connect: () => client, describe: () => bridge.describe() }, getInteropStatus: () => ({ enabled: true }) } }) } } as never, {} as never);
	const workflow = { ...parseWorkflowDefinition({ type: "runtime_workflow", id: "test", version: "1.0.0", name: "Test", enabled: true,
		triggers: [{ id: "m", event: { id: "manual", version: "1.0.0" }, "x-tasknotes": { type: "manual" } }],
		steps: [{ id: "each", action: { id: "test.action", version: "^1.0.0" }, for_each: { items: ["a", "b"] }, input: { item: { $expr: "item" } } }],
		run: { idempotency: { key: "business-key" } }, "x-tasknotes": { format_version: 2 } }, ""), file: { path: "test.md" }, body: "", source: "" } as LoadedWorkflow;
	const executor = new RuntimeWorkflowExecutor(new StepRegistry(), () => null, () => null, () => pluginBridge);
	const result = await executor.run(workflow, { manual: true, trigger: { type: "manual" } });
	expect(result.error).toBeUndefined();
	expect(result.runtime?.status).toBe("succeeded");
	expect(result.steps.map((step) => step.output)).toEqual([{ key: "business-key:each:0" }, { key: "business-key:each:1" }]);
	for (const attempt of result.attempts ?? []) {
		expect(attempt.invocation_id).toBe(attempt.outcome?.invocation_id);
		expect(attempt.provider.application).toBe("provider");
		expect(validateRuntimeRecord(attempt).valid).toBe(true);
	}
	await bridge.dispose();
});

describe("legacy expression execution", () => {
	it("executes v1 runtime records directly with the Bases evaluator", async () => {
		const parsed = parseWorkflowDefinition({ type: "runtime_workflow", id: "legacy", version: "1.0.0", name: "Legacy", enabled: true,
			"x-tasknotes": { format_version: 1 },
			triggers: [{ id: "manual", event: { id: "manual", version: "1.0.0" }, "x-tasknotes": { type: "manual" } }],
			steps: [{ id: "show", action: { id: "notice.show", version: "1.0.0" }, input: { message: { $expr: 'if(true, "Bases", "other")' } } }],
		}, "");
		expect(parsed.workflow).not.toBeNull();
		const loaded = { ...parsed, file: { path: "legacy.md" }, body: "", source: "" } as LoadedWorkflow;
		if (loaded.workflow) loaded.workflow.steps = []; // The UI projection must not drive execution.
		const registry = new StepRegistry(); const handler = vi.fn(async (input: unknown) => input);
		registry.register({ ...registry.get("notice.show")!, run: handler });
		const result = await new RuntimeWorkflowExecutor(registry, () => null, () => null, () => null).run(loaded, { manual: true, trigger: { type: "manual" } });
		expect(result.runtime?.status).toBe("succeeded"); expect(handler.mock.calls[0]?.[0]).toEqual({ message: "Bases" });
	});
});
