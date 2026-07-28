import { validateRuntimeRecord, type RuntimeWorkflow } from "@callumalpass/mdbase-runtime";
import { DEFAULT_SOURCE, LEGACY_WORKFLOW_TYPE, RUNTIME_WORKFLOW_TYPE, WORKFLOW_TYPE } from "./constants";
import type {
	WorkflowCondition,
	WorkflowDefinition,
	WorkflowDiagnostic,
	WorkflowForEach,
	WorkflowSourceFormat,
	WorkflowStep,
	WorkflowTrigger,
} from "./types";

const TASKNOTES_EXTENSION = "x-tasknotes";
const RUNTIME_IDENTIFIER = /^[A-Za-z][A-Za-z0-9._:-]*$/u;

type Dict = Record<string, unknown>;

export function detectWorkflowSourceFormat(data: unknown): WorkflowSourceFormat {
	if (!isRecord(data)) return "unknown";
	if (data.type === LEGACY_WORKFLOW_TYPE) return "tasknotes-v0.1";
	if (data.type === RUNTIME_WORKFLOW_TYPE && data.version !== undefined && data.schemaVersion === undefined) {
		return "runtime-v0.2";
	}
	if (data.type !== WORKFLOW_TYPE) return "unknown";
	if (data.schemaVersion !== undefined && data.version === undefined) return "tasknotes-v1";
	return "unknown";
}

export function validateRuntimeWorkflowRecord(record: unknown): WorkflowDiagnostic[] {
	const validation = validateRuntimeRecord(record);
	return validation.diagnostics.map((diagnostic) => ({
		severity: diagnostic.severity === "info" ? "warning" : diagnostic.severity,
		path: diagnostic.path ?? "$",
		message: diagnostic.message,
	}));
}

export function runtimeRecordToTaskNotesInput(record: Dict): Dict {
	const tasknotes = extension(record);
	const run = isRecord(record.run) ? record.run : {};
	const concurrency = isRecord(run.concurrency) ? run.concurrency : {};
	const limits = isRecord(run.limits) ? run.limits : {};
	const conditions = Array.isArray(tasknotes.conditions)
		? tasknotes.conditions
		: isRecord(record.if)
			? [record.if]
			: [];

	return {
		type: WORKFLOW_TYPE,
		schemaVersion: 1,
		id: record.id,
		name: record.name,
		description: record.description,
		enabled: record.enabled,
		requires: record.requires,
		vars: record.vars,
		query: isRecord(tasknotes.query) ? tasknotes.query : undefined,
		conditions,
		extensions: otherExtensions(record),
		triggers: Array.isArray(record.triggers)
			? record.triggers.map(runtimeTriggerToTaskNotesInput)
			: record.triggers,
		steps: Array.isArray(record.steps)
			? record.steps.map(runtimeStepToTaskNotesInput)
			: record.steps,
		run: {
			mode: "sequential",
			concurrency: {
				group: typeof concurrency.group === "string" ? concurrency.group : "workflow",
				policy: concurrency.policy,
			},
			limits: {
				maxItems: limits.max_items,
				timeout: limits.timeout,
			},
			onError: run.on_error,
			source: typeof tasknotes.source === "string" ? tasknotes.source : DEFAULT_SOURCE,
		},
		debug: isRecord(tasknotes.debug) ? tasknotes.debug : undefined,
	};
}

export function workflowToRuntimeRecord(workflow: WorkflowDefinition): RuntimeWorkflow & Dict {
	assertRuntimeIdentifier(workflow.id, "workflow id");
	const tasknotes = compact({
		format_version: 1,
		source: workflow.run.source,
		conditions: workflow.conditions.length > 0 ? workflow.conditions : undefined,
		query: workflow.query,
		debug: workflow.debug,
	});
	const record: Dict = {
		...workflow.extensions,
		type: RUNTIME_WORKFLOW_TYPE,
		id: workflow.id,
		version: "1.0.0",
		name: workflow.name,
		description: workflow.description,
		enabled: workflow.enabled,
		requires: normalizeRequires(workflow.requires),
		vars: Object.keys(workflow.vars).length > 0 ? normalizeExpressionValues(workflow.vars) : undefined,
		triggers: workflow.triggers.map(workflowTriggerToRuntimeRecord),
		steps: workflow.steps.map(workflowStepToRuntimeRecord),
		run: {
			concurrency: {
				group: workflow.run.concurrency.group,
				policy: workflow.run.concurrency.policy,
			},
			limits: compact({
				max_items: workflow.run.limits.maxItems,
				timeout: workflow.run.limits.timeout,
			}),
			on_error: workflow.run.onError,
		},
		[TASKNOTES_EXTENSION]: tasknotes,
	};
	const cleaned = removeUndefined(record);
	const diagnostics = validateRuntimeWorkflowRecord(cleaned);
	if (diagnostics.length > 0) {
		throw new Error(diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join("; "));
	}
	return cleaned as RuntimeWorkflow & Dict;
}

