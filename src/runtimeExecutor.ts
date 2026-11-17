import { resolveTemplateValue } from "./template";
import { conditionsMatch } from "./conditions";
import { RECORD_MODIFIED_CONTRACT } from "./recordModifiedContract";
import { satisfies } from "semver";
import { exactContractReference, type ActionContractArtifact, type CloudEvent, type EventContractArtifact, type InvokeActionInput } from "@callumalpass/mdbase-interop";
import type { AdmittedActionBinding, RuntimeWorkflowStep } from "@callumalpass/mdbase-runtime";
import type { App } from "obsidian";
import { celCondition, evaluateVariables, expressionSources, resolveCel } from "./cel";
import { evaluateCel } from "./cel-host";
import { parseDurationMs } from "./duration";
import { createStepExecutionContext, type StepRegistry } from "./stepRegistry";
import type { TaskNotesBridge } from "./tasknotesBridge";
import { digest, LOCAL_EXECUTOR, type RuntimeAttemptRecord, type RuntimeRunStatus } from "./runtimeHistory";
import { RuntimeStateStore } from "./runtimeState";
import { toWorkflowData } from "./workflowData";
import type { LoadedWorkflow, StepRunDetail, TaskNotesRuntimeApi, WorkflowRunDetail, WorkflowRunOptions, WorkflowRunContext, WorkflowCondition } from "./types";

interface ActiveRun { cancel: AbortController; done: Promise<void>; }

/** Client execution, with durable reservations and evidence; no distributed leases or replay. */
export class RuntimeWorkflowExecutor {
	private groups = new Map<string, Set<ActiveRun>>();
	constructor(
		private readonly registry: StepRegistry,
		private readonly tasknotes: () => TaskNotesRuntimeApi | null,
		private readonly app: () => App | null,
		private readonly bridge: () => TaskNotesBridge | null,
		private readonly state = new RuntimeStateStore(),
		private readonly persist: (detail: WorkflowRunDetail) => Promise<void> = async () => {},
	) {}

