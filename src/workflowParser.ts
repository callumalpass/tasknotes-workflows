import { stringify } from "yaml";
import { LEGACY_WORKFLOW_TYPE, WORKFLOW_TYPE } from "./constants";
import { isConditionOperator } from "./conditions";
import { isWorkflowExpression, validateExpressionTree } from "./expressions";
import {
	detectWorkflowSourceFormat,
	runtimeRecordToTaskNotesInput,
	validateRuntimeWorkflowRecord,
	workflowToRuntimeRecord,
} from "./workflowFormat";
import type {
	LoadedWorkflow,
	ObsidianMetadataTrigger,
	ObsidianVaultTrigger,
	ObsidianWorkspaceTrigger,
	WorkflowCondition,
	WorkflowDefinition,
	WorkflowDiagnostic,
	WorkflowForEach,
	WorkflowRequires,
	WorkflowRunPolicy,
	WorkflowStep,
	WorkflowSourceFormat,
	WorkflowTrigger,
} from "./types";

const TOP_LEVEL_FIELDS = new Set([
	"type",
	"schemaVersion",
	"id",
	"name",
	"description",
	"enabled",
	"status",
	"requires",
	"trigger",
	"triggers",
	"vars",
	"query",
	"conditions",
	"steps",
	"actions",
	"run",
	"debug",
	"extensions",
]);

export function parseWorkflowDefinition(
	data: unknown,
	_source: string
): {
	workflow: WorkflowDefinition | null;
	diagnostics: WorkflowDiagnostic[];
	sourceFormat: WorkflowSourceFormat;
} {
	const diagnostics: WorkflowDiagnostic[] = [];
	const sourceFormat = detectWorkflowSourceFormat(data);
	if (!isRecord(data)) {
		return {
			workflow: null,
			sourceFormat,
			diagnostics: [
				{
					severity: "error",
					path: "$",
					message: "Workflow frontmatter must be an object.",
				},
			],
		};
	}

	if (sourceFormat === "runtime-v0.2") {
		diagnostics.push(...validateRuntimeWorkflowRecord(data));
		if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
			return { workflow: null, diagnostics, sourceFormat };
		}
	}
	const normalizedData = sourceFormat === "runtime-v0.2"
		? runtimeRecordToTaskNotesInput(data)
		: normalizeLegacyWorkflowObject(data);
	if (sourceFormat !== "runtime-v0.2") {
		for (const key of Object.keys(data)) {
			if (TOP_LEVEL_FIELDS.has(key) || key.startsWith("x-")) continue;
			diagnostics.push({
				severity: "warning",
				path: key,
				message: `Unknown top-level field "${key}".`,
			});
		}
	}

	const type = stringField(normalizedData, "type", diagnostics);
	if (type !== WORKFLOW_TYPE && type !== LEGACY_WORKFLOW_TYPE) {
		diagnostics.push({
			severity: "error",
			path: "type",
			message: `Expected type: ${WORKFLOW_TYPE}.`,
		});
	}

	const schemaVersion = numberField(normalizedData, "schemaVersion", diagnostics);
	if (schemaVersion !== 1) {
		diagnostics.push({
			severity: "error",
			path: "schemaVersion",
			message: "Only schemaVersion: 1 is supported.",
		});
	}

	const id = stringField(normalizedData, "id", diagnostics);
	if (id && !/^[a-z][a-z0-9._-]*$/u.test(id)) {
		diagnostics.push({
			severity: "error",
			path: "id",
			message: "Workflow id must start with a letter and use lowercase letters, numbers, dots, underscores, or dashes.",
		});
	}

	const name = stringField(normalizedData, "name", diagnostics);
	const enabled = booleanField(normalizedData, diagnostics);
	const triggers = parseTriggers(normalizedData, diagnostics);
	const conditions = parseConditions(arrayField(normalizedData, "conditions", diagnostics, []), diagnostics);
	const steps = parseSteps(normalizedData, diagnostics);
	const run = parseRunPolicy(normalizedData.run, diagnostics);
	const vars = isRecord(normalizedData.vars) ? normalizedData.vars : {};
	if (typeof normalizedData.vars !== "undefined" && !isRecord(normalizedData.vars)) {
		diagnostics.push({
			severity: "error",
			path: "vars",
			message: "vars must be an object.",
		});
	}

	const workflow: WorkflowDefinition | null =
		diagnostics.some((diagnostic) => diagnostic.severity === "error") ||
		!id ||
		!name ||
		!type ||
		!schemaVersion
			? null
			: {
					type: WORKFLOW_TYPE,
					schemaVersion: 1,
					id,
					name,
					description: optionalString(normalizedData.description),
					enabled,
					requires: parseRequires(normalizedData.requires, diagnostics),
					triggers,
					vars,
					query: isRecord(normalizedData.query) ? normalizedData.query : undefined,
					conditions,
					steps,
					run,
					debug: isRecord(normalizedData.debug) ? normalizedData.debug : undefined,
					extensions: collectExtensions(data, normalizedData, sourceFormat),
				};

	return { workflow, diagnostics, sourceFormat };
}

