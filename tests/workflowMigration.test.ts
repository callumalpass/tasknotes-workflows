import { TFile } from "obsidian";
import { describe, expect, it } from "vitest";
import { validateRuntimeRecord } from "@callumalpass/mdbase-runtime";
import { parseMarkdownFrontmatter } from "../src/frontmatter";
import { WorkflowMigrationService } from "../src/workflowMigration";
import { WorkflowRepository } from "../src/workflowRepository";
import { DEFAULT_SETTINGS } from "../src/settings";

const LEGACY = `---
type: tasknotes-workflow
schemaVersion: 1
id: legacy
name: Legacy workflow
enabled: true
customSetting: keep-me
triggers:
  - id: manual
    type: manual
    customTriggerSetting: keep-trigger
steps:
  - id: notify
    type: notice.show
    customStepSetting: keep-step
    input:
      message: "{{workflow.name}}"
run:
  mode: sequential
  noOverlap: true
  maxTasks: 5
  source: tasknotes-workflows
  onError: stop
---

# User documentation

Keep this body exactly.
`;

class MemoryVault {
	readonly configDir = "config";
	readonly files = new Map<string, { file: TFile; content: string }>();
	readonly adapterFiles = new Map<string, string>();
	readonly folders = new Set<string>(["TaskNotes", "TaskNotes/Workflows", "config"]);
	failModifyPath: string | null = null;
	readonly adapter = {
		exists: async (path: string): Promise<boolean> => this.files.has(path) || this.adapterFiles.has(path) || this.folders.has(path),
		mkdir: async (path: string): Promise<void> => { this.folders.add(path); },
		write: async (path: string, content: string): Promise<void> => { this.adapterFiles.set(path, content); },
	};

	add(path: string, content: string): void {
		const file = new TFile();
		file.path = path;
		file.name = path.split("/").slice(-1)[0] ?? path;
		file.basename = file.name.replace(/\.md$/u, "");
		this.files.set(path, { file, content });
	}

	getMarkdownFiles(): TFile[] {
		return [...this.files.values()].map(({ file }) => file);
	}

	getAbstractFileByPath(path: string): TFile | null {
		return this.files.get(path)?.file ?? null;
	}

	async read(file: TFile): Promise<string> {
		return this.files.get(file.path)?.content ?? "";
	}

	async modify(file: TFile, content: string): Promise<void> {
		if (file.path === this.failModifyPath) throw new Error(`Injected write failure: ${file.path}`);
		const current = this.files.get(file.path);
		if (!current) throw new Error(`Missing file: ${file.path}`);
		current.content = content;
	}

	async createFolder(path: string): Promise<void> {
		this.folders.add(path);
	}
}

function setup(): { vault: MemoryVault; service: WorkflowMigrationService } {
	const vault = new MemoryVault();
	vault.add("TaskNotes/Workflows/legacy.md", LEGACY);
	const app = { vault } as never;
	const repository = new WorkflowRepository(app, () => ({ ...DEFAULT_SETTINGS }));
	return { vault, service: new WorkflowMigrationService(app, repository) };
}

describe("workflow migration", () => {
	it("analyzes without writing and applies a backed-up canonical conversion", async () => {
		const { vault, service } = setup();
		const report = await service.analyze();

		expect(report.candidates).toHaveLength(1);
		expect(report.invalid).toEqual([]);
		expect(vault.files.get("TaskNotes/Workflows/legacy.md")?.content).toBe(LEGACY);
		expect(report.candidates[0]?.diff).toContain("+version: 1.0.0");

		const applied = await service.apply(report);
		const migrated = vault.files.get("TaskNotes/Workflows/legacy.md")?.content ?? "";
		const parsed = parseMarkdownFrontmatter(migrated);
		expect(validateRuntimeRecord(parsed.data).valid).toBe(true);
		expect(migrated).toContain("# User documentation\n\nKeep this body exactly.");
		expect(migrated).toContain("id: notice.show");
		expect(migrated).toContain("customSetting: keep-me");
		expect(migrated).toContain("customTriggerSetting: keep-trigger");
		expect(migrated).toContain("customStepSetting: keep-step");
		expect(parsed.data).toMatchObject({
			"x-tasknotes-legacy": { frontmatter: { customSetting: "keep-me" } },
			triggers: [{ "x-tasknotes-legacy": { fields: { customTriggerSetting: "keep-trigger" } } }],
			steps: [{ "x-tasknotes-legacy": { fields: { customStepSetting: "keep-step" } } }],
		});
		expect(migrated).not.toContain("schemaVersion");
		expect(applied.migrated).toEqual(["TaskNotes/Workflows/legacy.md"]);
		expect(vault.adapterFiles.get(`${applied.backupPath}/files/TaskNotes/Workflows/legacy.md`)).toBe(LEGACY);
		expect(vault.adapterFiles.get(`${applied.backupPath}/manifest.json`)).toContain(report.reportId);
	});

	it("rejects a stale report before creating a backup or changing the file", async () => {
		const { vault, service } = setup();
		const report = await service.analyze();
		const current = vault.files.get("TaskNotes/Workflows/legacy.md");
		if (current) current.content = `${LEGACY}\nChanged after analysis.\n`;

		await expect(service.apply(report)).rejects.toThrow("changed after analysis");
		expect(vault.adapterFiles.size).toBe(0);
		expect(current?.content).toContain("Changed after analysis.");
	});

	it("rejects an altered migration target before creating a backup", async () => {
		const { vault, service } = setup();
		const report = await service.analyze();
		const candidate = report.candidates[0];
		if (candidate) candidate.target = `${candidate.target}\nAltered after review.\n`;

		await expect(service.apply(report)).rejects.toThrow("target changed after analysis");
		expect(vault.adapterFiles.size).toBe(0);
		expect(vault.files.get("TaskNotes/Workflows/legacy.md")?.content).toBe(LEGACY);
	});

	it("does not create an empty backup when all workflow files are canonical", async () => {
		const { vault, service } = setup();
		const legacyReport = await service.analyze();
		const current = vault.files.get("TaskNotes/Workflows/legacy.md");
		if (current && legacyReport.candidates[0]) current.content = legacyReport.candidates[0].target;
		const canonicalReport = await service.analyze();

		await expect(service.apply(canonicalReport)).rejects.toThrow("No workflow files require migration");
		expect(vault.adapterFiles.size).toBe(0);
	});

	it("restores earlier files when a later workflow write fails", async () => {
		const { vault, service } = setup();
		const second = LEGACY.replace("id: legacy", "id: legacy-two").replace("Legacy workflow", "Legacy workflow two");
		vault.add("TaskNotes/Workflows/zzz-legacy-two.md", second);
		const report = await service.analyze();
		vault.failModifyPath = "TaskNotes/Workflows/zzz-legacy-two.md";

		await expect(service.apply(report)).rejects.toThrow("Injected write failure");
		expect(vault.files.get("TaskNotes/Workflows/legacy.md")?.content).toBe(LEGACY);
		expect(vault.files.get("TaskNotes/Workflows/zzz-legacy-two.md")?.content).toBe(second);
	});
});