	async run(loaded: LoadedWorkflow, options: WorkflowRunOptions): Promise<WorkflowRunDetail> {
		const workflow = loaded.runtime;
		if (!workflow) throw new Error("Missing runtime workflow record.");
		const runId = `run:${crypto.randomUUID()}`;
		const now = new Date();
		const detail: WorkflowRunDetail = {
			runId, workflowId: workflow.id, workflowName: workflow.name, workflowPath: loaded.file.path,
			dryRun: options.dryRun === true, startedAt: now.toISOString(), status: "success",
			trigger: toWorkflowData(options.trigger) as WorkflowRunOptions["trigger"], steps: [], attempts: [],
		};
		const finish = async (status: RuntimeRunStatus, error?: string): Promise<WorkflowRunDetail> => {
			detail.status = status === "succeeded" ? "success" : status === "cancelled" ? "skipped" : "failed";
			detail.error = error;
			detail.endedAt = new Date().toISOString();
			detail.durationMs = Date.now() - now.getTime();
			if (detail.runtime) {
				detail.runtime.status = status;
				detail.runtime.updated_at = detail.endedAt;
				detail.runtime.finished_at = detail.endedAt;
			}
			await this.persist(detail);
			return detail;
		};
		let active: ActiveRun | undefined;
		let group = "";
		let release: (() => void) | undefined;
		let timer: number | undefined;
		try {
			if (!workflow.enabled && !options.dryRun) return await finish("cancelled", "Workflow is disabled.");
			const legacy = extension(workflow).format_version === 1;
			for (const source of legacy ? [] : expressionSources(workflow)) {
				const result = evaluateCel(source, {});
				if (!result.valid) throw new Error(result.diagnostics.map(({ message }) => message).join("; "));
			}
			const trigger = workflow.triggers.find(({ id }) => id === options.trigger.id)
				?? (options.manual ? workflow.triggers.find((candidate) => extension(candidate).type === "manual") : undefined);
			const event = options.trigger.cloudEvent ?? await localCloudEvent(options, trigger?.event.id);
			const clock = { now, timezone: scheduleTimezone(trigger) };
			const context: Record<string, unknown> = {
				workflow: legacy ? { ...workflow, filePath: loaded.file.path } : workflow,
				trigger: legacy ? { ...trigger, ...extension(trigger) } : trigger ?? { id: "manual" },
				event: legacy ? detail.trigger : event, steps: {}, vars: workflow.vars ?? {}, now: now.toISOString(), today: now.toISOString().slice(0, 10),
			};
			const resolve = (value: unknown, activation = context): unknown => legacy
				? resolveTemplateValue(value, activation as WorkflowRunContext)
				: resolveCel(value, activation, clock);
			const matches = (condition: RuntimeWorkflowStep["if"], activation = context): boolean => {
				if (!condition) return true;
				if (!legacy) return celCondition(condition, activation, clock);
				return conditionsMatch([{ $expr: condition.$expr }], activation as WorkflowRunContext);
			};
			if (!legacy) context.vars = evaluateVariables(workflow.vars ?? {}, context, clock);
			const legacyConditions = legacy ? extension(workflow).conditions as WorkflowCondition[] | undefined : undefined;
			const matched = matches(trigger?.if) && (!legacyConditions || conditionsMatch(legacyConditions, context as WorkflowRunContext));
			const key = stringValue(resolve(workflow.run?.idempotency?.key ?? `${workflow.id}:${event.id}:${trigger?.id ?? "manual"}`), "Idempotency key");
			const groupValue = workflow.run?.concurrency?.group;
			group = stringValue(resolve(legacy && groupValue === "workflow" ? workflow.id : groupValue ?? workflow.id), "Concurrency group");
			const revision = await digest(workflow);
			detail.runtime = {
				type: "runtime_run", id: runId, workflow_id: workflow.id, workflow_version: workflow.version,
				workflow_revision: revision, event_id: event.id,
				event_contract: { id: event.type, version: event.mdbasecontractversion, digest: event.mdbasecontractdigest },
				admitted_plan: { profile_version: "0.2", workflow_revision: revision, event: {
					contract: { id: event.type, version: event.mdbasecontractversion, digest: event.mdbasecontractdigest },
					source: { application: event.mdbaseapplication, implementation: event.mdbaseimplementation, version: event.mdbaseimplementationversion },
					source_declaration_digest: this.bridge()?.interopDescription()?.event_sources.find((source) =>
						source.source.application === event.mdbaseapplication && source.source.implementation === event.mdbaseimplementation
						&& source.contracts.some(({ resolved }) => resolved.digest === event.mdbasecontractdigest))?.declaration_digest,
				}, steps: [] },
				trigger_id: trigger?.id ?? "manual", idempotency_key: key, concurrency_group: group,
				status: "queued", created_at: now.toISOString(), updated_at: now.toISOString(),
			};
			if (!matched) return await finish("cancelled", "Trigger condition did not match.");
			const bindings = await Promise.all(workflow.steps.map((step) => this.binding(step)));
			detail.runtime.admitted_plan.steps = bindings;
			this.checkCapabilities(workflow.requires?.capabilities);
			const minimumInterval = !options.manual && trigger?.minimum_interval ? { key: `${workflow.id}:${trigger.id}`, minimumIntervalMs: parseDurationMs(trigger.minimum_interval, 0) } : undefined;
			if (!options.dryRun && !await this.state.reserve(key, Date.now(), minimumInterval)) return await finish("cancelled", "Duplicate idempotency key or minimum interval has not elapsed.");
			const policy = workflow.run?.concurrency?.policy ?? "skip";
			const existing = [...this.groups.get(group) ?? []];
			if (policy === "skip" && existing.length) return await finish("cancelled", "Concurrency group is active.");
			const cancel = new AbortController();
			const done = new Promise<void>((resolve) => { release = resolve; });
			active = { cancel, done };
			const members = this.groups.get(group) ?? new Set<ActiveRun>();
			members.add(active);
			this.groups.set(group, members);
			await this.persist(detail);
			if (policy === "replace") for (const previous of existing) previous.cancel.abort("replaced");
			if (policy === "queue" || policy === "replace") await Promise.all(existing.map(({ done }) => done));
			if (cancel.signal.aborted) return await finish("cancelled", "Replaced by a newer run.");
			const timeout = workflow.run?.limits?.timeout;
			const deadline = timeout ? Date.now() + parseDurationMs(timeout, 0) : undefined;
			if (deadline !== undefined) timer = window.setTimeout(() => cancel.abort("deadline"), Math.max(0, deadline - Date.now()));
			detail.runtime.status = "running";
			detail.runtime.started_at = new Date().toISOString();
			await this.persist(detail);
			let failed = false;
			for (const [index, step] of workflow.steps.entries()) {
				if (cancel.signal.aborted || (deadline !== undefined && Date.now() >= deadline)) {
					return await finish(cancel.signal.reason === "replaced" ? "cancelled" : "failed", "Execution cancelled or deadline exceeded.");
				}
				const stepMatches = (activation = context): boolean => legacy && Array.isArray(extension(step).conditions)
					? conditionsMatch(extension(step).conditions as WorkflowCondition[], activation as WorkflowRunContext)
					: matches(step.if, activation);
				if (!step.for_each && !stepMatches()) {
					(context.steps as Record<string, unknown>)[step.id] = { status: "cancelled", output: null };
					continue;
				}
				const items: unknown = step.for_each ? resolve(step.for_each.items) : [undefined];
				if (!Array.isArray(items)) throw new Error(`for_each of ${step.id} must resolve to a list.`);
				if (items.length > (workflow.run?.limits?.max_items ?? 25)) throw new Error(`for_each exceeds max_items for ${step.id}.`);
				const outputs: unknown[] = [];
				for (const [itemIndex, item] of (items as unknown[]).entries()) {
					if (cancel.signal.aborted || (deadline !== undefined && Date.now() >= deadline)) break;
					const activation = step.for_each ? { ...context, item, ...(step.for_each.as ? { [step.for_each.as]: item } : {}) } : context;
					if (step.for_each && !stepMatches(activation)) continue;
					const input = resolve(step.input ?? {}, activation);
					this.checkCapabilities(workflow.requires?.capabilities);
					this.checkCapabilities(step.requires?.capabilities);
					const result = await this.dispatch(step, bindings[index], input, detail, key, event, step.for_each ? itemIndex : undefined, deadline, cancel.signal);
					detail.steps.push(result);
					outputs.push(result.output);
					(context.steps as Record<string, unknown>)[step.id] = { status: result.status === "success" && !legacy ? "succeeded" : result.status, output: step.for_each ? outputs : result.output };
					if (result.status === "failed") {
						failed = true;
						const attemptStatus = detail.attempts?.[detail.attempts.length - 1]?.status;
						if (attemptStatus === "indeterminate") return await finish("indeterminate", result.error);
						if (attemptStatus === "cancelled") return await finish("cancelled", result.error);
						if (workflow.run?.on_error !== "continue") return await finish("failed", result.error);
						break;
					}
					await this.persist(detail);
				}
				if (step.for_each && items.length === 0) (context.steps as Record<string, unknown>)[step.id] = { status: "succeeded", output: [] };
				if (step.action.id === "workflow.stop") break;
			}
			if (cancel.signal.aborted || (deadline !== undefined && Date.now() >= deadline)) return await finish(cancel.signal.reason === "replaced" ? "cancelled" : "failed", "Execution cancelled or deadline exceeded.");
			return await finish(failed ? "failed" : "succeeded");
		} catch (error) {
			return await finish("failed", error instanceof Error ? error.message : String(error));
		} finally {
			if (timer) window.clearTimeout(timer);
			if (active) {
				this.groups.get(group)?.delete(active);
				if (!this.groups.get(group)?.size) this.groups.delete(group);
			}
			release?.();
		}
	}

