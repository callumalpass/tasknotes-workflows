import { describe, expect, it, vi } from "vitest";
import { InMemoryRuntimeHost, type MdbaseRuntimeDispatchContext } from "@callumalpass/mdbase-runtime";
import { createWorkflowsRuntimeProvider, WORKFLOW_RUN_ACTION } from "../src/runtimeProvider";
import type { WorkflowRunDetail, WorkflowRunOptions } from "../src/types";

describe("TaskNotes Workflows runtime provider", () => {
	it("advertises and dispatches the workflow run action", async () => {
		let receivedWorkflowId: string | undefined;
		let receivedInput: Partial<WorkflowRunOptions> | undefined;
		const runWorkflow = vi.fn(async (workflowId: string, input: Partial<WorkflowRunOptions>) => {
			receivedWorkflowId = workflowId;
			receivedInput = input;
			return { status: "success" } as WorkflowRunDetail;
		});
		const provider = createWorkflowsRuntimeProvider({ version: "0.3.0-alpha.1", runWorkflow });
		const context: MdbaseRuntimeDispatchContext = {
			actor: { id: "local-user", kind: "user" },
			origin: { provider: "canvas-bases" },
			run_id: "run-1",
			correlation_id: "corr-1",
			executor: "obsidian",
		};

		expect(await provider.descriptor()).toMatchObject({
			id: "tasknotes-workflows",
			provider_version: "0.3.0-alpha.1",
			contracts: { actions: [WORKFLOW_RUN_ACTION] },
		});
		expect((await provider.contracts()).map((contract) => `${contract.type}:${contract.id}`)).toEqual([
			"capability:tasknotes-workflows.run",
			`action:${WORKFLOW_RUN_ACTION}`,
		]);
		await provider.dispatch(WORKFLOW_RUN_ACTION, { workflow_id: "canvas-drop" }, context);
		expect(receivedWorkflowId).toBe("canvas-drop");
		expect(receivedInput).toMatchObject({
			dryRun: false,
			trigger: {
				type: "runtime.action",
				source: "canvas-bases",
				correlationId: "corr-1",
			},
		});
	});

	it("registers canonical workflow records with the shared host", async () => {
		const provider = createWorkflowsRuntimeProvider({
			version: "0.1.1",
			workflows: [{
				type: "workflow",
				id: "review.daily",
				version: 1,
				name: "Daily review",
				enabled: false,
				triggers: [{ id: "manual", event: "tasknotes-workflows.manual" }],
				steps: [{ id: "notice", action: "notice.show", input: { message: "Review" } }],
			}],
			runWorkflow: async () => ({ status: "success" }) as WorkflowRunDetail,
		});
		const host = new InMemoryRuntimeHost();
		await host.registerProvider(provider);

		expect(host.contracts()).toEqual(expect.arrayContaining([
			expect.objectContaining({ type: "workflow", id: "review.daily", version: 1 }),
		]));
		await host.dispose();
	});
});
