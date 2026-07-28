import { normalizePath, TFile, type App } from "obsidian";
import { parseMarkdownFrontmatter, replaceMarkdownFrontmatter } from "./frontmatter";
import type { WorkflowRepository } from "./workflowRepository";
import { parseWorkflowDefinition, workflowToFrontmatter } from "./workflowParser";
import type { WorkflowSourceFormat } from "./types";

export interface WorkflowMigrationCandidate {
	path: string;
	sourceFormat: Exclude<WorkflowSourceFormat, "runtime-v0.2" | "unknown">;
	sourceSha256: string;
	targetSha256: string;
	source: string;
	target: string;
	diff: string;
}

export interface WorkflowMigrationIssue {
	path: string;
	messages: string[];
}

export interface WorkflowMigrationReport {
	reportVersion: 1;
	reportId: string;
	analyzedAt: string;
	alreadyCanonical: string[];
	candidates: WorkflowMigrationCandidate[];
	invalid: WorkflowMigrationIssue[];
}

export interface WorkflowMigrationApplyResult {
	backupPath: string;
	migrated: string[];
}

export class WorkflowMigrationService {
	constructor(
		private readonly app: App,
		private readonly repository: WorkflowRepository
	) {}

	async analyze(): Promise<WorkflowMigrationReport> {
		const loadedWorkflows = await this.repository.reload();
		const alreadyCanonical: string[] = [];
		const candidates: WorkflowMigrationCandidate[] = [];
		const invalid: WorkflowMigrationIssue[] = [];

		for (const loaded of loadedWorkflows) {
			if (loaded.sourceFormat === "runtime-v0.2" && loaded.workflow) {
				alreadyCanonical.push(loaded.file.path);
				continue;
			}
			if (!loaded.workflow || loaded.sourceFormat === "unknown") {
				invalid.push({
					path: loaded.file.path,
					messages: loaded.diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`),
				});
				continue;
			}
			if (loaded.sourceFormat !== "tasknotes-v1" && loaded.sourceFormat !== "tasknotes-v0.1") {
				invalid.push({ path: loaded.file.path, messages: ["The workflow format could not be migrated safely."] });
				continue;
			}

			const target = replaceMarkdownFrontmatter(loaded.source, workflowToFrontmatter(loaded.workflow));
			const parsedTarget = parseMarkdownFrontmatter(target);
			const verified = parsedTarget.error
				? null
				: parseWorkflowDefinition(parsedTarget.data, target);
			if (!verified?.workflow || verified.sourceFormat !== "runtime-v0.2") {
				invalid.push({
					path: loaded.file.path,
					messages: parsedTarget.error
						? [parsedTarget.error]
						: verified?.diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`) ?? ["Canonical conversion failed."],
				});
				continue;
			}

			candidates.push({
				path: loaded.file.path,
				sourceFormat: loaded.sourceFormat,
				sourceSha256: await sha256(loaded.source),
				targetSha256: await sha256(target),
				source: loaded.source,
				target,
				diff: replacementDiff(loaded.file.path, loaded.source, target),
			});
		}

