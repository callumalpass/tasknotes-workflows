import { describe, expect, it, vi } from "vitest";
import {
	createWorkflowsActionProvider,
	WORKFLOW_RUN_ACTION,
	WORKFLOW_RUN_CONTRACT,
} from "../src/interopProvider";

describe("TaskNotes Workflows interop provider", () => {
	it("declares a versioned action contract and preserves invocation trace context", async () => {
		const runWorkflow = vi.fn(async () => ({ status: "success" }));
		const provider = createWorkflowsActionProvider({ runWorkflow: runWorkflow as never });
		const handler = provider.handlers[0];

		expect(WORKFLOW_RUN_CONTRACT).toMatchObject({
			kind: "mdbase.contract",
			contract_type: "action",
			id: WORKFLOW_RUN_ACTION,
			version: "1.0.0",
		});
		expect(handler?.contract).toBe(WORKFLOW_RUN_CONTRACT);

		await handler?.handler(
			{ workflow_id: "daily-review", dry_run: true },
			{
				signal: new AbortController().signal,
				invocation: {
					caller: { application: "automation-ui" },
					correlation_id: "corr-1",
					admitted_at: "2026-07-28T01:00:00.000Z",
				},
			} as never,
		);

		expect(runWorkflow).toHaveBeenCalledWith("daily-review", {
			dryRun: true,
			trigger: {
				type: "contract.action",
				triggerType: "contract.action",
				event: WORKFLOW_RUN_ACTION,
				source: "automation-ui",
				correlationId: "corr-1",
				actualAt: "2026-07-28T01:00:00.000Z",
			},
		});
	});
});