export function workflowToFrontmatter(workflow: WorkflowDefinition): string {
	return stringify(workflowToRuntimeRecord(workflow), {
		lineWidth: 100,
		sortMapEntries: false,
	});
}

export function loadedWorkflowStatus(workflow: LoadedWorkflow): "enabled" | "disabled" | "invalid" {
	if (!workflow.workflow) return "invalid";
	return workflow.workflow.enabled ? "enabled" : "disabled";
}

function parseRequires(raw: unknown, diagnostics: WorkflowDiagnostic[], path = "requires"): WorkflowRequires | undefined {
	if (typeof raw === "undefined") return undefined;
	if (!isRecord(raw)) {
		diagnostics.push({ severity: "error", path, message: "requires must be an object." });
		return undefined;
	}
	const requires: WorkflowRequires = {};
	if (typeof raw.capabilities !== "undefined") {
		if (Array.isArray(raw.capabilities) && raw.capabilities.every((item) => typeof item === "string")) {
			requires.capabilities = raw.capabilities;
		} else {
			diagnostics.push({ severity: "error", path: `${path}.capabilities`, message: "capabilities must be a string list." });
		}
	}
	return Object.keys(requires).length > 0 ? requires : undefined;
}

function parseTriggers(data: Record<string, unknown>, diagnostics: WorkflowDiagnostic[]): WorkflowTrigger[] {
	const rawTriggers = data.triggers ?? data.trigger;
	const triggerItems = Array.isArray(rawTriggers)
		? rawTriggers
		: typeof rawTriggers === "undefined"
			? []
			: [rawTriggers];
	if (triggerItems.length === 0) {
		diagnostics.push({
			severity: "error",
			path: "triggers",
			message: "At least one trigger is required.",
		});
		return [];
	}

	return triggerItems
		.map((trigger, index) => parseTrigger(trigger, `triggers[${index}]`, diagnostics))
		.filter((trigger): trigger is WorkflowTrigger => trigger !== null);
}

function parseTrigger(
	trigger: unknown,
	path: string,
	diagnostics: WorkflowDiagnostic[]
): WorkflowTrigger | null {
	if (!isRecord(trigger)) {
		diagnostics.push({ severity: "error", path, message: "Trigger must be an object." });
		return null;
	}

	const type = stringField(trigger, "type", diagnostics, path);
	const id = optionalString(trigger.id) ?? `${type || "trigger"}-${path.match(/\d+/u)?.[0] ?? "1"}`;
	if (!type) return null;
	if (!isRuntimeIdentifier(id)) {
		diagnostics.push({ severity: "error", path: `${path}.id`, message: "Trigger id must be a runtime identifier." });
		return null;
	}
	const extensions = nestedExtensions(trigger, triggerFields(type));

	if (type === "tasknotes.event") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!event) return null;
		return { ...trigger, id, type, event, extensions };
	}
	if (type === "contract.event") {
		const contract = stringField(trigger, "contract", diagnostics, path);
		const version = stringField(trigger, "version", diagnostics, path);
		if (!contract || !version) return null;
		if (!isRuntimeIdentifier(contract)) {
			diagnostics.push({
				severity: "error",
				path: `${path}.contract`,
				message: "contract must be an mdbase contract identifier.",
			});
			return null;
		}
		if (trigger.source !== undefined && typeof trigger.source !== "string") {
			diagnostics.push({ severity: "error", path: `${path}.source`, message: "source must be a string." });
			return null;
		}
		return {
			...trigger,
			id,
			type,
			contract,
			version,
			source: optionalString(trigger.source),
			extensions,
		};
	}
	if (type === "cron") {
		const schedule = stringField(trigger, "schedule", diagnostics, path);
		if (!schedule) return null;
		return { ...trigger, id, type: "cron", schedule, extensions };
	}
	if (type === "interval") {
		const every = stringField(trigger, "every", diagnostics, path);
		if (!every) return null;
		return { ...trigger, id, type: "interval", every, extensions };
	}
	if (type === "manual") {
		return { ...trigger, id, type: "manual", extensions };
	}
	if (type === "obsidian.vault") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!["create", "modify", "delete", "rename"].includes(event ?? "")) {
			diagnostics.push({ severity: "error", path: `${path}.event`, message: "Unsupported vault event." });
			return null;
		}
		return { ...trigger, id, type: "obsidian.vault", event: event as ObsidianVaultTrigger["event"], extensions };
	}
	if (type === "obsidian.metadata") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!["changed", "deleted", "resolve", "resolved"].includes(event ?? "")) {
			diagnostics.push({ severity: "error", path: `${path}.event`, message: "Unsupported metadata event." });
			return null;
		}
		return { ...trigger, id, type: "obsidian.metadata", event: event as ObsidianMetadataTrigger["event"], extensions };
	}
	if (type === "obsidian.workspace") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!["file-open", "active-leaf-change", "layout-change"].includes(event ?? "")) {
			diagnostics.push({ severity: "error", path: `${path}.event`, message: "Unsupported workspace event." });
			return null;
		}
		return { ...trigger, id, type: "obsidian.workspace", event: event as ObsidianWorkspaceTrigger["event"], extensions };
	}

	diagnostics.push({ severity: "error", path: `${path}.type`, message: `Unsupported trigger type: ${type}.` });
	return null;
}

