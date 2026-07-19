import { describe, expect, it } from "vitest";
import { validateCanonicalSchema } from "@callumalpass/mdbase-runtime";
import { DefaultWorkflowsService } from "../src/defaultWorkflowsService";
import { parseMarkdownFrontmatter } from "../src/frontmatter";
import { DEFAULT_SETTINGS } from "../src/settings";
import { parseWorkflowDefinition } from "../src/workflowParser";
import type { TaskNotesWorkflowsSettings } from "../src/types";

class MemoryVault {
	readonly files = new Map<string, string>();
	readonly folders = new Set<string>();

	readonly adapter = {
		exists: async (path: string): Promise<boolean> => this.files.has(path) || this.folders.has(path),
	};

	async createFolder(path: string): Promise<void> {
		this.folders.add(path);
	}

	async create(path: string, content: string): Promise<void> {
		this.files.set(path, content);
	}
}

describe("default workflows service", () => {
	it("creates workflow notes and the default Base file without overwriting", async () => {
		const vault = new MemoryVault();
		const settings: TaskNotesWorkflowsSettings = { ...DEFAULT_SETTINGS };
		const service = new DefaultWorkflowsService({ vault } as never, () => settings);

		const first = await service.ensureDefaultFiles();
		const second = await service.ensureDefaultFiles();

		expect(first.workflows).toHaveLength(19);
		expect(first.view).toBe("TaskNotes/Views/workflows.base");
		expect(second.workflows).toHaveLength(0);
		expect(second.view).toBeNull();
		expect(vault.files.get("TaskNotes/Workflows/clear-scheduled-when-started.md")).toContain("action: task.clearScheduled");
		expect(vault.files.get("TaskNotes/Workflows/stamp-started-at.md")).toContain("startedAt");
		expect(vault.files.get("TaskNotes/Workflows/rollover-overdue-scheduled-tasks.md")).toContain("action: task.reschedule");
		expect(vault.files.get("TaskNotes/Workflows/escalate-upcoming-due-tasks.md")).toContain('today() + duration("3d")');
		expect(vault.files.get("TaskNotes/Workflows/blocked-task-review.md")).toContain("task.isBlocked");
		expect(vault.files.get("TaskNotes/Workflows/inherit-subtask-dependencies.md")).toContain("action: task.dependencies");
		expect(vault.files.get("TaskNotes/Workflows/mirror-parent-dependencies-to-subtasks.md")).toContain("blockedBy");
		expect(vault.files.get("TaskNotes/Workflows/schedule-subtasks-before-parent-due.md")).toContain(
			'date(event.after.due) - duration("1w")'
		);
		expect(vault.files.get("TaskNotes/Views/workflows.base")).toContain("type: tasknotesWorkflows");
		expect(vault.files.get("TaskNotes/Views/workflows.base")).toContain('note["type"] == "workflow"');
		expect(vault.files.get("TaskNotes/Views/workflows.base")).toContain('file.inFolder("TaskNotes/Workflows")');

		for (const path of first.workflows) {
			const markdown = vault.files.get(path);
			expect(markdown, path).toBeDefined();
			const parsed = parseMarkdownFrontmatter(markdown ?? "");
			const result = parseWorkflowDefinition(parsed.data, markdown ?? "");
			expect(result.diagnostics, path).toEqual([]);
			expect(result.sourceFormat, path).toBe("runtime-v0.1");
			expect(validateCanonicalSchema("workflow", parsed.data).valid, path).toBe(true);
			expect(result.workflow?.enabled, path).toBe(false);
		}
	});
});
