import { DEFAULT_SOURCE } from "./constants";
import type {
	LoadedWorkflow,
	WorkflowDefinition,
	WorkflowStep,
	WorkflowTrigger,
} from "./types";

export const TRIGGER_TYPES: Array<WorkflowTrigger["type"]> = [
	"manual",
	"tasknotes.event",
	"cron",
	"interval",
	"obsidian.vault",
	"obsidian.metadata",
	"obsidian.workspace",
];

export function createWorkflowDefinition(input: {
	id: string;
	name: string;
	description?: string;
	triggerType?: WorkflowTrigger["type"];
	stepType?: string;
}): WorkflowDefinition {
	return {
		type: "tasknotes-workflow",
		schemaVersion: 1,
		id: input.id,
		name: input.name,
		description: input.description,
		enabled: false,
		triggers: [createDefaultTrigger(input.triggerType ?? "manual", [])],
		vars: {},
		conditions: [],
		steps: [createDefaultStep(input.stepType ?? "notice.show", new Set())],
		run: {
			mode: "sequential",
			noOverlap: true,
			source: DEFAULT_SOURCE,
			maxTasks: 25,
			onError: "stop",
		},
	};
}

export function createDefaultTrigger(
	type: WorkflowTrigger["type"],
	existing: WorkflowTrigger[]
): WorkflowTrigger {
	const ids = new Set(existing.map((trigger) => trigger.id));
	if (type === "tasknotes.event") {
		return { id: uniqueId("status-active", ids), type, event: "task.status.changed", to: "active" };
	}
	if (type === "cron") {
		return { id: uniqueId("daily", ids), type, schedule: "0 9 * * *", timezone: "local" };
	}
	if (type === "interval") {
		return { id: uniqueId("interval", ids), type, every: "30m" };
	}
	if (type === "obsidian.vault") {
		return { id: uniqueId("vault-modify", ids), type, event: "modify", path: { glob: "**/*.md" } };
	}
	if (type === "obsidian.metadata") {
		return { id: uniqueId("metadata-changed", ids), type, event: "changed", path: { glob: "**/*.md" } };
	}
	if (type === "obsidian.workspace") {
		return { id: uniqueId("file-open", ids), type, event: "file-open", path: { glob: "**/*.md" } };
	}
	return { id: uniqueId("manual", ids), type: "manual" };
}

export function createDefaultStep(type: string, ids: Set<string>): WorkflowStep {
	return {
		id: uniqueId(type.replace(/^.*\./u, ""), ids),
		type,
		input: defaultInputForStep(type),
	};
}

export function defaultInputForStep(type: string): Record<string, unknown> {
	if (type === "task.query") {
		return {
			query: {
				status: { operator: "isNot", value: "done" },
			},
		};
	}
	if (type === "task.create") return { title: "New task", status: "open" };
	if (
		type === "task.parents" ||
		type === "task.subtasks" ||
		type === "task.dependencies" ||
		type === "task.blocking" ||
		type === "task.relationships"
	) {
		return { task: "{{trigger.after.path}}" };
	}
	if (type === "task.patch" || type === "task.set") {
		return { task: "{{trigger.after.path}}", patch: { status: "active" } };
	}
	if (type === "task.move") return { task: "{{trigger.after.path}}", targetFolder: "TaskNotes/Review" };
	if (type === "task.complete" || type === "task.uncomplete" || type === "task.archive" || type === "task.unarchive") {
		return { task: "{{trigger.after.path}}" };
	}
	if (type === "task.reschedule") return { task: "{{trigger.after.path}}", date: "{{today}}" };
	if (type === "task.setDue" || type === "task.setScheduled") return { task: "{{trigger.after.path}}", date: "{{today}}" };
	if (type === "task.clearDue" || type === "task.clearScheduled") return { task: "{{trigger.after.path}}" };
	if (type === "task.addTag" || type === "task.removeTag") return { task: "{{trigger.after.path}}", tag: "#review" };
	if (type === "task.addProject" || type === "task.removeProject") return { task: "{{trigger.after.path}}", project: "Project" };
	if (type === "task.addContext" || type === "task.removeContext") return { task: "{{trigger.after.path}}", context: "Context" };
	if (type === "task.addDependency") return { task: "{{trigger.after.path}}", dependency: { path: "Tasks/example.md" } };
	if (type === "task.removeDependency") return { task: "{{trigger.after.path}}", uid: "dependency-id" };
	if (type === "time.start") return { task: "{{trigger.after.path}}", options: { description: "Started by {{workflow.name}}" } };
	if (type === "time.stop") return { task: "{{trigger.after.path}}" };
	if (type === "time.appendEntry") return { task: "{{trigger.after.path}}", entry: { minutes: 25, date: "{{today}}" } };
	if (type === "obsidian.openFile") return { path: "{{trigger.path}}", newLeaf: "tab" };
	if (type === "obsidian.createNote") return { path: "Notes/new-note.md", content: "" };
	if (type === "obsidian.appendNote") return { path: "{{trigger.path}}", text: "\n- Workflow ran at {{now}}\n" };
	if (type === "obsidian.updateFrontmatter") return { path: "{{trigger.path}}", frontmatter: { reviewed: true } };
	if (type === "obsidian.moveFile") return { path: "{{trigger.path}}", targetPath: "Archive/example.md", updateLinks: true };
	if (type === "workflow.stop") return { reason: "Stopped by workflow." };
	return { message: "Workflow ran." };
}

export function cloneWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
	return JSON.parse(JSON.stringify(workflow)) as WorkflowDefinition;
}

export function uniqueWorkflowId(base: string, workflows: LoadedWorkflow[]): string {
	return uniqueId(base, new Set(workflows.map((workflow) => workflow.workflow?.id).filter(isString)));
}

export function uniqueId(base: string, existing: Set<string>): string {
	const safeBase = slugifyWorkflowId(base) || "item";
	let candidate = safeBase;
	let index = 2;
	while (existing.has(candidate)) {
		candidate = `${safeBase}-${index}`;
		index += 1;
	}
	return candidate;
}

export function slugifyWorkflowId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/gu, "-")
		.replace(/^-+|-+$/gu, "")
		.slice(0, 80);
}

function isString(value: unknown): value is string {
	return typeof value === "string";
}
