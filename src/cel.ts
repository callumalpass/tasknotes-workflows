import { parse as parseCelExpression, type ASTNode } from "@marcbachmann/cel-js";
import { evaluateCel, evaluateTemplate } from "./cel-host";
import type { EvaluateCelOptions } from "./cel-host";

export function resolveCel(value: unknown, context: Record<string, unknown>, options: EvaluateCelOptions = {}): unknown {
	return evaluateTemplate(value, context, (source, activation) => {
		const result = evaluateCel(source, activation, options);
		if (result.diagnostics.length) throw new Error(result.diagnostics.map(({ message }) => message).join("; "));
		return result.value;
	});
}

export function celCondition(condition: { $expr: string } | undefined, context: Record<string, unknown>, options: EvaluateCelOptions = {}): boolean {
	if (!condition) return true;
	const value = resolveCel(condition, context, options);
	if (typeof value !== "boolean") throw new Error("Workflow condition must evaluate to a boolean.");
	return value;
}

export function evaluateVariables(vars: Record<string, unknown>, context: Record<string, unknown>, options: EvaluateCelOptions = {}): Record<string, unknown> {
	const resolved: Record<string, unknown> = {};
	const visiting = new Set<string>();
	const visit = (name: string): void => {
		if (Object.prototype.hasOwnProperty.call(resolved, name)) return;
		if (visiting.has(name)) throw new Error(`Cyclic workflow variable: ${name}`);
		if (!Object.prototype.hasOwnProperty.call(vars, name)) throw new Error(`Unknown workflow variable: ${name}`);
		visiting.add(name);
		for (const source of expressionSources(vars[name])) {
			for (const dependency of variableDependencies(parseCelExpression(source).ast)) visit(dependency);
		}
		resolved[name] = resolveCel(vars[name], { ...context, vars: resolved }, options);
		visiting.delete(name);
	};
	for (const name of Object.keys(vars)) visit(name);
	return resolved;
}

export function expressionSources(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(expressionSources);
	if (!value || typeof value !== "object") return [];
	const object = value as Record<string, unknown>;
	if (Object.keys(object).length === 1 && typeof object.$expr === "string") return [object.$expr];
	return Object.values(object).flatMap(expressionSources);
}

function variableDependencies(node: ASTNode): string[] {
	const result: string[] = [];
	if (node.op === "." && node.args[0].op === "id" && node.args[0].args === "vars") result.push(node.args[1]);
	if (node.op === "[]" && node.args[0].op === "id" && node.args[0].args === "vars") {
		if (node.args[1].op !== "value" || typeof node.args[1].args !== "string") throw new Error("Variable dependencies require literal keys.");
		result.push(node.args[1].args);
	}
	const visit = (value: unknown): void => {
		if (Array.isArray(value)) for (const child of value) visit(child);
		else if (value && typeof value === "object" && "op" in value) result.push(...variableDependencies(value as ASTNode));
	};
	visit(node.args);
	return result;
}
