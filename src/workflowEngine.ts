import { conditionsMatch } from "./conditions";
import { todayString } from "./duration";
import { createStepExecutionContext, shouldRunStep, StepRegistry } from "./stepRegistry";
import { resolveTemplateValue } from "./template";
import type { App } from "obsidian";
import type {
	LoadedWorkflow,
	StepRunDetail,
	TaskNotesRuntimeApi,
	WorkflowRunContext,
	WorkflowRunDetail,
	WorkflowRunOptions,
	WorkflowRunStatus,
	WorkflowStep,
} from "./types";

export class WorkflowEngine {
	private readonly runningWorkflowIds = new Set<string>();

	constructor(
		private readonly stepRegistry: StepRegistry,
		private readonly tasknotes: () => TaskNotesRuntimeApi | null,
		private readonly obsidian: () => App | null = () => null
	) {}

	async runWorkflow(
		loadedWorkflow: LoadedWorkflow,
		options: WorkflowRunOptions
	): Promise<WorkflowRunDetail> {
		const workflow = loadedWorkflow.workflow;
		if (!workflow) {
			throw new Error(`Workflow is invalid: ${loadedWorkflow.file.path}`);
		}

		const runId = createRunId();
		const startedAt = new Date();
		const detail: WorkflowRunDetail = {
			runId,
			workflowId: workflow.id,
			workflowName: workflow.name,
			workflowPath: loadedWorkflow.file.path,
			dryRun: options.dryRun === true,
			startedAt: startedAt.toISOString(),
			status: "success",
			trigger: options.trigger,
			steps: [],
		};

		if (workflow.run.noOverlap && this.runningWorkflowIds.has(workflow.id)) {
			return finishRun(detail, "skipped", "Workflow is already running.");
		}

		if (!options.dryRun && !workflow.enabled) {
			return finishRun(detail, "skipped", "Workflow is disabled.");
		}

		this.runningWorkflowIds.add(workflow.id);
		try {
			const context: WorkflowRunContext = {
				workflow: {
					id: workflow.id,
					name: workflow.name,
					filePath: loadedWorkflow.file.path,
				},
				trigger: options.trigger,
				vars: workflow.vars,
				steps: {},
				now: startedAt.toISOString(),
				today: todayString(startedAt),
			};

			if (!conditionsMatch(workflow.conditions, context)) {
				return finishRun(detail, "skipped", "Workflow conditions did not match.");
			}

			for (const step of workflow.steps) {
				const stepResult = await this.runStep(
					step,
					workflow.run.source,
					context,
					detail,
					workflow.run.maxTasks
				);
				if (stepResult.status === "failed" && workflow.run.onError === "stop") {
					return finishRun(detail, "failed", stepResult.error ?? "Step failed.");
				}
				if (step.type === "workflow.stop" && stepResult.status === "success") {
					return finishRun(detail, "stopped");
				}
			}

			return finishRun(detail, "success");
		} catch (error) {
			return finishRun(detail, "failed", errorMessage(error));
		} finally {
			this.runningWorkflowIds.delete(workflow.id);
		}
	}

	private async runStep(
		step: WorkflowStep,
		source: string,
		context: WorkflowRunContext,
		run: WorkflowRunDetail,
		maxTasks: number
	): Promise<StepRunDetail> {
		const definition = this.stepRegistry.get(step.type);
		if (!definition) {
			const failed = createStepDetail(step, "failed", `Unknown step type: ${step.type}`);
			run.steps.push(failed);
			return failed;
		}

		if (!shouldRunStep(step, context)) {
			const skipped = createStepDetail(step, "skipped");
			run.steps.push(skipped);
			return skipped;
		}

		const forEachValue = step.forEach
			? resolveTemplateValue(step.forEach, context)
			: undefined;
		if (typeof forEachValue !== "undefined") {
			if (!Array.isArray(forEachValue)) {
				const failed = createStepDetail(step, "failed", "forEach resolved to a non-array value.");
				run.steps.push(failed);
				return failed;
			}
			if (forEachValue.length > maxTasks) {
				const failed = createStepDetail(
					step,
					"failed",
					`forEach selected ${forEachValue.length} items, above run.maxTasks ${maxTasks}.`
				);
				run.steps.push(failed);
				return failed;
			}

			const outputs: unknown[] = [];
			for (const [index, item] of forEachValue.entries()) {
				const itemContext: WorkflowRunContext = { ...context, item };
				const detail = await this.runSingleStep(
					step,
					definition,
					source,
					itemContext,
					run.runId,
					run.dryRun,
					index
				);
				run.steps.push(detail);
				if (detail.status === "success") outputs.push(detail.output);
				if (detail.status === "failed") return detail;
			}
			context.steps[step.id] = outputs;
			return run.steps[run.steps.length - 1] ?? createStepDetail(step, "success");
		}

		const detail = await this.runSingleStep(step, definition, source, context, run.runId, run.dryRun);
		run.steps.push(detail);
		if (detail.status === "success") context.steps[step.id] = detail.output;
		return detail;
	}

	private async runSingleStep(
		step: WorkflowStep,
		definition: NonNullable<ReturnType<StepRegistry["get"]>>,
		source: string,
		context: WorkflowRunContext,
		runId: string,
		dryRun: boolean,
		itemIndex?: number
	): Promise<StepRunDetail> {
		const startedAt = Date.now();
		const detail: StepRunDetail = {
			id: step.id,
			type: step.type,
			status: "success",
			startedAt: new Date(startedAt).toISOString(),
			itemIndex,
		};

		try {
			const input = resolveTemplateValue(step.input ?? {}, context);
			detail.input = input;
			detail.output = await definition.run(
				input,
				createStepExecutionContext(runId, dryRun, this.tasknotes(), this.obsidian(), source)
			);
			detail.endedAt = new Date().toISOString();
			detail.durationMs = Date.now() - startedAt;
			return detail;
		} catch (error) {
			detail.status = "failed";
			detail.error = errorMessage(error);
			detail.endedAt = new Date().toISOString();
			detail.durationMs = Date.now() - startedAt;
			return detail;
		}
	}
}

function finishRun(
	detail: WorkflowRunDetail,
	status: WorkflowRunStatus,
	error?: string
): WorkflowRunDetail {
	detail.status = status;
	detail.error = error;
	detail.endedAt = new Date().toISOString();
	detail.durationMs = new Date(detail.endedAt).getTime() - new Date(detail.startedAt).getTime();
	return detail;
}

function createStepDetail(
	step: WorkflowStep,
	status: WorkflowRunStatus,
	error?: string
): StepRunDetail {
	const now = new Date().toISOString();
	return {
		id: step.id,
		type: step.type,
		status,
		startedAt: now,
		endedAt: now,
		durationMs: 0,
		error,
	};
}

function createRunId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