	private async binding(step: RuntimeWorkflowStep): Promise<AdmittedActionBinding> {
		if (this.registry.get(step.action.id) && !step.provider) {
			const artifact: ActionContractArtifact = {
				kind: "mdbase.contract", contract_type: "action", id: step.action.id, version: "1.0.0",
				input_schema: { dialect: "json-schema-2020-12", value: { type: "object" } },
			};
			const contract = await exactContractReference(artifact);
			if (step.action.digest && step.action.digest !== contract.digest) throw new Error(`Contract digest conflict: ${step.action.id}`);
			if (!versionMatches(contract.version, step.action.version)) throw new Error(`Unsupported local action version: ${step.action.version}`);
			return { id: step.id, contract, provider: LOCAL_EXECUTOR, provider_declaration_digest: await digest({ provider: LOCAL_EXECUTOR, handler: artifact }), handler_id: step.action.id };
		}
		const providers = this.bridge()?.interopDescription()?.action_providers ?? [];
		const candidates = providers.flatMap((provider) => provider.handlers
			.filter((handler) => handler.resolved.id === step.action.id && versionMatches(handler.resolved.version, step.action.version)
				&& (!step.action.digest || handler.resolved.digest === step.action.digest)
				&& Object.entries(step.provider ?? {}).every(([key, value]) => provider.provider[key as keyof typeof provider.provider] === value))
			.map((handler) => ({ id: step.id, contract: handler.resolved, provider: provider.provider, provider_declaration_digest: provider.declaration_digest, handler_id: handler.handler_id })));
		if (candidates.length !== 1) throw new Error(`${candidates.length ? "ambiguous_provider" : "no_provider"}: ${step.action.id}`);
		return candidates[0];
	}

