import { conditionsMatch } from "./conditions";
import { todayString } from "./duration";
import { createStepExecutionContext, shouldRunStep, StepRegistry } from "./stepRegistry";
import { resolveTemplateValue } from "./template";
import type { App } from "obsidian";
import type { ActionOutcome } from "@callumalpass/mdbase-interop";
import type { TaskNotesBridge } from "./tasknotesBridge";
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
	"engine.preflightFailed": "Workflow requirements are not met: {details}",
	"engine.forEachNonArray": "forEach resolved to a non-array value.",
	"engine.forEachTooManyItems": "forEach selected {count} items, above run.limits.maxItems {max}.",
};

export class WorkflowEngine {
	private readonly runningGroups = new Set<string>();

	constructor(
		private readonly stepRegistry: StepRegistry,
		private readonly tasknotes: () => TaskNotesRuntimeApi | null,
		private readonly obsidian: () => App | null = () => null,
		private readonly translate: TranslateFn = (key) => key,
		private readonly interopBridge: () => TaskNotesBridge | null = () => null,
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
		const preflightError = this.preflightError(workflow.requires);
		if (preflightError) {
			return finishRun(detail, "failed", this.t("engine.preflightFailed", { details: preflightError }));
		}

		const concurrencyGroup = this.concurrencyGroup(workflow.id, workflow.run.concurrency.group);
		if (workflow.run.concurrency.policy !== "allow" && this.runningGroups.has(concurrencyGroup)) {
			return finishRun(detail, "skipped", this.t("engine.workflowAlreadyRunning"));
		}

		if (!options.dryRun && !workflow.enabled) {
			return finishRun(detail, "skipped", this.t("engine.workflowDisabled"));
		}

		this.runningGroups.add(concurrencyGroup);
		try {
			const context: WorkflowRunContext = {
				workflow: {
					id: workflow.id,
					name: workflow.name,
					filePath: loadedWorkflow.file.path,
				},
				trigger: workflow.triggers.find((trigger) => trigger.id === options.trigger.id) ?? {
					id: options.trigger.id,
					type: options.trigger.triggerType ?? options.trigger.type,
				},
				event: options.trigger,
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
					workflow.run.limits.maxItems
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
			this.runningGroups.delete(concurrencyGroup);
		}
	}

	private async runStep(
		step: WorkflowStep,
		source: string,
		context: WorkflowRunContext,
		run: WorkflowRunDetail,
		maxItems: number
	): Promise<StepRunDetail> {
		const definition = this.stepRegistry.get(step.type);
		const interopAction = step.provider || !definition ? this.interopBridge() : null;
		if (!definition && !interopAction) {
			const failed = createStepDetail(step, "failed", this.t("engine.unknownStepType", { type: step.type }));
			run.steps.push(failed);
			return failed;
		}
		if (!shouldRunStep(step, context)) {
			const skipped = createStepDetail(step, "skipped");
			run.steps.push(skipped);
			context.steps[step.id] = stepResultRecord(skipped);
			return skipped;
		}

		const forEachValue = step.forEach
			? resolveTemplateValue(step.forEach.items, context)
			: undefined;
		if (typeof forEachValue !== "undefined") {
			const forEach = step.forEach;
			if (!forEach) {
				const failed = createStepDetail(step, "failed", this.t("engine.forEachNonArray"));
				run.steps.push(failed);
				context.steps[step.id] = stepResultRecord(failed);
				return failed;
			}
			if (!Array.isArray(forEachValue)) {
				const failed = createStepDetail(step, "failed", this.t("engine.forEachNonArray"));
				run.steps.push(failed);
				context.steps[step.id] = stepResultRecord(failed);
				return failed;
			}
			if (forEachValue.length > maxItems) {
				const failed = createStepDetail(
					step,
					"failed",
					this.t("engine.forEachTooManyItems", { count: forEachValue.length, max: maxItems })
				);
				run.steps.push(failed);
				context.steps[step.id] = stepResultRecord(failed);
				return failed;
			}

			const outputs: unknown[] = [];
			for (const [index, item] of forEachValue.entries()) {
				const itemContext: WorkflowRunContext = { ...context, item };
				if (forEach.as) itemContext[forEach.as] = item;
				const detail = await this.runSingleStep(
					step,
					definition,
					interopAction,
					source,
					itemContext,
					run.runId,
					run.dryRun,
					index
				);
				run.steps.push(detail);
				if (detail.status === "success") outputs.push(detail.output);
				if (detail.status === "failed") {
					context.steps[step.id] = stepResultRecord(detail);
					return detail;
				}
			}
			context.steps[step.id] = { status: "success", output: outputs };
			return run.steps[run.steps.length - 1] ?? createStepDetail(step, "success");
		}

		const detail = await this.runSingleStep(
			step,
			definition,
			interopAction,
			source,
			context,
			run.runId,
			run.dryRun
		);
		run.steps.push(detail);
		context.steps[step.id] = stepResultRecord(detail);
		return detail;
	}

	private async runSingleStep(
		step: WorkflowStep,
		definition: ReturnType<StepRegistry["get"]>,
		interop: TaskNotesBridge | null,
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
			const sourceInput = step.input ?? {};
			const input = resolveTemplateValue(sourceInput, context);
			detail.sourceInput = sourceInput;
			detail.input = input;
			if (interop) {
				if (dryRun) {
					detail.output = { dryRun: true, wouldInvoke: step.type, input };
				} else {
					const outcome = await interop.invokeContractAction({
						request_id: interopRequestId(runId, step.id, itemIndex),
						contract: {
							id: step.type,
							version: step.contract?.version ?? "*",
							...(step.contract?.digest ? { digest: step.contract.digest } : {}),
						},
						correlation_id: context.event.correlationId ?? runId,
						...(eventCausationId(context) ? { causation_id: eventCausationId(context) } : {}),
						...(context.event.path ? { subject: context.event.path } : {}),
						idempotency_key: interopRequestId(runId, step.id, itemIndex),
						...(step.provider ? { requested_provider: step.provider } : {}),
						input,
					});
					detail.evidence = outcome;
					detail.output = successfulInteropOutput(outcome);
				}
			} else if (definition) {
				detail.output = await definition.run(
					input,
					createStepExecutionContext(runId, dryRun, this.tasknotes(), this.obsidian(), source)
				);
			} else {
				throw new Error(this.t("engine.unknownStepType", { type: step.type }));
			}
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

	private preflightError(requirements: WorkflowStep["requires"]): string | null {
		if (!requirements?.capabilities?.length) return null;
		const api = this.tasknotes();
		if (!api) return "TaskNotes is unavailable.";
		const available = new Set(api.capabilities ?? []);
		const missing = requirements.capabilities.filter((capability) => !available.has(capability));
		return missing.length > 0 ? `Missing TaskNotes capabilities: ${missing.join(", ")}.` : null;
	}

	private concurrencyGroup(workflowId: string, group: string): string {
		return group === "global" ? "global" : `${group || "workflow"}:${workflowId}`;
	}
}

function interopRequestId(runId: string, stepId: string, itemIndex?: number): string {
	return `workflow:${runId}:${stepId}${itemIndex === undefined ? "" : `:${itemIndex}`}`;
}

function eventCausationId(context: WorkflowRunContext): string | undefined {
	const data = context.event.data;
	if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
	const eventId = (data as Record<string, unknown>).eventId;
	return typeof eventId === "string" ? eventId : undefined;
}

function successfulInteropOutput(outcome: ActionOutcome): unknown {
	if (outcome.status === "succeeded") return outcome.output;
	const error = new Error(`${outcome.error.message} [${outcome.error.code}]`);
	Object.assign(error, {
		code: outcome.error.code,
		details: {
			...asErrorDetails(outcome.error.details),
			outcome,
		},
	});
	throw error;
}

function asErrorDetails(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? value as Record<string, unknown>
		: {};
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
	status: StepRunDetail["status"],
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

function stepResultRecord(detail: StepRunDetail): WorkflowRunContext["steps"][string] {
	const result: WorkflowRunContext["steps"][string] = { status: detail.status };
	if (detail.status === "success") result.output = detail.output;
	if (detail.status === "skipped" || detail.status === "cancelled") result.output = null;
	if (detail.error) result.error = detail.error;
	return result;
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