function parseConditions(
	conditions: unknown[],
	diagnostics: WorkflowDiagnostic[],
	basePath = "conditions"
): WorkflowCondition[] {
	return conditions
		.map((condition, index) => parseCondition(condition, `${basePath}[${index}]`, diagnostics))
		.filter((condition): condition is WorkflowCondition => condition !== null);
}

function parseCondition(
	condition: unknown,
	path: string,
	diagnostics: WorkflowDiagnostic[]
): WorkflowCondition | null {
	if (!isRecord(condition)) {
		diagnostics.push({ severity: "error", path, message: "Condition must be an object." });
		return null;
	}
	if (isWorkflowExpression(condition)) {
		pushExpressionDiagnostics(condition, path, diagnostics);
		return {
			id: optionalString(condition.id),
			$expr: condition.$expr,
		};
	}
	const field = stringField(condition, "field", diagnostics, path);
	const operator = condition.operator;
	if (!isConditionOperator(operator)) {
		diagnostics.push({ severity: "error", path: `${path}.operator`, message: "Unsupported condition operator." });
		return null;
	}
	if (!field) return null;
	pushExpressionDiagnostics(condition.value, `${path}.value`, diagnostics);
	return {
		id: optionalString(condition.id),
		field,
		operator,
		value: condition.value,
	};
}

function parseSteps(data: Record<string, unknown>, diagnostics: WorkflowDiagnostic[]): WorkflowStep[] {
	const rawSteps: unknown[] = Array.isArray(data.steps)
		? data.steps
		: Array.isArray(data.actions)
			? (data.actions as unknown[]).map((action, index) =>
					isRecord(action) ? { id: `action-${index + 1}`, ...action } : action
				)
			: [];
	if (rawSteps.length === 0) {
		diagnostics.push({ severity: "error", path: "steps", message: "At least one step is required." });
		return [];
	}

	const ids = new Set<string>();
	return rawSteps
		.map((step, index) => parseStep(step, index, ids, diagnostics))
		.filter((step): step is WorkflowStep => step !== null);
}

