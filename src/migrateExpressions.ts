import { parseExpression, type Expression } from "obsidian-bases-expression";
import type { RuntimeWorkflow } from "@callumalpass/mdbase-runtime";
import { evaluateCel } from "./cel-host";
import { parseReferencePath } from "./template";
import { workflowToRuntimeRecord } from "./workflowFormat";
import type { LoadedWorkflow, WorkflowCondition, WorkflowDefinition } from "./types";

type Dict = Record<string, unknown>;
export function migrateExpressions(loaded: Pick<LoadedWorkflow, "workflow" | "runtime">): { record: RuntimeWorkflow; warnings: string[] } {
	if (!loaded.workflow) throw new Error("Invalid workflow.");
	const record = structuredClone(loaded.runtime ?? workflowToRuntimeRecord(loaded.workflow));
	const warnings: string[] = [];
	const convert = (value: unknown, path: string): unknown => {
		try {
			if (typeof value === "string" && value.includes("{{")) return convertTemplate(value);
			if (Array.isArray(value)) return value.map((item, index) => convert(item, `${path}[${index}]`));
			if (!isRecord(value)) return value;
			if (typeof value.$expr === "string") return { $expr: convertBases(value.$expr) };
			return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, convert(item, `${path}.${key}`)]));
		} catch (error) {
			warnings.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	};
	const condition = (conditions: WorkflowCondition[], path: string): { $expr: string } | undefined => {
		if (!conditions.length) return undefined;
		try { return { $expr: conditions.map(conditionToCel).map((source) => `(${source})`).join(" && ") }; }
		catch (error) { warnings.push(`${path}: ${error instanceof Error ? error.message : String(error)}`); return { $expr: "false" }; }
	};
	const workflowConditions = condition(loaded.workflow.conditions, "conditions");
	record.vars = convert(loaded.workflow.vars, "vars") as RuntimeWorkflow["vars"];
	for (const [index, trigger] of record.triggers.entries()) {
		const projected = loaded.workflow.triggers[index];
		const filters: string[] = [];
		if (trigger.if) filters.push(((convert(trigger.if, `triggers[${index}].if`) as { $expr: string } | null)?.$expr ?? "false"));
		if (workflowConditions) filters.push(workflowConditions.$expr);
		if (projected?.type === "tasknotes.event") {
			if (projected.from !== undefined) filters.push(`event.data.before.status == ${JSON.stringify(projected.from)}`);
			if (projected.to !== undefined) filters.push(`event.data.after.status == ${JSON.stringify(projected.to)}`);
			const ext = extension(trigger);
			delete ext.from; delete ext.to;
		}
		if (filters.length) trigger.if = { $expr: filters.map((source) => `(${source})`).join(" && ") };
	}
	for (const [index, step] of record.steps.entries()) {
		step.input = convert(loaded.workflow.steps[index]?.input, `steps[${index}].input`) as typeof step.input;
		if (step.for_each) step.for_each.items = convert(loaded.workflow.steps[index]?.forEach?.items, `steps[${index}].for_each.items`) as typeof step.for_each.items;
		const oldStep = loaded.workflow.steps[index];
		const conditions = oldStep?.if ? Array.isArray(oldStep.if) ? oldStep.if : [oldStep.if] : [];
		step.if = conditions.length ? condition(conditions, `steps[${index}].if`) : step.if ? convert(step.if, `steps[${index}].if`) as typeof step.if : undefined;
		const ext = extension(step);
		delete ext.conditions;
	}
	if (record.run?.idempotency) record.run.idempotency.key = convert(record.run.idempotency.key, "run.idempotency.key") as typeof record.run.idempotency.key;
	if (record.run?.concurrency) {
		const group = record.run.concurrency.group;
		record.run.concurrency.group = group === "workflow" ? { $expr: "workflow.id" } : group === "global" ? "global" : convert(group, "run.concurrency.group") as typeof group;
	}
	const ext = extension(record);
	delete ext.conditions;
	ext.format_version = 2;
	record["x-tasknotes"] = ext;
	if (warnings.length) {
		record.enabled = false;
		ext.comment = `Disabled during CEL migration. Manual conversion required: ${warnings.join("; ")}`;
	}
	return { record, warnings };
}