		alreadyCanonical.sort();
		candidates.sort((left, right) => left.path.localeCompare(right.path));
		invalid.sort((left, right) => left.path.localeCompare(right.path));
		const reportSeed = JSON.stringify({
			alreadyCanonical,
			candidates: candidates.map(({ path, sourceSha256, targetSha256 }) => ({ path, sourceSha256, targetSha256 })),
			invalid,
		});
		return {
			reportVersion: 1,
			reportId: (await sha256(reportSeed)).slice(0, 16),
			analyzedAt: new Date().toISOString(),
			alreadyCanonical,
			candidates,
			invalid,
		};
	}

	async apply(report: WorkflowMigrationReport): Promise<WorkflowMigrationApplyResult> {
		if (report.reportVersion !== 1) throw new Error("Unsupported workflow migration report version.");
		if (report.candidates.length === 0) throw new Error("No workflow files require migration.");
		const currentSources = new Map<string, { file: TFile; source: string }>();
		for (const candidate of report.candidates) {
			if (await sha256(candidate.target) !== candidate.targetSha256) {
				throw new Error(`Workflow migration target changed after analysis: ${candidate.path}`);
			}
			const file = this.app.vault.getAbstractFileByPath(candidate.path);
			if (!(file instanceof TFile)) throw new Error(`Workflow no longer exists: ${candidate.path}`);
			const source = await this.app.vault.read(file);
			if (await sha256(source) !== candidate.sourceSha256) {
				throw new Error(`Workflow changed after analysis: ${candidate.path}`);
			}
			currentSources.set(candidate.path, { file, source });
		}

		const backupPath = normalizePath(
			`${this.app.vault.configDir}/tasknotes-workflows/workflow-migrations/${timestampId()}-${report.reportId}`
		);
		await ensureAdapterFolder(this.app, `${backupPath}/files`);
		for (const candidate of report.candidates) {
			const backupFile = normalizePath(`${backupPath}/files/${candidate.path}`);
			await ensureAdapterFolder(this.app, parentPath(backupFile));
			await this.app.vault.adapter.write(backupFile, currentSources.get(candidate.path)?.source ?? candidate.source);
		}
		await this.app.vault.adapter.write(
			`${backupPath}/manifest.json`,
			JSON.stringify({
				report_version: report.reportVersion,
				report_id: report.reportId,
				created_at: new Date().toISOString(),
				files: report.candidates.map(({ path, sourceSha256, targetSha256 }) => ({
					path,
					source_sha256: sourceSha256,
					target_sha256: targetSha256,
				})),
			}, null, 2)
		);

		const migrated: string[] = [];
		try {
			for (const candidate of report.candidates) {
				const current = currentSources.get(candidate.path);
				if (!current) throw new Error(`Missing analyzed workflow: ${candidate.path}`);
				if (await sha256(await this.app.vault.read(current.file)) !== candidate.sourceSha256) {
					throw new Error(`Workflow changed while creating backups: ${candidate.path}`);
				}
				await this.app.vault.modify(current.file, candidate.target);
				migrated.push(candidate.path);
			}
		} catch (error) {
			await Promise.allSettled(migrated.map(async (path) => {
				const current = currentSources.get(path);
				if (current) await this.app.vault.modify(current.file, current.source);
			}));
			throw error;
		}

		await this.repository.reload();
		return { backupPath, migrated };
	}
}

function replacementDiff(path: string, source: string, target: string): string {
	const sourceLines = source.replace(/\r\n/gu, "\n").split("\n");
	const targetLines = target.replace(/\r\n/gu, "\n").split("\n");
	let prefix = 0;
	while (prefix < sourceLines.length && prefix < targetLines.length && sourceLines[prefix] === targetLines[prefix]) prefix += 1;
	let suffix = 0;
	while (
		suffix < sourceLines.length - prefix &&
		suffix < targetLines.length - prefix &&
		sourceLines[sourceLines.length - 1 - suffix] === targetLines[targetLines.length - 1 - suffix]
	) suffix += 1;
	const contextStart = Math.max(0, prefix - 3);
	const sourceEnd = sourceLines.length - suffix;
	const targetEnd = targetLines.length - suffix;
	const contextEnd = Math.min(sourceLines.length, sourceEnd + 3);
	return [
		`--- ${path}`,
		`+++ ${path}`,
		...sourceLines.slice(contextStart, prefix).map((line) => ` ${line}`),
		...sourceLines.slice(prefix, sourceEnd).map((line) => `-${line}`),
		...targetLines.slice(prefix, targetEnd).map((line) => `+${line}`),
		...sourceLines.slice(sourceEnd, contextEnd).map((line) => ` ${line}`),
	].join("\n");
}

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureAdapterFolder(app: App, folder: string): Promise<void> {
	let current = "";
	for (const segment of normalizePath(folder).split("/").filter(Boolean)) {
		current = current ? `${current}/${segment}` : segment;
		if (!(await app.vault.adapter.exists(current))) await app.vault.adapter.mkdir(current);
	}
}

function parentPath(path: string): string {
	return path.split("/").slice(0, -1).join("/");
}

function timestampId(): string {
	return new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}