function parseStep(
	step: unknown,
	index: number,
	ids: Set<string>,
	diagnostics: WorkflowDiagnostic[]
): WorkflowStep | null {
	const path = `steps[${index}]`;
	if (!isRecord(step)) {
		diagnostics.push({ severity: "error", path, message: "Step must be an object." });
		return null;
	}

	const id = stringField(step, "id", diagnostics, path);
	const type = stringField(step, "type", diagnostics, path);
	if (!id || !type) return null;
	if (!isRuntimeIdentifier(id)) {
		diagnostics.push({ severity: "error", path: `${path}.id`, message: "Step id must be a runtime identifier." });
		return null;
	}
	if (!isRuntimeIdentifier(type)) {
		diagnostics.push({ severity: "error", path: `${path}.type`, message: "Step type must be a runtime action identifier." });
		return null;
	}
	if (ids.has(id)) {
		diagnostics.push({ severity: "error", path: `${path}.id`, message: `Duplicate step id: ${id}.` });
		return null;
	}
	ids.add(id);

	let stepConditions: WorkflowCondition | WorkflowCondition[] | undefined;
	if (Array.isArray(step.if)) {
		stepConditions = parseConditions(step.if, diagnostics, `${path}.if`);
	} else if (typeof step.if !== "undefined") {
		stepConditions = parseCondition(step.if, `${path}.if`, diagnostics) ?? undefined;
	}
	if (typeof step.input !== "undefined" && !isRecord(step.input)) {
		diagnostics.push({ severity: "error", path: `${path}.input`, message: "Step input must be an object." });
	}
	if (isRecord(step.input)) pushExpressionDiagnostics(step.input, `${path}.input`, diagnostics);
	const forEach = parseForEach(step.forEach, `${path}.forEach`, diagnostics);
	if (forEach) pushExpressionDiagnostics(forEach.items, `${path}.forEach.items`, diagnostics);

	return {
		id,
		type,
		name: optionalString(step.name),
		input: isRecord(step.input) ? step.input : undefined,
		if: stepConditions,
		forEach,
		requires: parseRequires(step.requires, diagnostics, `${path}.requires`),
		contract: parseActionContractRequirement(step.contract, `${path}.contract`, diagnostics),
		provider: parseProviderSelector(step.provider, `${path}.provider`, diagnostics),
		extensions: nestedExtensions(step, new Set([
			"id",
			"type",
			"name",
			"input",
			"if",
			"forEach",
			"requires",
			"contract",
			"provider",
			"extensions",
		])),
	};
}

function parseActionContractRequirement(
	value: unknown,
	path: string,
	diagnostics: WorkflowDiagnostic[],
): WorkflowStep["contract"] {
	if (value === undefined) return undefined;
	if (!isRecord(value)) {
		diagnostics.push({ severity: "error", path, message: "contract must be an object." });
		return undefined;
	}
	const version = optionalString(value.version);
	const digest = optionalString(value.digest);
	if (value.version !== undefined && !version) {
		diagnostics.push({ severity: "error", path: `${path}.version`, message: "version must be a non-empty string." });
	}
	if (value.digest !== undefined && !digest) {
		diagnostics.push({ severity: "error", path: `${path}.digest`, message: "digest must be a non-empty string." });
	}
	return { ...(version ? { version } : {}), ...(digest ? { digest } : {}) };
}

function parseProviderSelector(
	value: unknown,
	path: string,
	diagnostics: WorkflowDiagnostic[],
): WorkflowStep["provider"] {
	if (value === undefined) return undefined;
	if (!isRecord(value)) {
		diagnostics.push({ severity: "error", path, message: "provider must be an object." });
		return undefined;
	}
	const application = optionalString(value.application);
	const implementation = optionalString(value.implementation);
	const instance_id = optionalString(value.instance_id);
	if (!application && !implementation && !instance_id) {
		diagnostics.push({ severity: "error", path, message: "provider must select at least one identity field." });
		return undefined;
	}
	return {
		...(application ? { application } : {}),
		...(implementation ? { implementation } : {}),
		...(instance_id ? { instance_id } : {}),
	};
}

function parseForEach(
	raw: unknown,
	path: string,
	diagnostics: WorkflowDiagnostic[]
): WorkflowForEach | undefined {
	if (typeof raw === "undefined") return undefined;
	if (isWorkflowExpression(raw) || typeof raw === "string" || Array.isArray(raw)) {
		return { items: raw };
	}
	if (!isRecord(raw)) {
		diagnostics.push({ severity: "error", path, message: "forEach must be an object with items." });
		return undefined;
	}
	if (!Object.prototype.hasOwnProperty.call(raw, "items")) {
		diagnostics.push({ severity: "error", path, message: "forEach.items is required." });
		return undefined;
	}
	const result: WorkflowForEach = { items: raw.items };
	const alias = optionalString(raw.as);
	if (alias) {
		if (/^[A-Za-z][A-Za-z0-9_]*$/u.test(alias)) {
			result.as = alias;
		} else {
			diagnostics.push({
				severity: "error",
				path: `${path}.as`,
				message: "forEach.as must start with a letter and use letters, numbers, or underscores.",
			});
		}
	}
	return result;
}

