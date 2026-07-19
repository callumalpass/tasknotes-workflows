import type {
	MdbaseRuntimeContract,
	MdbaseRuntimeDispatchContext,
	MdbaseRuntimeDisposable,
	MdbaseRuntimeEventHandler,
	MdbaseRuntimeProvider,
	WorkflowContract,
} from "@callumalpass/mdbase-runtime";
import type { WorkflowRunDetail, WorkflowRunOptions } from "./types";

export const WORKFLOW_RUN_ACTION = "tasknotes.workflow.run";

export function createWorkflowsRuntimeProvider(options: {
	version: string;
	workflows?: WorkflowContract[];
	runWorkflow(workflowId: string, input: Partial<WorkflowRunOptions>): Promise<WorkflowRunDetail>;
}): MdbaseRuntimeProvider {
	const workflows = options.workflows ?? [];
	const contracts: MdbaseRuntimeContract[] = [
		{
			type: "capability",
			id: "tasknotes-workflows.run",
			version: 1,
			name: "Run TaskNotes workflow",
			risk: "medium",
			description: "Run an enabled TaskNotes workflow.",
		},
		{
			type: "action",
			id: WORKFLOW_RUN_ACTION,
			version: 1,
			name: "Run TaskNotes workflow",
			provider: "tasknotes-workflows",
			schemas: {
				dialect: "json-schema-2020-12",
				input: {
					type: "object",
					required: ["workflow_id"],
					additionalProperties: false,
					properties: {
						workflow_id: { type: "string", minLength: 1 },
						trigger: { type: "object" },
						dry_run: { type: "boolean" },
					},
				},
				output: { type: "object" },
			},
			effects: ["tasknotes-workflows.run"],
		},
		...workflows,
	];

	return {
		descriptor: () => ({
			type: "provider",
			id: "tasknotes-workflows",
			version: 1,
			name: "TaskNotes Workflows",
			provider_version: options.version,
			contracts: {
				actions: [WORKFLOW_RUN_ACTION],
				capabilities: ["tasknotes-workflows.run"],
				workflows: workflows.map((workflow) => workflow.id),
			},
		}),
		contracts: () => contracts,
		readiness: () => ({ valid: true, status: "ready", diagnostics: [] }),
		subscribe: (_eventId: string, _handler: MdbaseRuntimeEventHandler): MdbaseRuntimeDisposable => ({
			dispose: () => undefined,
		}),
		dispatch: async (actionId: string, input: unknown, context: MdbaseRuntimeDispatchContext) => {
			if (actionId !== WORKFLOW_RUN_ACTION || !isRecord(input) || typeof input.workflow_id !== "string") {
				throw new Error(`Unsupported TaskNotes Workflows runtime action: ${actionId}`);
			}
			const trigger = isRecord(input.trigger)
				? {
						...input.trigger,
						type: typeof input.trigger.type === "string" ? input.trigger.type : "runtime.action",
					}
				: {
						type: "runtime.action",
						triggerType: "runtime.action",
						event: actionId,
						source: context.origin.provider ?? context.origin.workflow,
						correlationId: context.correlation_id,
						actualAt: new Date().toISOString(),
					};
			return await options.runWorkflow(input.workflow_id, {
				trigger,
				dryRun: input.dry_run === true,
			});
		},
		dispose: () => undefined,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
