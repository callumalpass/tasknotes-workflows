import type {
	ActionContractArtifact,
	RegisterActionProviderInput,
} from "@callumalpass/mdbase-interop";
import type { WorkflowRunDetail, WorkflowRunOptions } from "./types";

export const WORKFLOW_RUN_ACTION = "tasknotes.workflow.run";

export const WORKFLOW_RUN_CONTRACT = {
	kind: "mdbase.contract",
	contract_type: "action",
	id: WORKFLOW_RUN_ACTION,
	version: "1.0.0",
	name: "Run TaskNotes workflow",
	description: "Run one TaskNotes Workflows definition by its stable workflow ID.",
	input_schema: {
		dialect: "json-schema-2020-12",
		value: {
			type: "object",
			required: ["workflow_id"],
			additionalProperties: false,
			properties: {
				workflow_id: { type: "string", minLength: 1 },
				trigger: { type: "object" },
				dry_run: { type: "boolean" },
			},
		},
	},
	output_schema: {
		dialect: "json-schema-2020-12",
		value: { type: "object" },
	},
	behavior: {
		idempotency: "optional",
		cancellation: "none",
	},
} as const satisfies ActionContractArtifact;

export function createWorkflowsActionProvider(options: {
	runWorkflow(workflowId: string, input: Partial<WorkflowRunOptions>): Promise<WorkflowRunDetail>;
}): RegisterActionProviderInput {
	return {
		declaration_id: "tasknotes-workflows.actions",
		handlers: [{
			handler_id: WORKFLOW_RUN_ACTION,
			contract: WORKFLOW_RUN_CONTRACT,
			idempotency: {
				mode: "request",
				retention_seconds: 3600,
			},
			cancellation: "none",
			handler: async (input, context) => {
				if (!isRecord(input) || typeof input.workflow_id !== "string") {
					throw new Error(`${WORKFLOW_RUN_ACTION} requires a workflow_id.`);
				}
				const trigger = isRecord(input.trigger)
					? {
							...input.trigger,
							type: typeof input.trigger.type === "string" ? input.trigger.type : "contract.action",
						}
					: {
							type: "contract.action",
							triggerType: "contract.action",
							event: WORKFLOW_RUN_ACTION,
							source: context.invocation.caller.application,
							correlationId: context.invocation.correlation_id,
							actualAt: context.invocation.admitted_at,
						};
				return await options.runWorkflow(input.workflow_id, {
					trigger,
					dryRun: input.dry_run === true,
				});
			},
		}],
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