function parseRunPolicy(raw: unknown, diagnostics: WorkflowDiagnostic[]): WorkflowRunPolicy {
	const run = isRecord(raw) ? raw : {};
	if (typeof raw !== "undefined" && !isRecord(raw)) {
		diagnostics.push({ severity: "error", path: "run", message: "run must be an object." });
	}

	if (typeof run.mode !== "undefined" && run.mode !== "sequential") {
		diagnostics.push({ severity: "error", path: "run.mode", message: "mode must be sequential." });
	}
	const onError = run.onError === "continue" ? "continue" : "stop";
	if (typeof run.onError !== "undefined" && run.onError !== "continue" && run.onError !== "stop") {
		diagnostics.push({ severity: "error", path: "run.onError", message: "onError must be stop or continue." });
	}
	const concurrency = isRecord(run.concurrency) ? run.concurrency : {};
	if (typeof run.concurrency !== "undefined" && !isRecord(run.concurrency)) {
		diagnostics.push({ severity: "error", path: "run.concurrency", message: "concurrency must be an object." });
	}
	const policy = parseConcurrencyPolicy(concurrency.policy, run.noOverlap, diagnostics);
	const limits = isRecord(run.limits) ? run.limits : {};
	if (typeof run.limits !== "undefined" && !isRecord(run.limits)) {
		diagnostics.push({ severity: "error", path: "run.limits", message: "limits must be an object." });
	}
	const maxItems = Number(limits.maxItems ?? run.maxTasks ?? 50);
	if (!Number.isFinite(maxItems) || maxItems <= 0) {
		diagnostics.push({ severity: "error", path: "run.limits.maxItems", message: "maxItems must be a positive number." });
	}

	return {
		mode: "sequential",
		concurrency: {
			group: optionalString(concurrency.group) ?? "workflow",
			policy,
		},
		source: optionalString(run.source) ?? "tasknotes-workflows",
		limits: {
			maxItems: Number.isFinite(maxItems) && maxItems > 0 ? Math.floor(maxItems) : 50,
			timeout: optionalString(limits.timeout) ?? optionalString(run.timeout),
		},
		onError,
	};
}

function parseConcurrencyPolicy(
	rawPolicy: unknown,
	legacyNoOverlap: unknown,
	diagnostics: WorkflowDiagnostic[]
): WorkflowRunPolicy["concurrency"]["policy"] {
	if (rawPolicy === "skip" || rawPolicy === "queue" || rawPolicy === "replace" || rawPolicy === "allow") {
		return rawPolicy;
	}
	if (typeof rawPolicy !== "undefined") {
		diagnostics.push({
			severity: "error",
			path: "run.concurrency.policy",
			message: "concurrency.policy must be skip, queue, replace, or allow.",
		});
	}
	return legacyNoOverlap === false ? "allow" : "skip";
}

function normalizeLegacyWorkflowObject(data: Record<string, unknown>): Record<string, unknown> {
	return normalizeLegacyValue(data) as Record<string, unknown>;
}

function normalizeLegacyValue(value: unknown): unknown {
	if (typeof value === "string") return normalizeLegacyReferenceString(value);
	if (Array.isArray(value)) return value.map(normalizeLegacyValue);
	if (!isRecord(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeLegacyValue(entry)]));
}

function normalizeLegacyReferenceString(value: string): string {
	return normalizeLegacyStepReferences(normalizeLegacyEventReferences(value));
}

function normalizeLegacyEventReferences(value: string): string {
	return value
		.replace(/\btrigger\.event\b/gu, "event.type")
		.replace(/\btrigger\.(after|before|changes|path|file|scheduledAt|actualAt|data|manual|source|correlationId)\b/gu, "event.$1");
}

