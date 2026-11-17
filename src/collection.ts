import { parse, stringify } from "yaml";
import type { App } from "obsidian";
import type { RuntimeWorkflow } from "@callumalpass/mdbase-runtime";

export interface CollectionSettings { typeKeys: string[]; typesFolder: string; }
export async function collectionSettings(app: App): Promise<CollectionSettings | null> {
	if (!await app.vault.adapter.exists("mdbase.yaml")) return null;
	const config = parse(await app.vault.adapter.read("mdbase.yaml")) as { settings?: { explicit_type_keys?: string[]; types_folder?: string } };
	return { typeKeys: config.settings?.explicit_type_keys ?? ["type", "types"], typesFolder: config.settings?.types_folder ?? "_types" };
}
export function normalizeWorkflowType(data: unknown, config: CollectionSettings | null): unknown {
	if (!data || typeof data !== "object" || Array.isArray(data)) return data;
	const record = data as Record<string, unknown>;
	if (config?.typeKeys.some((key) => record[key] === "runtime_workflow" || Array.isArray(record[key]) && (record[key] as unknown[]).includes("runtime_workflow"))) {
		const normalized = { ...record, type: "runtime_workflow" };
		for (const key of config.typeKeys) if (key !== "type") delete (normalized as Record<string, unknown>)[key];
		return normalized;
	}
	return data;
}
export async function runtimeFrontmatter(app: App, record: RuntimeWorkflow): Promise<string> {
	const config = await collectionSettings(app);
	const key = config?.typeKeys[0] ?? "type";
	if (config && config.typeKeys.length === 0) throw new Error("Collection explicit_type_keys is empty; configure a type key before writing workflows.");
	const { type, ...fields } = record;
	return stringify({ [key]: type, ...fields }, { lineWidth: 100 });
}
export async function hasRuntimeType(app: App, config: CollectionSettings): Promise<boolean> {
	const visit = async (folder: string): Promise<boolean> => {
		if (!await app.vault.adapter.exists(folder)) return false;
		const listing = await app.vault.adapter.list(folder);
		for (const file of listing.files) {
			if (!/\.(md|yaml|yml)$/u.test(file)) continue;
			const text = await app.vault.adapter.read(file);
			const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
			if (file.endsWith(".md") && !match) continue;
			const type = parse(match?.[1] ?? text) as { kind?: string; name?: string; version?: unknown } | null;
			// Version 1 (runtime pack 0.2.0) pins `type` and rejects other type keys.
			if (type?.kind === "mdbase.type" && type.name === "runtime_workflow" && Number(type.version) >= 2) return true;
		}
		for (const child of listing.folders) if (await visit(child)) return true;
		return false;
	};
	return await visit(config.typesFolder);
}
