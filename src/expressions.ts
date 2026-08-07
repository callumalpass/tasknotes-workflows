import {
	createEvaluationContext,
	evaluateToPlain,
	validateExpressionDetailed,
	type EvaluationContext,
	type FormulaLanguageSchema,
} from "obsidian-bases-expression";
import type {
	StepDefinition,
	WorkflowExpressionValue,
	WorkflowRunContext,
	WorkflowStep,
	WorkflowTrigger,
} from "./types";

export const EXPRESSION_KEY = "$expr";

export type WorkflowExpression = WorkflowExpressionValue;

export type ExpressionValidationIssue = {
	path: string;
	message: string;
};

export function isWorkflowExpression(value: unknown): value is WorkflowExpression {
	return isRecord(value) && typeof value[EXPRESSION_KEY] === "string";
}

export function evaluateWorkflowExpression(
	expression: WorkflowExpression,
	context: WorkflowRunContext
): unknown {
	const source = expression[EXPRESSION_KEY].trim();
	if (!source) throw new Error("Workflow expression cannot be empty.");
	return evaluateToPlain(source, workflowRunContextToBasesContext(context), { throwOnError: true });
}

export function workflowRunContextToBasesContext(context: WorkflowRunContext): EvaluationContext {
	const objects: Record<string, unknown> = {
		workflow: context.workflow,
		trigger: context.trigger,
		event: context.event,
		vars: context.vars,
		steps: context.steps,
		now: context.now,
		today: context.today,
	};
	if (typeof context.item !== "undefined") objects.item = context.item;
	for (const [key, value] of Object.entries(context)) {
		if (Object.prototype.hasOwnProperty.call(objects, key)) continue;
		objects[key] = value;
	}
	return createEvaluationContext({
		objects,
		now: context.now,
	});
}

export function validateExpressionTree(
	value: unknown,
	path = "$",
	schema: FormulaLanguageSchema = workflowExpressionSchema()
): ExpressionValidationIssue[] {
	const issues: ExpressionValidationIssue[] = [];
	visitExpressions(value, path, schema, issues);
	return issues;
}

export function summarizeExpression(value: unknown): string | null {
	if (!isWorkflowExpression(value)) return null;
	return value[EXPRESSION_KEY];
}

export function expressionSource(value: unknown): string {
	return isWorkflowExpression(value) ? value[EXPRESSION_KEY] : "";
}

export function workflowExpressionSchema(options: {
	triggers?: WorkflowTrigger[];
	steps?: WorkflowStep[];
	stepDefinitions?: (type: string) => StepDefinition | undefined;
	includeTaskFields?: boolean;
} = {}): FormulaLanguageSchema {
	return {
		objects: [
			{
				name: "workflow",
				type: "object",
				properties: [
					{ name: "id", type: "string" },
					{ name: "name", type: "string" },
					{ name: "filePath", type: "string" },
				],
			},
			{
				name: "trigger",
				type: "object",
				properties: [
					{ name: "id", type: "string" },
					{ name: "type", type: "string" },
					{ name: "event", type: "string" },
					{ name: "path", type: "object" },
					{ name: "schedule", type: "string" },
					{ name: "every", type: "string" },
					{ name: "timezone", type: "string" },
				],
			},
			{
				name: "event",
				type: "object",
				properties: [
					{ name: "type", type: "string" },
					{ name: "id", type: "string" },
					{ name: "triggerType", type: "string" },
					{ name: "path", type: "string" },
					{ name: "file", type: "object", properties: fileProperties() },
					{ name: "task", type: "object", properties: taskProperties() },
					{ name: "before", type: "object", properties: taskProperties() },
					{ name: "after", type: "object", properties: taskProperties() },
					{ name: "changes", type: "object" },
					{ name: "scheduledAt", type: "date" },
					{ name: "actualAt", type: "date" },
					{ name: "data", type: "object" },
					{ name: "manual", type: "boolean" },
					{ name: "source", type: "string" },
					{ name: "correlationId", type: "string" },
				],
			},
			{
				name: "vars",
				type: "object",
			},
			{
				name: "steps",
				type: "object",
				properties: stepResultProperties(options.steps ?? [], options.stepDefinitions),
			},
			{
				name: "item",
				type: "object",
				properties: taskProperties(),
			},
			{ name: "now", type: "date" },
			{ name: "today", type: "date" },
			...loopAliasObjects(options.steps ?? []),
		],
	};
}

