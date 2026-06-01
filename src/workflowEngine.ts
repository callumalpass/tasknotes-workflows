import { conditionsMatch } from "./conditions";
import { todayString } from "./duration";
import { createStepExecutionContext, shouldRunStep, StepRegistry } from "./stepRegistry";
import { resolveTemplateValue } from "./template";
import type { App } from "obsidian";
import type { TranslateFn } from "./i18n";
import type {
	LoadedWorkflow,
	StepRunDetail,
	TaskNotesApiErrorPayload,
	TaskNotesRuntimeApi,
	WorkflowRunContext,
	WorkflowRunDetail,
	WorkflowRunOptions,
	WorkflowRunStatus,
	WorkflowStep,
} from "./types";

const ENGINE_FALLBACK_MESSAGES: Record<string, string> = {
	"engine.workflowInvalid": "Workflow is invalid: {path}",
	"engine.workflowAlreadyRunning": "Workflow is already running.",
	"engine.workflowDisabled": "Workflow is disabled.",
	"engine.conditionsDidNotMatch": "Workflow conditions did not match.",
	"engine.stepFailed": "Step failed.",
	"engine.unknownStepType": "Unknown step type: {type}",
	"engine.forEachNonArray": "forEach resolved to a non-array value.",
	"engine.forEachTooManyItems": "forEach selected {count} items, above run.maxTasks {max}.",
};

export class WorkflowEngine {
	private readonly runningWorkflowIds = new Set<string>();

	constructor(
		private readonly stepRegistry: StepRegistry,
		private readonly tasknotes: () => TaskNotesRuntimeApi | null,
		private readonly obsidian: () => App | null = () => null,
		private readonly translate: TranslateFn = (key) => key
	) {}

	async runWorkflow(
		loadedWorkflow: LoadedWorkflow,
		options: WorkflowRunOptions
	): Promise<WorkflowRunDetail> {
		const workflow = loadedWorkflow.workflow;
		if (!workflow) {
			throw new Error(this.t("engine.workflowInvalid", { path: loadedWorkflow.file.path }));
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
			return finishRun(detail, "skipped", this.t("engine.workflowAlreadyRunning"));
		}

		if (!options.dryRun && !workflow.enabled) {
			return finishRun(detail, "skipped", this.t("engine.workflowDisabled"));
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
				return finishRun(detail, "skipped", this.t("engine.conditionsDidNotMatch"));
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
					return finishRun(detail, "failed", stepResult.error ?? this.t("engine.stepFailed"));
				}
				if (step.type === "workflow.stop" && stepResult.status === "success") {
					return finishRun(detail, "stopped");
				}
			}

			return finishRun(detail, "success");
		} catch (error) {
			return finishRun(detail, "failed", normalizedErrorMessage(error, this.tasknotes()));
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
			const failed = createStepDetail(step, "failed", this.t("engine.unknownStepType", { type: step.type }));
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
				const failed = createStepDetail(step, "failed", this.t("engine.forEachNonArray"));
				run.steps.push(failed);
				return failed;
			}
			if (forEachValue.length > maxTasks) {
				const failed = createStepDetail(
					step,
					"failed",
					this.t("engine.forEachTooManyItems", { count: forEachValue.length, max: maxTasks })
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
			const normalizedError = normalizeStepError(error, this.tasknotes());
			detail.status = "failed";
			detail.error = normalizedError.message;
			detail.errorCode = normalizedError.code;
			detail.errorStatus = normalizedError.status;
			detail.errorDetails = normalizedError.details;
			detail.endedAt = new Date().toISOString();
			detail.durationMs = Date.now() - startedAt;
			return detail;
		}
	}

	private t(key: string, params?: Record<string, string | number>): string {
		const translated = this.translate(key, params);
		return translated === key ? interpolate(ENGINE_FALLBACK_MESSAGES[key] ?? key, params) : translated;
	}
}

function interpolate(template: string, params?: Record<string, string | number>): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/gu, (_, token: string) =>
		Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : `{${token}}`
	);
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

type NormalizedWorkflowError = {
	message: string;
	code?: string;
	status?: number;
	details?: unknown;
};

function normalizeStepError(
	error: unknown,
	api: TaskNotesRuntimeApi | null
): NormalizedWorkflowError {
	const apiError = normalizeApiError(error, api);
	if (!apiError) return { message: errorMessage(error) };
	return {
		message: `${apiError.code}: ${apiError.message}`,
		code: apiError.code,
		status: apiError.status,
		details: apiError.details,
	};
}

function normalizedErrorMessage(error: unknown, api: TaskNotesRuntimeApi | null): string {
	return normalizeStepError(error, api).message;
}

function normalizeApiError(
	error: unknown,
	api: TaskNotesRuntimeApi | null
): TaskNotesApiErrorPayload | null {
	try {
		if (api?.errors?.isApiError?.(error) === true) {
			return api.errors.normalize(error);
		}
		if (isTaskNotesApiErrorPayload(error)) return error;
		return null;
	} catch {
		return null;
	}
}

function isTaskNotesApiErrorPayload(error: unknown): error is TaskNotesApiErrorPayload {
	if (!error || typeof error !== "object") return false;
	const candidate = error as Record<string, unknown>;
	return (
		candidate.name === "TaskNotesApiError" &&
		typeof candidate.code === "string" &&
		typeof candidate.message === "string" &&
		typeof candidate.status === "number"
	);
}
