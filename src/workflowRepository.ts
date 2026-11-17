import { collectionSettings, normalizeWorkflowType, runtimeFrontmatter } from "./collection";
import { workflowToRuntimeRecord } from "./workflowFormat";
import type { RuntimeWorkflow } from "@callumalpass/mdbase-runtime";
import { normalizePath, TFile, type App } from "obsidian";
import { parseMarkdownFrontmatter, replaceMarkdownFrontmatter } from "./frontmatter";
import { isMarkdownFile, isWorkflowPath, safePathSegment } from "./path";
import { parseWorkflowDefinition } from "./workflowParser";
import type {
	LoadedWorkflow,
	TaskNotesWorkflowsSettings,
	WorkflowDefinition,
	WorkflowDiagnostic,
} from "./types";

export class WorkflowRepository {
	private workflows: LoadedWorkflow[] = [];

	constructor(
		private readonly app: App,
		private readonly getSettings: () => TaskNotesWorkflowsSettings
	) {}

	get loaded(): LoadedWorkflow[] {
		return [...this.workflows];
	}

	getById(id: string): LoadedWorkflow | null {
		return this.workflows.find((workflow) => workflow.workflow?.id === id) ?? null;
	}

	async reload(): Promise<LoadedWorkflow[]> {
		const folder = normalizePath(this.getSettings().workflowFolder);
		await this.ensureFolder(folder);
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => isWorkflowPath(file.path, folder));
		const loaded = await Promise.all(files.map((file) => this.loadFile(file)));
		this.workflows = loaded.sort((left, right) => {
			const leftName = left.workflow?.name ?? left.file.basename;
			const rightName = right.workflow?.name ?? right.file.basename;
			return leftName.localeCompare(rightName);
		});
		return this.loaded;
	}

	async loadFile(file: TFile): Promise<LoadedWorkflow> {
		const source = await this.app.vault.read(file);
		const parsed = parseMarkdownFrontmatter(source);
		const parseDiagnostics: WorkflowDiagnostic[] = parsed.error
			? [{ severity: "error", path: "$frontmatter", message: parsed.error }]
			: [];
		const { workflow, runtime, diagnostics, sourceFormat } = parsed.error
			? { workflow: null, diagnostics: [], sourceFormat: "unknown" as const }
			: parseWorkflowDefinition(normalizeWorkflowType(parsed.data, await collectionSettings(this.app)), source);

		return {
			file,
			body: parsed.body,
			source,
			sourceFormat,
			workflow,
			runtime,
			diagnostics: [...parseDiagnostics, ...diagnostics],
		};
	}

	async runtimeFrontmatter(record: RuntimeWorkflow): Promise<string> { return runtimeFrontmatter(this.app, record); }

	async saveWorkflow(file: TFile, workflow: WorkflowDefinition): Promise<void> {
		const source = await this.app.vault.read(file);
		const updated = replaceMarkdownFrontmatter(source, await this.runtimeFrontmatter(workflowToRuntimeRecord(workflow)));
		await this.app.vault.modify(file, updated);
		await this.reload();
	}

	async createWorkflow(workflow: WorkflowDefinition, body: string): Promise<LoadedWorkflow> {
		const folder = normalizePath(this.getSettings().workflowFolder);
		await this.ensureFolder(folder);
		const path = await this.uniqueWorkflowPath(folder, workflow.id);
		const content = `---\n${await this.runtimeFrontmatter(workflowToRuntimeRecord(workflow))}---\n\n${body.trim()}\n`;
		const file = await this.app.vault.create(path, content);
		await this.reload();
		return await this.loadFile(file);
	}

	async saveFrontmatter(file: TFile, frontmatterText: string): Promise<void> {
		const source = await this.app.vault.read(file);
		await this.app.vault.modify(file, replaceMarkdownFrontmatter(source, frontmatterText));
		await this.reload();
	}

	async findWorkflowFile(path: string): Promise<TFile | null> {
		const file = this.app.vault.getAbstractFileByPath(normalizePath(path));
		return isMarkdownFile(file) ? file : null;
	}

	private async ensureFolder(folder: string): Promise<void> {
		if (await this.app.vault.adapter.exists(folder)) return;
		const segments = folder.split("/").filter(Boolean);
		let current = "";
		for (const segment of segments) {
			current = current ? `${current}/${segment}` : segment;
			if (!(await this.app.vault.adapter.exists(current))) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	private async uniqueWorkflowPath(folder: string, id: string): Promise<string> {
		const baseName = safePathSegment(id) || "workflow";
		let candidate = `${folder}/${baseName}.md`;
		let index = 2;
		while (await this.app.vault.adapter.exists(candidate)) {
			candidate = `${folder}/${baseName}-${index}.md`;
			index += 1;
		}
		return candidate;
	}
}
