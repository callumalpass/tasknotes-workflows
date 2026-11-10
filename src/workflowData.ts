/**
 * Converts values that enter a workflow run (trigger events, step outputs)
 * into plain data: the shape that expressions, templates and the JSON run log
 * can safely walk.
 *
 * Step outputs come from TaskNotes, Obsidian and other plugins and can carry
 * live runtime objects. For example, TaskNotes attaches `basesData` (a Bases
 * entry that reaches the Obsidian `App`) to tasks rendered in a Bases view.
 * Those graphs are circular and not data, so they are dropped:
 *
 * - plain objects and arrays are copied recursively;
 * - strings, finite numbers, booleans and null are kept, and Dates are kept;
 * - class instances (anything whose prototype is not `Object.prototype` or
 *   `null`), functions, symbols and undefined are omitted from objects and
 *   become null inside arrays, matching JSON;
 * - a reference back to an object that is still being copied (a cycle) is
 *   omitted in the same way. Repeated references to the same value that are
 *   not cycles are copied each time.
 */
export function toWorkflowData(value: unknown): unknown {
	const copied = copyValue(value, new Set());
	return copied === OMIT ? undefined : copied;
}

/**
 * JSON.stringify that cannot throw on cycles or runtime objects, for the run
 * log. Values are passed through `toWorkflowData` first.
 */
export function stringifyWorkflowData(value: unknown, space?: number): string {
	return JSON.stringify(toWorkflowData(value), null, space) ?? "null";
}

const OMIT = Symbol("omit");

function copyValue(value: unknown, ancestors: Set<object>): unknown {
	if (value === null) return null;
	switch (typeof value) {
		case "string":
		case "boolean":
			return value;
		case "number":
			return Number.isFinite(value) ? value : null;
		case "bigint":
			return value.toString();
		case "object":
			break;
		default:
			return OMIT;
	}

	const object = value;
	if (object instanceof Date) return Number.isNaN(object.getTime()) ? null : new Date(object.getTime());
	if (ancestors.has(object)) return OMIT;

	if (Array.isArray(object)) {
		ancestors.add(object);
		const copy = object.map((entry) => {
			const copied = copyValue(entry, ancestors);
			return copied === OMIT ? null : copied;
		});
		ancestors.delete(object);
		return copy;
	}

	if (!isPlainObject(object)) return OMIT;

	ancestors.add(object);
	const copy: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(object)) {
		const copied = copyValue(entry, ancestors);
		if (copied !== OMIT) copy[key] = copied;
	}
	ancestors.delete(object);
	return copy;
}

function isPlainObject(value: object): boolean {
	const prototype = Object.getPrototypeOf(value) as unknown;
	return prototype === Object.prototype || prototype === null;
}
