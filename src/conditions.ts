import { readReference, resolveTemplateValue } from "./template";
import type { ConditionOperator, WorkflowCondition, WorkflowRunContext } from "./types";

export function conditionsMatch(
	conditions: WorkflowCondition[],
	context: WorkflowRunContext
): boolean {
	return conditions.every((condition) => conditionMatches(condition, context));
}

export function conditionMatches(condition: WorkflowCondition, context: WorkflowRunContext): boolean {
	const actual = readReference(context, condition.field);
	const expected = resolveTemplateValue(condition.value, context);

	switch (condition.operator) {
		case "is":
			return compareValues(actual, expected) === 0;
		case "isNot":
			return compareValues(actual, expected) !== 0;
		case "in":
			return Array.isArray(expected) && expected.some((item) => compareValues(actual, item) === 0);
		case "notIn":
			return !Array.isArray(expected) || expected.every((item) => compareValues(actual, item) !== 0);
		case "exists":
			return actual !== null && typeof actual !== "undefined" && actual !== "";
		case "missing":
			return actual === null || typeof actual === "undefined" || actual === "";
		case "contains":
			return containsValue(actual, expected);
		case "startsWith":
			return stringifyScalar(actual).startsWith(stringifyScalar(expected));
		case "before":
			return compareDates(actual, expected) < 0;
		case "after":
			return compareDates(actual, expected) > 0;
		case "onOrBefore":
			return compareDates(actual, expected) <= 0;
		case "onOrAfter":
			return compareDates(actual, expected) >= 0;
		default:
			assertNever(condition.operator);
	}
}

export function isConditionOperator(value: unknown): value is ConditionOperator {
	return (
		typeof value === "string" &&
		[
			"is",
			"isNot",
			"in",
			"notIn",
			"exists",
			"missing",
			"contains",
			"startsWith",
			"before",
			"after",
			"onOrBefore",
			"onOrAfter",
		].includes(value)
	);
}

function containsValue(actual: unknown, expected: unknown): boolean {
	if (Array.isArray(actual)) return actual.some((item) => compareValues(item, expected) === 0);
	return stringifyScalar(actual).includes(stringifyScalar(expected));
}

function compareValues(left: unknown, right: unknown): number {
	if (Object.is(left, right)) return 0;
	const leftText = stringifyScalar(left);
	const rightText = stringifyScalar(right);
	if (leftText === rightText) return 0;
	return leftText < rightText ? -1 : 1;
}

function compareDates(left: unknown, right: unknown): number {
	const leftDate = toDateValue(left);
	const rightDate = toDateValue(right);
	if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) return Number.NaN;
	return leftDate - rightDate;
}

function toDateValue(value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === "string" && value.toLowerCase() === "today") {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	}
	return new Date(stringifyScalar(value)).getTime();
}

function stringifyScalar(value: unknown): string {
	if (value === null || typeof value === "undefined") return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
		return String(value);
	}
	return JSON.stringify(value);
}

function assertNever(_value: never): never {
	throw new Error("Unsupported condition operator.");
}