export function convertBases(source: string): string {
	const parsed = parseExpression(source);
	if (!parsed.ast || parsed.diagnostics.some(({ severity }) => severity === "error")) throw new Error(`Cannot parse Bases expression: ${source}`);
	const result = printCel(parsed.ast);
	const compiled = evaluateCel(result, {});
	if (!compiled.valid) throw new Error(compiled.diagnostics.map(({ message }) => message).join("; "));
	return result;
}
function printCel(node: Expression): string {
	switch (node.type) {
		case "Literal": return JSON.stringify(node.value);
		case "Identifier": return node.name === "today" ? "today()" : node.name === "now" ? "now()" : node.name;
		case "Array": return `[${node.elements.map(printCel).join(", ")}]`;
		case "Member": {
			if (node.object.type === "Identifier" && node.object.name === "event" && typeof node.property === "string" && node.property !== "data") {
				return `event.data[${JSON.stringify(node.property)}]`;
			}
			const object = printCel(node.object);
			if (!node.computed && node.property === "length") return `size(${object})`;
			return `${object}[${typeof node.property === "string" ? JSON.stringify(node.property) : printCel(node.property)}]`;
		}
		case "Unary":
			if (node.operator === "+") throw new Error("Unary plus requires manual conversion.");
			return `${node.operator}(${printCel(node.argument)})`;
		case "Binary": {
			if ((node.operator === "+" || node.operator === "-") && node.right.type === "Call" && node.right.callee.type === "Identifier" && node.right.callee.name === "duration") {
				const value = node.right.args[0];
				const match = value?.type === "Literal" && typeof value.value === "string" ? /^(\d+)(d|w)$/u.exec(value.value) : null;
				if (match) return `(${printCel(node.left)}).addDays(${Number(match[1]) * (match[2] === "w" ? 7 : 1) * (node.operator === "-" ? -1 : 1)})`;
				throw new Error("Duration arithmetic requires manual conversion.");
			}
			return `(${printCel(node.left)} ${node.operator} ${printCel(node.right)})`;
		}
		case "Call": {
			const args = node.args.map(printCel);
			if (node.callee.type === "Identifier") {
				const name = node.callee.name;
				if (name === "if" && args.length === 3) return `(${args[0]} ? ${args[1]} : ${args[2]})`;
				if (["today", "now", "date", "string", "number"].includes(name)) return `${name === "number" ? "double" : name}(${args.join(", ")})`;
			}
			if (node.callee.type === "Member" && typeof node.callee.property === "string") {
				const method = node.callee.property;
				if (["contains", "startsWith", "endsWith", "lower", "upper", "size"].includes(method)) return `${printCel(node.callee.object)}.${method}(${args.join(", ")})`;
			}
			throw new Error("Bases function requires manual conversion.");
		}
		default: throw new Error(`Bases ${node.type} requires manual conversion.`);
	}
}
function reference(source: string): string {
	const parts = parseReferencePath(source.trim());
	let root = parts.shift() ?? "";
	if (root === "today" || root === "now") root += "()";
	if (root === "event" && parts[0] !== "data") parts.unshift("data");
	return root + parts.map((part) => /^\d+$/u.test(part) ? `[${part}]` : `[${JSON.stringify(part)}]`).join("");
}
function convertTemplate(value: string): { $expr: string } {
	const full = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/u.exec(value);
	if (full) return { $expr: reference(full[1] ?? "") };
	const parts: string[] = [];
	let offset = 0;
	for (const match of value.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/gu)) {
		if ((match.index ?? 0) > offset) parts.push(JSON.stringify(value.slice(offset, match.index)));
		parts.push(`string(${reference(match[1] ?? "")})`);
		offset = (match.index ?? 0) + match[0].length;
	}
	if (offset === 0) throw new Error("Unclosed template requires manual conversion.");
	if (offset < value.length) parts.push(JSON.stringify(value.slice(offset)));
	return { $expr: parts.join(" + ") };
}
function referencePresence(source: string): string {
	const parts = parseReferencePath(source);
	let parent = parts.shift() ?? "";
	if (parent === "event" && parts[0] !== "data") parts.unshift("data");
	const checks: string[] = [];
	for (const part of parts) {
		checks.push(`${parent} != null`);
		checks.push(/^\d+$/u.test(part) ? `size(${parent}) > ${part}` : `${JSON.stringify(part)} in ${parent}`);
		parent += /^\d+$/u.test(part) ? `[${part}]` : `[${JSON.stringify(part)}]`;
	}
	return checks.join(" && ") || "true";
}
function conditionToCel(condition: WorkflowCondition): string {
	if ("$expr" in condition) return convertBases(condition.$expr);
	const field = reference(condition.field);
	const value = typeof condition.value === "string" && condition.value.includes("{{") ? convertTemplate(condition.value).$expr : JSON.stringify(condition.value ?? null);
	switch (condition.operator) {
		case "is": return `${field} == ${value}`;
		case "isNot": return `${field} != ${value}`;
		case "in": return `${field} in ${value}`;
		case "notIn": return `!(${field} in ${value})`;
		case "exists": return `(${referencePresence(condition.field)}) && ${field} != null && ${field} != ""`;
		case "missing": return `!(${referencePresence(condition.field)}) || ${field} == null || ${field} == ""`;
		case "startsWith": return `${field}.startsWith(${value})`;
		case "contains": throw new Error("contains on a field may refer to a list or string; choose CEL 'in' or '.contains()' explicitly.");
		default: {
			const op = { before: "<", after: ">", onOrBefore: "<=", onOrAfter: ">=" }[condition.operator];
			return `date(${field}) ${op} date(${value})`;
		}
	}
}
function extension(value: unknown): Dict {
	return isRecord(value) && isRecord(value["x-tasknotes"]) ? value["x-tasknotes"] : {};
}
function isRecord(value: unknown): value is Dict { return value !== null && typeof value === "object" && !Array.isArray(value); }

export function workflowToCelRecord(workflow: WorkflowDefinition): RuntimeWorkflow {
	return migrateExpressions({ workflow }).record;
}