function normalizeLegacyStepReferences(value: string): string {
	const dotted = value.replace(/\bsteps\.([A-Za-z0-9_-]+)\.([A-Za-z_$][A-Za-z0-9_$-]*)/gu, (match, stepId: string, key: string) => {
		if (key === "status" || key === "output" || key === "error") return match;
		return `${stepReferenceRoot(stepId)}.output.${key}`;
	});
	return dotted.replace(/\bsteps\[(["'])([^"']+)\1\]\.([A-Za-z_$][A-Za-z0-9_$-]*)/gu, (match, quote: string, stepId: string, key: string) => {
		if (key === "status" || key === "output" || key === "error") return match;
		return `steps[${quote}${stepId}${quote}].output.${key}`;
	});
}

function stepReferenceRoot(stepId: string): string {
	if (/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(stepId)) return `steps.${stepId}`;
	return `steps["${stepId.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"]`;
}

function collectExtensions(
	original: Record<string, unknown>,
	normalized: Record<string, unknown>,
	sourceFormat: WorkflowSourceFormat
): Record<`x-${string}`, unknown> | undefined {
	const extensions = extensionRecord(normalized.extensions) ?? {};
	for (const [key, value] of Object.entries(original)) {
		if (key.startsWith("x-") && key !== "x-tasknotes") extensions[key as `x-${string}`] = value;
	}
	if (sourceFormat !== "runtime-v0.2") {
		const unknown = Object.fromEntries(
			Object.entries(original).filter(([key]) => !TOP_LEVEL_FIELDS.has(key) && !key.startsWith("x-"))
		);
		if (Object.keys(unknown).length > 0) extensions["x-tasknotes-legacy"] = { frontmatter: unknown };
	}
	return Object.keys(extensions).length > 0 ? extensions : undefined;
}

function extensionRecord(value: unknown): Record<`x-${string}`, unknown> | undefined {
	if (!isRecord(value)) return undefined;
	const entries = Object.entries(value).filter(([key]) => key.startsWith("x-"));
	return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function nestedExtensions(
	record: Record<string, unknown>,
	knownFields: Set<string>
): Record<`x-${string}`, unknown> | undefined {
	const extensions = extensionRecord(record.extensions) ?? {};
	for (const [key, value] of Object.entries(record)) {
		if (key.startsWith("x-")) extensions[key as `x-${string}`] = value;
	}
	const unknown = Object.fromEntries(
		Object.entries(record).filter(([key]) => !knownFields.has(key) && !key.startsWith("x-"))
	);
	if (Object.keys(unknown).length > 0) extensions["x-tasknotes-legacy"] = { fields: unknown };
	return Object.keys(extensions).length > 0 ? extensions : undefined;
}

function triggerFields(type: string): Set<string> {
	const fields = new Set(["id", "type", "debounce", "minimumInterval", "extensions"]);
	if (type === "tasknotes.event") ["event", "from", "to", "path", "allowSelfTrigger"].forEach((field) => fields.add(field));
	if (type === "contract.event") ["contract", "version", "source", "path"].forEach((field) => fields.add(field));
	if (type === "cron") ["schedule", "timezone", "catchUp"].forEach((field) => fields.add(field));
	if (type === "interval") fields.add("every");
	if (type === "obsidian.vault" || type === "obsidian.metadata" || type === "obsidian.workspace") {
		fields.add("event");
		fields.add("path");
	}
	return fields;
}

function isRuntimeIdentifier(value: string): boolean {
	return /^[A-Za-z][A-Za-z0-9._:-]*$/u.test(value);
}

function stringField(
	data: Record<string, unknown>,
	field: string,
	diagnostics: WorkflowDiagnostic[],
	basePath?: string
): string | null {
	const value = data[field];
	if (typeof value === "string" && value.trim().length > 0) return value.trim();
	diagnostics.push({
		severity: "error",
		path: basePath ? `${basePath}.${field}` : field,
		message: `${field} must be a non-empty string.`,
	});
	return null;
}

function numberField(
	data: Record<string, unknown>,
	field: string,
	diagnostics: WorkflowDiagnostic[]
): number | null {
	const value = data[field];
	if (typeof value === "number") return value;
	diagnostics.push({ severity: "error", path: field, message: `${field} must be a number.` });
	return null;
}

function arrayField(
	data: Record<string, unknown>,
	field: string,
	diagnostics: WorkflowDiagnostic[],
	fallback: unknown[]
): unknown[] {
	const value = data[field];
	if (typeof value === "undefined") return fallback;
	if (Array.isArray(value)) return value;
	diagnostics.push({ severity: "error", path: field, message: `${field} must be an array.` });
	return fallback;
}

function booleanField(data: Record<string, unknown>, diagnostics: WorkflowDiagnostic[]): boolean {
	if (typeof data.enabled === "boolean") return data.enabled;
	if (typeof data.status === "string") return data.status !== "disabled" && data.status !== "inactive";
	diagnostics.push({
		severity: "warning",
		path: "enabled",
		message: "enabled was omitted; workflow defaults to disabled.",
	});
	return false;
}

function pushExpressionDiagnostics(value: unknown, path: string, diagnostics: WorkflowDiagnostic[]): void {
	for (const issue of validateExpressionTree(value, path)) {
		diagnostics.push({
			severity: "error",
			path: issue.path,
			message: issue.message,
		});
	}
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