function runtimeTriggerToTaskNotesInput(raw: unknown): unknown {
	if (!isRecord(raw)) return raw;
	const tasknotes = extension(raw);
	const event = isRecord(raw.event) ? raw.event : {};
	const type = typeof tasknotes.type === "string" ? tasknotes.type : "contract.event";
	return {
		...tasknotes,
		id: raw.id,
		type,
		...(type === "contract.event"
			? { contract: event.id, version: event.version }
			: { event: runtimeEventForTaskNotesTrigger(type, event.id, tasknotes) }),
		debounce: raw.debounce,
		minimumInterval: raw.minimum_interval,
		extensions: otherExtensions(raw),
	};
}

function runtimeStepToTaskNotesInput(raw: unknown): unknown {
	if (!isRecord(raw)) return raw;
	const tasknotes = extension(raw);
	const action = isRecord(raw.action) ? raw.action : {};
	return {
		id: raw.id,
		type: action.id,
		name: raw.name,
		input: raw.input,
		if: Array.isArray(tasknotes.conditions) ? tasknotes.conditions : raw.if,
		forEach: runtimeForEachToTaskNotes(raw.for_each),
		requires: raw.requires,
		contract: compact({
			version: action.version,
			digest: action.digest,
		}),
		provider: raw.provider,
		extensions: otherExtensions(raw),
	};
}

function workflowTriggerToRuntimeRecord(trigger: WorkflowTrigger): Dict {
	assertRuntimeIdentifier(trigger.id, `trigger id ${trigger.id}`);
	const eventId = runtimeEventForWorkflowTrigger(trigger);
	assertRuntimeIdentifier(eventId, `trigger event ${eventId}`);
	const tasknotes = triggerTaskNotesExtension(trigger);
	return removeUndefined({
		...trigger.extensions,
		id: trigger.id,
		event: compact({
			id: eventId,
			version: trigger.type === "contract.event" ? trigger.version : "1.0.0",
		}),
		debounce: trigger.debounce,
		minimum_interval: trigger.minimumInterval,
		[TASKNOTES_EXTENSION]: tasknotes,
	});
}

function workflowStepToRuntimeRecord(step: WorkflowStep): Dict {
	assertRuntimeIdentifier(step.id, `step id ${step.id}`);
	assertRuntimeIdentifier(step.type, `step action ${step.type}`);
	const conditions = step.if === undefined ? [] : Array.isArray(step.if) ? step.if : [step.if];
	const tasknotes = compact({
		conditions: conditions.length > 0 ? conditions : undefined,
	});
	return removeUndefined({
		...step.extensions,
		id: step.id,
		action: compact({
			id: step.type,
			version: step.contract?.version ?? "1.0.0",
			digest: step.contract?.digest,
		}),
		name: step.name,
		if: conditionsToExpression(conditions),
		input: step.input ? normalizeExpressionValues(step.input) : undefined,
		for_each: workflowForEachToRuntime(step.forEach),
		requires: normalizeRequires(step.requires),
		provider: step.provider,
		[TASKNOTES_EXTENSION]: Object.keys(tasknotes).length > 0 ? tasknotes : undefined,
	});
}

function triggerTaskNotesExtension(trigger: WorkflowTrigger): Dict {
	const extension: Dict = { type: trigger.type };
	if (trigger.type === "tasknotes.event") {
		Object.assign(extension, select(trigger, ["from", "to", "path", "allowSelfTrigger"]));
	} else if (trigger.type === "contract.event") {
		Object.assign(extension, select(trigger, ["source", "path"]));
	} else if (trigger.type === "cron") {
		Object.assign(extension, select(trigger, ["schedule", "timezone", "catchUp"]));
	} else if (trigger.type === "interval") {
		Object.assign(extension, select(trigger, ["every"]));
	} else if (trigger.type === "obsidian.vault" || trigger.type === "obsidian.metadata" || trigger.type === "obsidian.workspace") {
		Object.assign(extension, select(trigger, ["event", "path"]));
	}
	return extension;
}