function visitExpressions(
	value: unknown,
	path: string,
	schema: FormulaLanguageSchema,
	issues: ExpressionValidationIssue[]
): void {
	if (Array.isArray(value)) {
		for (const [index, entry] of value.entries()) visitExpressions(entry, `${path}[${index}]`, schema, issues);
		return;
	}
	if (!isRecord(value)) return;
	if (isWorkflowExpression(value)) {
		validateExpression(value, path, schema, issues);
		return;
	}
	for (const [key, entry] of Object.entries(value)) {
		visitExpressions(entry, `${path}.${key}`, schema, issues);
	}
}

function validateExpression(
	expression: WorkflowExpression,
	path: string,
	schema: FormulaLanguageSchema,
	issues: ExpressionValidationIssue[]
): void {
	const source = expression[EXPRESSION_KEY].trim();
	if (!source) {
		issues.push({ path: `${path}.${EXPRESSION_KEY}`, message: "Workflow expression cannot be empty." });
		return;
	}
	const validation = validateExpressionDetailed(source, schema);
	for (const diagnostic of validation.diagnostics) {
		if (diagnostic.severity !== "error") continue;
		issues.push({
			path: `${path}.${EXPRESSION_KEY}`,
			message: diagnostic.message,
		});
	}
}

function stepResultProperties(
	steps: WorkflowStep[],
	getStepDefinition?: (type: string) => StepDefinition | undefined
): Array<{ name: string; type: string; properties?: Array<{ name: string; type: string }> }> {
	return steps.map((step) => ({
		name: step.id,
		type: "object",
		properties: [
			{ name: "status", type: "string" },
			{
				name: "output",
				type: "object",
				properties: outputProperties(getStepDefinition?.(step.type)),
			},
			{ name: "error", type: "string" },
		],
	}));
}

function outputProperties(definition: StepDefinition | undefined): Array<{ name: string; type: string }> {
	return (definition?.outputFields ?? []).map((field) => ({
		name: field.key,
		type: formulaTypeFromWorkflowType(field.type),
	}));
}

function loopAliasObjects(steps: WorkflowStep[]): Array<{ name: string; type: string }> {
	const aliases = new Set<string>();
	for (const step of steps) {
		const alias = step.forEach?.as;
		if (alias && alias !== "item") aliases.add(alias);
	}
	return Array.from(aliases).map((name) => ({ name, type: "object" }));
}

function taskProperties(): Array<{ name: string; type: string }> {
	return [
		{ name: "path", type: "string" },
		{ name: "title", type: "string" },
		{ name: "status", type: "string" },
		{ name: "priority", type: "string" },
		{ name: "due", type: "date" },
		{ name: "scheduled", type: "date" },
		{ name: "startedAt", type: "date" },
		{ name: "completed", type: "date" },
		{ name: "tags", type: "list" },
		{ name: "contexts", type: "list" },
		{ name: "projects", type: "list" },
		{ name: "reminders", type: "list" },
		{ name: "dependencies", type: "list" },
		{ name: "isBlocked", type: "boolean" },
		{ name: "customProperties", type: "object" },
	];
}

function fileProperties(): Array<{ name: string; type: string }> {
	return [
		{ name: "path", type: "string" },
		{ name: "name", type: "string" },
		{ name: "extension", type: "string" },
	];
}

function formulaTypeFromWorkflowType(type: string): string {
	if (/\[\]$/u.test(type)) return "list";
	if (/number|count|total|matched|returned/iu.test(type)) return "number";
	if (/boolean|bool/iu.test(type)) return "boolean";
	if (/date|datetime/iu.test(type)) return "date";
	if (/object|record|query|warning/iu.test(type)) return "object";
	return "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
