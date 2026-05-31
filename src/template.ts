import type { WorkflowRunContext } from "./types";

const TEMPLATE_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/gu;

export function resolveTemplateValue(value: unknown, context: WorkflowRunContext): unknown {
	if (typeof value === "string") {
		return resolveTemplateString(value, context);
	}
	if (Array.isArray(value)) {
		return value.map((item) => resolveTemplateValue(item, context));
	}
	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [key, resolveTemplateValue(entry, context)])
		);
	}
	return value;
}

export function resolveTemplateString(value: string, context: WorkflowRunContext): unknown {
	const fullExpression = value.match(/^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/u);
	if (fullExpression) {
		return readReference(context, fullExpression[1] ?? "");
	}

	return value.replace(TEMPLATE_PATTERN, (_match, expression: string) => {
		const resolved = readReference(context, expression);
		if (resolved === null || typeof resolved === "undefined") return "";
		if (typeof resolved === "object") return JSON.stringify(resolved);
		return stringifyScalar(resolved);
	});
}

export function readReference(root: unknown, expression: string): unknown {
	const path = expression.trim();
	if (!/^[A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z0-9_$-]+|\[[0-9]+\])*$/u.test(path)) {
		throw new Error(`Unsupported workflow reference: ${expression}`);
	}

	const parts = path
		.replace(/\[([0-9]+)\]/gu, ".$1")
		.split(".")
		.filter((part) => part.length > 0);
	let current = root;
	for (const part of parts) {
		if (current === null || typeof current === "undefined") return undefined;
		if (Array.isArray(current)) {
			current = current[Number(part)];
			continue;
		}
		if (typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

export function collectTemplateReferences(value: unknown): string[] {
	const references = new Set<string>();
	visitValue(value, (entry) => {
		if (typeof entry !== "string") return;
		for (const match of entry.matchAll(TEMPLATE_PATTERN)) {
			if (match[1]) references.add(match[1].trim());
		}
	});
	return Array.from(references);
}

function visitValue(value: unknown, visit: (value: unknown) => void): void {
	visit(value);
	if (Array.isArray(value)) {
		for (const entry of value) visitValue(entry, visit);
		return;
	}
	if (isPlainObject(value)) {
		for (const entry of Object.values(value)) visitValue(entry, visit);
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringifyScalar(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
		return String(value);
	}
	return JSON.stringify(value);
}
