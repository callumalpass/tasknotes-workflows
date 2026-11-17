import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { validateRuntimeRecord } from "@callumalpass/mdbase-runtime";
import { collectionSettings, hasRuntimeType, normalizeWorkflowType, runtimeFrontmatter } from "../src/collection";
import { parseWorkflowDefinition } from "../src/workflowParser";
import { workflowToCelRecord } from "../src/migrateExpressions";
import { createWorkflowDefinition } from "../src/workflowScaffolding";

function app(config: string | undefined) {
	return { vault: { adapter: { exists: async () => config !== undefined, read: async () => config } } } as never;
}
describe("mdbase 0.3 type keys", () => {
	it.each(["mdbase_type", "custom_type", "type"])("writes and loads the configured %s key", async (key) => {
		const vault = app(`spec_version: 0.3.0\nsettings:\n  explicit_type_keys: [${key}]\n  types_folder: _mdbase/types\n`);
		const record = workflowToCelRecord(createWorkflowDefinition({ id: "test", name: "Test" }));
		const frontmatter = parse(await runtimeFrontmatter(vault, record));
		expect(frontmatter[key]).toBe("runtime_workflow");
		if (key !== "type") expect(frontmatter.type).toBeUndefined();
		const loaded = parseWorkflowDefinition(normalizeWorkflowType(frontmatter, await collectionSettings(vault)), "");
		expect(loaded.runtime?.id).toBe("test"); expect(loaded.diagnostics).toEqual([]);
		// The note as written is a valid record under mdbase.runtime.workflow 1.1.0.
		const validation = validateRuntimeRecord(frontmatter, "runtime_workflow");
		expect(validation.diagnostics).toEqual([]);
	});
	it("uses type by default and respects an empty explicit type key list", async () => {
		const record = workflowToCelRecord(createWorkflowDefinition({ id: "test", name: "Test" }));
		expect(parse(await runtimeFrontmatter(app(undefined), record)).type).toBe("runtime_workflow");
		await expect(runtimeFrontmatter(app("settings:\n  explicit_type_keys: []"), record)).rejects.toThrow(/explicit_type_keys is empty/);
	});
	it.each([[1, false], [2, true]])("treats runtime_workflow type version %i as installed: %s", async (version, installed) => {
		const files: Record<string, string> = { "_mdbase/types/workflow.md": `---\nkind: mdbase.type\nname: runtime_workflow\nversion: ${version}\n---\n` };
		const vault = { vault: { adapter: {
			exists: async (path: string) => path === "_mdbase/types",
			list: async () => ({ files: Object.keys(files), folders: [] }),
			read: async (path: string) => files[path],
		} } } as never;
		expect(await hasRuntimeType(vault, { typeKeys: ["mdbase_type"], typesFolder: "_mdbase/types" })).toBe(installed);
	});
});
