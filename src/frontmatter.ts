import { parseDocument } from "yaml";

export interface FrontmatterParseResult {
	frontmatterText: string;
	body: string;
	data: unknown;
	error?: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/u;

export function parseMarkdownFrontmatter(markdown: string): FrontmatterParseResult {
	const match = markdown.match(FRONTMATTER_PATTERN);
	if (!match) {
		return {
			frontmatterText: "",
			body: markdown,
			data: null,
			error: "Workflow file must start with YAML frontmatter.",
		};
	}

	const frontmatterText = match[1] ?? "";
	const body = match[2] ?? "";
	const document = parseDocument(frontmatterText, {
		prettyErrors: false,
		uniqueKeys: true,
	});
	if (document.errors.length > 0) {
		return {
			frontmatterText,
			body,
			data: null,
			error: document.errors.map((error) => error.message).join("; "),
		};
	}

	return {
		frontmatterText,
		body,
		data: document.toJSON(),
	};
}

export function replaceMarkdownFrontmatter(markdown: string, frontmatterText: string): string {
	const match = markdown.match(FRONTMATTER_PATTERN);
	if (!match) {
		return `---\n${frontmatterText.trim()}\n---\n\n${markdown}`;
	}

	const body = match[2] ?? "";
	return `---\n${frontmatterText.trim()}\n---\n${body.startsWith("\n") ? "" : "\n"}${body}`;
}

