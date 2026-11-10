import { describe, expect, it } from "vitest";
import { stringifyWorkflowData, toWorkflowData } from "../src/workflowData";

class RuntimeObject {
	value = 1;
}

describe("toWorkflowData", () => {
	it("copies plain data unchanged", () => {
		const value = {
			path: "Tasks/a.md",
			count: 2,
			done: false,
			due: null,
			tags: ["a", "b"],
			nested: { list: [{ x: 1 }] },
		};
		const copied = toWorkflowData(value);
		expect(copied).toEqual(value);
		expect(copied).not.toBe(value);
	});

	it("keeps dates and objects without a prototype", () => {
		const bare = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1 });
		const at = new Date("2026-10-06T00:00:00.000Z");
		expect(toWorkflowData({ at, bare })).toEqual({ at, bare: { a: 1 } });
	});

	it("omits class instances, functions and undefined like JSON does", () => {
		expect(
			toWorkflowData({
				keep: "yes",
				instance: new RuntimeObject(),
				map: new Map([["a", 1]]),
				fn: () => 1,
				missing: undefined,
				list: [new RuntimeObject(), () => 1, undefined, "x"],
			})
		).toEqual({ keep: "yes", list: [null, null, null, "x"] });
	});

	it("breaks cycles but copies repeated non-cyclic references", () => {
		const shared = { name: "shared" };
		const root: Record<string, unknown> = { a: shared, b: shared, list: [shared] };
		root.self = root;
		(root.list as unknown[]).push(root.list);

		expect(toWorkflowData(root)).toEqual({
			a: { name: "shared" },
			b: { name: "shared" },
			list: [{ name: "shared" }, null],
		});
	});

	it("normalises numbers and bigints to JSON-safe values", () => {
		expect(toWorkflowData([Number.NaN, Infinity, 3, BigInt(10)])).toEqual([null, null, 3, "10"]);
	});

	it("returns undefined for a top-level value that is not data", () => {
		expect(toWorkflowData(new RuntimeObject())).toBeUndefined();
		expect(toWorkflowData(() => 1)).toBeUndefined();
	});
});

describe("stringifyWorkflowData", () => {
	it("serialises circular structures without throwing", () => {
		const root: Record<string, unknown> = { id: "run" };
		root.self = root;
		expect(JSON.parse(stringifyWorkflowData(root, 2))).toEqual({ id: "run" });
	});

	it("serialises a non-data value as null", () => {
		expect(stringifyWorkflowData(undefined)).toBe("null");
	});
});
