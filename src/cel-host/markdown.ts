// Copied from mdbase-spec packages/cel-host/src/markdown.ts
// Origin commit: 47d257d6a56e34c7279e5ebb959af0b0f49744b2 (MIT).
import { parse } from "yaml";

export interface MarkdownRecord {
  path: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

export function parseMarkdownRecord(path: string, text: string): MarkdownRecord {
  const match = text.match(frontmatterPattern);
  if (!match) {
    return { path, frontmatter: {}, body: text };
  }
  // YAML integers stay CEL `int` values; other numbers become `double`.
  const parsed = parse(match[1] ?? "", { intAsBigInt: true }) as unknown;
  if (parsed != null && !isPlainObject(parsed)) {
    throw new Error(`Frontmatter for ${path} must be an object.`);
  }
  return {
    path,
    frontmatter: parsed ?? {},
    body: match[2] ?? ""
  };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