	private checkCapabilities(capabilities?: string[]): void {
		for (const capability of capabilities ?? []) {
			if (!this.tasknotes()?.hasCapability(capability)) throw new Error(`capability_denied: ${capability}`);
		}
	}

	private async dispatch(step: RuntimeWorkflowStep, binding: AdmittedActionBinding, input: unknown, run: WorkflowRunDetail, key: string, event: CloudEvent, itemIndex: number | undefined, deadline: number | undefined, signal: AbortSignal): Promise<StepRunDetail> {
		const startedAt = new Date().toISOString();
		const requestId = `${run.runId}:${step.id}${itemIndex === undefined ? "" : `:${itemIndex}`}`;
		const idempotencyKey = `${key}:${step.id}${itemIndex === undefined ? "" : `:${itemIndex}`}`;
		const request: InvokeActionInput = {
			request_id: requestId, contract: binding.contract, input, idempotency_key: idempotencyKey,
			correlation_id: event.correlationid ?? run.runId, causation_id: event.id, subject: event.subject,
			requested_provider: { application: binding.provider.application, implementation: binding.provider.implementation, ...(binding.provider.instance_id ? { instance_id: binding.provider.instance_id } : {}) }, ...(deadline === undefined ? {} : { deadline: new Date(deadline).toISOString() }),
		};
		const attempt: RuntimeAttemptRecord = {
			type: "runtime_action_attempt", id: `attempt:${crypto.randomUUID()}`, run_id: run.runId, step_id: step.id,
			request_id: requestId, invocation_id: `pending:${requestId}`, attempt_id: `pending:${requestId}`,
			contract: binding.contract, provider: binding.provider, provider_declaration_digest: binding.provider_declaration_digest,
			handler_id: binding.handler_id, idempotency_key: idempotencyKey, status: "admitted", request: { kind: "mdbase.action.request", profile_version: "0.1", caller: this.bridge()?.connectInterop()?.identity ?? LOCAL_EXECUTOR, created_at: startedAt, ...request },
			created_at: startedAt, updated_at: startedAt,
			"x-tasknotes": { local: !step.provider && Boolean(this.registry.get(step.action.id)), dry_run: run.dryRun, item_index: itemIndex },
		};
		run.attempts?.push(attempt);
		await this.persist(run);
		const result: StepRunDetail = { id: step.id, type: step.action.id, status: "success", startedAt, sourceInput: step.input, input, itemIndex };
		let dispatched = false;
		try {
			attempt.status = "dispatching";
			await this.persist(run);
			if (signal.aborted || (deadline !== undefined && Date.now() >= deadline)) throw new Error("Execution cancelled or deadline exceeded.");
			const local = !step.provider ? this.registry.get(step.action.id) : undefined;
			if (run.dryRun) result.output = { dryRun: true, wouldInvoke: step.action.id, input };
			else if (local) {
				result.output = toWorkflowData(await local.run(input, createStepExecutionContext(run.runId, false, this.tasknotes(), this.app(), "tasknotes-workflows")));
			} else {
				const bridge = this.bridge();
				if (!bridge) throw new Error("Interop bridge unavailable.");
				const current = await this.binding(step);
				if (JSON.stringify(current) !== JSON.stringify(binding)) throw new Error("Admitted provider declaration changed.");
				if (signal.aborted || (deadline !== undefined && Date.now() >= deadline)) throw new Error("Execution cancelled or deadline exceeded.");
				const cancel = (): void => {
					void (async () => {
						attempt["x-tasknotes"] = { ...extension(attempt), cancellation_requested_at: new Date().toISOString(), reason: signal.reason as unknown };
						await this.persist(run);
						await bridge.connectInterop()?.cancelAction(requestId, String(signal.reason));
					})().catch(console.error);
				};
				signal.addEventListener("abort", cancel, { once: true });
				try {
					dispatched = true;
					const outcome = await bridge.invokeContractAction(request);
					attempt.outcome = outcome;
					attempt.invocation_id = outcome.invocation_id;
					attempt.attempt_id = outcome.attempt_id;
					attempt.status = outcome.status === "outcome_indeterminate" ? "indeterminate" : outcome.status;
					result.evidence = outcome;
					if (outcome.status !== "succeeded") throw new Error(`${outcome.error.code}: ${outcome.error.message}`);
					result.output = toWorkflowData(outcome.output);
				} finally { signal.removeEventListener("abort", cancel); }
			}
			attempt.status = "succeeded";
		} catch (error) {
			if (!attempt.outcome) attempt.status = dispatched ? "indeterminate" : "failed";
			result.status = "failed";
			result.error = error instanceof Error ? error.message : String(error);
		}
		result.endedAt = new Date().toISOString();
		result.durationMs = Date.now() - new Date(startedAt).getTime();
		attempt.updated_at = result.endedAt;
		attempt.completed_at = result.endedAt;
		await this.persist(run);
		return result;
	}
}

