import { normalizePath, TFile } from "obsidian";
import type { PathFilter } from "./types";

export function isMarkdownFile(file: unknown): file is TFile {
	return file instanceof TFile && file.extension.toLowerCase() === "md";
}

export function isWorkflowPath(path: string, workflowFolder: string): boolean {
	const normalizedPath = normalizePath(path);
	const normalizedFolder = normalizePath(workflowFolder);
	return normalizedPath === normalizedFolder || normalizedPath.startsWith(`${normalizedFolder}/`);
}

export function pathMatchesFilter(path: string, filter?: PathFilter): boolean {
	if (!filter) return true;

	const normalizedPath = normalizePath(path);
	if (filter.extension) {
		const extension = normalizedPath.split(".").pop()?.toLowerCase() ?? "";
		if (extension !== filter.extension.replace(/^\./u, "").toLowerCase()) return false;
	}

	if (filter.glob && !globMatches(normalizedPath, filter.glob)) return false;
	return true;
}

export function globMatches(path: string, glob: string): boolean {
	const normalizedGlob = normalizePath(glob);
	const escaped = normalizedGlob
		.split("**")
		.map((part) =>
			part
				.split("*")
				.map(escapeRegExp)
				.join("[^/]*")
		)
		.join(".*");
	return new RegExp(`^${escaped}$`, "u").test(path);
}

export function safePathSegment(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/gu, "-")
		.replace(/^-+|-+$/gu, "")
		.slice(0, 96);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