function runtimeEventForWorkflowTrigger(trigger: WorkflowTrigger): string {
	if (trigger.type === "tasknotes.event") return trigger.event;
	if (trigger.type === "contract.event") return trigger.contract;
	if (trigger.type === "cron") return "tasknotes-workflows.schedule.cron";
	if (trigger.type === "interval") return "tasknotes-workflows.schedule.interval";
	if (trigger.type === "manual") return "tasknotes-workflows.manual";
	return `${trigger.type}.${trigger.event}`;
}

function runtimeEventForTaskNotesTrigger(type: string, event: unknown, tasknotes: Dict): unknown {
	if (type === "cron") return tasknotes.schedule;
	if (type === "interval") return tasknotes.every;
	if (type === "manual") return undefined;
	if (type === "obsidian.vault" || type === "obsidian.metadata" || type === "obsidian.workspace") {
		return tasknotes.event;
	}
	return event;
}

function workflowForEachToRuntime(forEach: WorkflowForEach | undefined): Dict | undefined {
	if (!forEach) return undefined;
	return removeUndefined({
		items: normalizeExpressionValues(forEach.items),
		as: forEach.as,
	});
}

function runtimeForEachToTaskNotes(raw: unknown): WorkflowForEach | undefined {
	if (!isRecord(raw) || !("items" in raw)) return undefined;
	return {
		items: raw.items,
		as: typeof raw.as === "string" ? raw.as : undefined,
	};
}

function conditionsToExpression(conditions: WorkflowCondition[]): { $expr: string } | undefined {
	if (conditions.length === 0) return undefined;
	return {
		$expr: conditions.map(conditionToExpression).map((value) => `(${value})`).join(" && "),
	};
}

function conditionToExpression(condition: WorkflowCondition): string {
	if ("$expr" in condition) return condition.$expr;
	const field = condition.field;
	const value = expressionLiteral(condition.value);
	if (condition.operator === "is") return `${field} == ${value}`;
	if (condition.operator === "isNot") return `${field} != ${value}`;
	if (condition.operator === "in") return `${field} in ${value}`;
	if (condition.operator === "notIn") return `!(${field} in ${value})`;
	if (condition.operator === "exists") return `has(${field})`;
	if (condition.operator === "missing") return `!has(${field})`;
	if (condition.operator === "contains") return `${field}.contains(${value})`;
	if (condition.operator === "startsWith") return `${field}.startsWith(${value})`;
	if (condition.operator === "before") return `${field} < ${value}`;
	if (condition.operator === "after") return `${field} > ${value}`;
	if (condition.operator === "onOrBefore") return `${field} <= ${value}`;
	return `${field} >= ${value}`;
}

function expressionLiteral(value: unknown): string {
	if (value === undefined) return "null";
	return JSON.stringify(value);
}

function normalizeExpressionValues(value: unknown): unknown {
	if (typeof value === "string") {
		const match = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/u.exec(value);
		return match ? { $expr: match[1] } : value;
	}
	if (Array.isArray(value)) return value.map(normalizeExpressionValues);
	if (!isRecord(value)) return value;
	if (typeof value.$expr === "string") return { $expr: value.$expr };
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeExpressionValues(entry)]));
}

function normalizeRequires(raw: WorkflowDefinition["requires"]): unknown {
	if (!raw) return undefined;
	return removeUndefined({
		capabilities: raw.capabilities,
	});
}

function extension(record: Dict): Dict {
	return isRecord(record[TASKNOTES_EXTENSION]) ? record[TASKNOTES_EXTENSION] : {};
}

function otherExtensions(record: Dict): Record<`x-${string}`, unknown> | undefined {
	const entries = Object.entries(record).filter(([key]) => key.startsWith("x-") && key !== TASKNOTES_EXTENSION);
	return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function select(record: object, keys: string[]): Dict {
	const source = record as unknown as Dict;
	return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

function compact(record: Dict): Dict {
	return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function removeUndefined(record: Dict): Dict {
	return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function assertRuntimeIdentifier(value: string, label: string): void {
	if (!RUNTIME_IDENTIFIER.test(value)) throw new Error(`${label} is not a valid runtime identifier.`);
}

function isRecord(value: unknown): value is Dict {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