export async function localCloudEvent(options: WorkflowRunOptions, contractId?: string): Promise<CloudEvent> {
	const payload = toWorkflowData(options.trigger) as WorkflowRunOptions["trigger"];
	const type = contractId ?? `tasknotes-workflows.${payload.triggerType ?? payload.type}`;
	const artifact: EventContractArtifact = {
		kind: "mdbase.contract", contract_type: "event", id: type, version: "1.0.0",
		data_schema: { dialect: "json-schema-2020-12", value: { type: "object" } },
	};
	const reference = await exactContractReference(type === "mdbase.record.modified" ? RECORD_MODIFIED_CONTRACT : artifact);
	return {
		specversion: "1.0", id: `event:${crypto.randomUUID()}`, source: "obsidian://tasknotes-workflows", type,
		time: payload.actualAt ?? new Date().toISOString(), datacontenttype: "application/json", dataschema: `${type}/1.0.0`,
		data: payload.data ?? payload, subject: payload.path, mdbaseprofile: "0.1", mdbasecontractversion: "1.0.0",
		mdbasecontractdigest: reference.digest, mdbaseapplication: LOCAL_EXECUTOR.application,
		mdbaseimplementation: LOCAL_EXECUTOR.implementation, mdbaseimplementationversion: LOCAL_EXECUTOR.version,
		...(payload.correlationId ? { correlationid: payload.correlationId } : {}),
	};
}
function extension(value: unknown): Record<string, unknown> {
	return (value as Record<string, Record<string, unknown>> | undefined)?.["x-tasknotes"] ?? {};
}
function scheduleTimezone(trigger: unknown): string {
	const timezone = extension(trigger).timezone;
	return typeof timezone === "string" && timezone !== "local" ? timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function stringValue(value: unknown, label: string): string {
	if (typeof value !== "string") throw new Error(`${label} must evaluate to a string.`);
	return value;
}
function versionMatches(version: string, requirement: string): boolean {
	return satisfies(version, requirement);
}
