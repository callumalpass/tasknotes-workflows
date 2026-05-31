import { stringify } from "yaml";
import { WORKFLOW_TYPE } from "./constants";
import { isConditionOperator } from "./conditions";
import type {
	LoadedWorkflow,
	ObsidianMetadataTrigger,
	ObsidianVaultTrigger,
	ObsidianWorkspaceTrigger,
	WorkflowCondition,
	WorkflowDefinition,
	WorkflowDiagnostic,
	WorkflowRunPolicy,
	WorkflowStep,
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
	"trigger",
	"triggers",
	"vars",
	"query",
	"conditions",
	"steps",
	"actions",
	"run",
	"debug",
]);

export function parseWorkflowDefinition(
	data: unknown,
	_source: string
): { workflow: WorkflowDefinition | null; diagnostics: WorkflowDiagnostic[] } {
	const diagnostics: WorkflowDiagnostic[] = [];
	if (!isRecord(data)) {
		return {
			workflow: null,
			diagnostics: [
				{
					severity: "error",
					path: "$",
					message: "Workflow frontmatter must be an object.",
				},
			],
		};
	}

	for (const key of Object.keys(data)) {
		if (!TOP_LEVEL_FIELDS.has(key)) {
			diagnostics.push({
				severity: "warning",
				path: key,
				message: `Unknown top-level field "${key}".`,
			});
		}
	}

	const type = stringField(data, "type", diagnostics);
	if (type !== WORKFLOW_TYPE) {
		diagnostics.push({
			severity: "error",
			path: "type",
			message: `Expected type: ${WORKFLOW_TYPE}.`,
		});
	}

	const schemaVersion = numberField(data, "schemaVersion", diagnostics);
	if (schemaVersion !== 1) {
		diagnostics.push({
			severity: "error",
			path: "schemaVersion",
			message: "Only schemaVersion: 1 is supported.",
		});
	}

	const id = stringField(data, "id", diagnostics);
	if (id && !/^[a-z][a-z0-9._-]*$/u.test(id)) {
		diagnostics.push({
			severity: "error",
			path: "id",
			message: "Workflow id must start with a letter and use lowercase letters, numbers, dots, underscores, or dashes.",
		});
	}

	const name = stringField(data, "name", diagnostics);
	const enabled = booleanField(data, diagnostics);
	const triggers = parseTriggers(data, diagnostics);
	const conditions = parseConditions(arrayField(data, "conditions", diagnostics, []), diagnostics);
	const steps = parseSteps(data, diagnostics);
	const run = parseRunPolicy(data.run, diagnostics);
	const vars = isRecord(data.vars) ? data.vars : {};
	if (typeof data.vars !== "undefined" && !isRecord(data.vars)) {
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
					description: optionalString(data.description),
					enabled,
					triggers,
					vars,
					query: isRecord(data.query) ? data.query : undefined,
					conditions,
					steps,
					run,
					debug: isRecord(data.debug) ? data.debug : undefined,
				};

	return { workflow, diagnostics };
}

export function workflowToFrontmatter(workflow: WorkflowDefinition): string {
	return stringify(workflow, {
		lineWidth: 100,
		sortMapEntries: false,
	});
}

export function loadedWorkflowStatus(workflow: LoadedWorkflow): "enabled" | "disabled" | "invalid" {
	if (!workflow.workflow) return "invalid";
	return workflow.workflow.enabled ? "enabled" : "disabled";
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

	if (type === "tasknotes.event") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!event) return null;
		return { ...trigger, id, type, event };
	}
	if (type === "cron") {
		const schedule = stringField(trigger, "schedule", diagnostics, path);
		if (!schedule) return null;
		return { ...trigger, id, type: "cron", schedule };
	}
	if (type === "interval") {
		const every = stringField(trigger, "every", diagnostics, path);
		if (!every) return null;
		return { ...trigger, id, type: "interval", every };
	}
	if (type === "manual") {
		return { ...trigger, id, type: "manual" };
	}
	if (type === "obsidian.vault") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!["create", "modify", "delete", "rename"].includes(event ?? "")) {
			diagnostics.push({ severity: "error", path: `${path}.event`, message: "Unsupported vault event." });
			return null;
		}
		return { ...trigger, id, type: "obsidian.vault", event: event as ObsidianVaultTrigger["event"] };
	}
	if (type === "obsidian.metadata") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!["changed", "deleted", "resolve", "resolved"].includes(event ?? "")) {
			diagnostics.push({ severity: "error", path: `${path}.event`, message: "Unsupported metadata event." });
			return null;
		}
		return { ...trigger, id, type: "obsidian.metadata", event: event as ObsidianMetadataTrigger["event"] };
	}
	if (type === "obsidian.workspace") {
		const event = stringField(trigger, "event", diagnostics, path);
		if (!["file-open", "active-leaf-change", "layout-change"].includes(event ?? "")) {
			diagnostics.push({ severity: "error", path: `${path}.event`, message: "Unsupported workspace event." });
			return null;
		}
		return { ...trigger, id, type: "obsidian.workspace", event: event as ObsidianWorkspaceTrigger["event"] };
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
	const field = stringField(condition, "field", diagnostics, path);
	const operator = condition.operator;
	if (!isConditionOperator(operator)) {
		diagnostics.push({ severity: "error", path: `${path}.operator`, message: "Unsupported condition operator." });
		return null;
	}
	if (!field) return null;
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

	return {
		id,
		type,
		input: isRecord(step.input) ? step.input : undefined,
		if: stepConditions,
		forEach: optionalString(step.forEach),
	};
}

function parseRunPolicy(raw: unknown, diagnostics: WorkflowDiagnostic[]): WorkflowRunPolicy {
	const run = isRecord(raw) ? raw : {};
	if (typeof raw !== "undefined" && !isRecord(raw)) {
		diagnostics.push({ severity: "error", path: "run", message: "run must be an object." });
	}

	const onError = run.onError === "continue" ? "continue" : "stop";
	if (typeof run.onError !== "undefined" && run.onError !== "continue" && run.onError !== "stop") {
		diagnostics.push({ severity: "error", path: "run.onError", message: "onError must be stop or continue." });
	}

	return {
		mode: "sequential",
		noOverlap: run.noOverlap !== false,
		source: optionalString(run.source) ?? "tasknotes-workflows",
		maxTasks: Number(run.maxTasks ?? 50),
		onError,
		timeout: optionalString(run.timeout),
	};
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

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
