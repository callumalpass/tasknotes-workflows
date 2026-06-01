import { normalizePath, Notice, TFile } from "obsidian";
import { conditionMatches, conditionsMatch } from "./conditions";
import { DEFAULT_SOURCE } from "./constants";
import { defaultRuntimeTaskQuery } from "./taskQuery";
import { resolveTemplateValue } from "./template";
import type { App, PaneType } from "obsidian";
import type {
	StepDefinition,
	StepExecutionContext,
	TaskNotesMutationContext,
	TaskNotesRuntimeApi,
	TaskNotesRuntimeTaskQuery,
	TaskNotesRuntimeTaskQueryResult,
	TaskNotesRuntimeQueryGroup,
	WorkflowInputField,
	WorkflowOutputField,
	WorkflowObsidianContext,
	WorkflowRunContext,
	WorkflowStep,
	WorkflowStepExample,
} from "./types";
import type { InterpolationValues, TranslateFn } from "./i18n";

export class StepRegistry {
	private readonly steps = new Map<string, StepDefinition>();
	private translate: TranslateFn;

	constructor(translate: TranslateFn = fallbackTranslate) {
		this.translate = translate;
		this.refresh();
	}

	updateTranslator(translate: TranslateFn): void {
		this.translate = translate;
		this.refresh();
	}

	private refresh(): void {
		this.steps.clear();
		for (const step of localizeStepDefinitions(createDefaultSteps(), this.translate)) {
			this.register(step);
		}
	}

	register(step: StepDefinition): void {
		this.steps.set(step.type, step);
	}

	get(type: string): StepDefinition | undefined {
		return this.steps.get(type);
	}

	list(): StepDefinition[] {
		return Array.from(this.steps.values()).sort((left, right) => left.type.localeCompare(right.type));
	}
}

type StepMetadata = {
	category?: string;
	inputFields?: WorkflowInputField[];
	outputFields?: WorkflowOutputField[];
	examples?: WorkflowStepExample[];
	writes?: boolean;
};

const CATEGORY_KEYS: Record<string, string> = {
	TaskNotes: "tasknotes",
	"Task relationships": "taskRelationships",
	"Time tracking": "timeTracking",
	Obsidian: "obsidian",
	"Control flow": "controlFlow",
};

function fallbackTranslate(key: string): string {
	return key;
}

function translateWithFallback(
	translate: TranslateFn,
	key: string,
	fallback: string,
	params?: InterpolationValues
): string {
	const translated = translate(key, params);
	return translated === key ? fallback : translated;
}

function translateFirstWithFallback(
	translate: TranslateFn,
	keys: string[],
	fallback: string,
	params?: InterpolationValues
): string {
	for (const key of keys) {
		const translated = translate(key, params);
		if (translated !== key) return translated;
	}
	return fallback;
}

function localizeStepDefinitions(steps: StepDefinition[], translate: TranslateFn): StepDefinition[] {
	return steps.map((step) => localizeStepDefinition(step, translate));
}

function localizeStepDefinition(step: StepDefinition, translate: TranslateFn): StepDefinition {
	const baseKey = `steps.definitions.${step.type}`;
	return {
		...step,
		label: translateWithFallback(translate, `${baseKey}.label`, step.label),
		description: translateWithFallback(translate, `${baseKey}.description`, step.description),
		category: translateWithFallback(
			translate,
			`steps.categories.${CATEGORY_KEYS[step.category] ?? "tasknotes"}`,
			step.category
		),
		inputFields: step.inputFields.map((field) => localizeInputField(field, translate, baseKey)),
		outputFields: step.outputFields.map((field) => localizeOutputField(field, translate, baseKey)),
		examples: step.examples.map((example, index) => ({
			...example,
			label: translateWithFallback(translate, `${baseKey}.examples.${index}.label`, example.label),
		})),
	};
}

function localizeInputField(
	field: WorkflowInputField,
	translate: TranslateFn,
	baseKey: string
): WorkflowInputField {
	const fieldKey = `${baseKey}.input.${field.key}`;
	const commonKey = commonInputTranslationKey(field.key);
	return {
		...field,
		label: translateFirstWithFallback(
			translate,
			[`${fieldKey}.label`, ...(commonKey ? [`${commonKey}.label`] : [])],
			field.label
		),
		description: field.description
			? translateFirstWithFallback(
					translate,
					[`${fieldKey}.description`, ...(commonKey ? [`${commonKey}.description`] : [])],
					field.description
				)
			: undefined,
		placeholder: field.placeholder
			? translateWithFallback(translate, `${fieldKey}.placeholder`, field.placeholder)
			: undefined,
		options: field.options?.map((option) => ({
			...option,
			label: translateWithFallback(translate, `${fieldKey}.options.${option.value}`, option.label),
		})),
	};
}

function localizeOutputField(
	field: WorkflowOutputField,
	translate: TranslateFn,
	baseKey: string
): WorkflowOutputField {
	const fieldKey = `${baseKey}.output.${field.key}`;
	const commonKey = commonOutputTranslationKey(field.key);
	return {
		...field,
		label: translateFirstWithFallback(
			translate,
			[`${fieldKey}.label`, ...(commonKey ? [`${commonKey}.label`] : [])],
			field.label
		),
		description: field.description
			? translateFirstWithFallback(
					translate,
					[`${fieldKey}.description`, ...(commonKey ? [`${commonKey}.description`] : [])],
					field.description
				)
			: undefined,
	};
}

function commonInputTranslationKey(key: string): string | null {
	if (key === "task") return "steps.common.task";
	if (key === "path") return "steps.common.path";
	return null;
}

function commonOutputTranslationKey(key: string): string | null {
	if (key === "task") return "steps.common.outputTask";
	if (key === "path") return "steps.common.outputPath";
	return null;
}

export function shouldRunStep(step: WorkflowStep, context: WorkflowRunContext): boolean {
	if (!step.if) return true;
	if (Array.isArray(step.if)) return conditionsMatch(step.if, context);
	return conditionMatches(step.if, context);
}

function createDefaultSteps(): StepDefinition[] {
	return [
		taskReadStep("task.get", "Get task", "Reads one task by path.", async (api, input) => ({
			task: await api.tasks.get(requiredString(input, "task")),
		}), {
			inputFields: [taskPathField()],
			examples: [{ label: "Read the triggering task", input: { task: "{{trigger.after.path}}" } }],
		}),
		{
			type: "task.query",
			label: "Query tasks",
			description: "Selects tasks with the TaskNotes runtime query API.",
			category: "TaskNotes",
			inputFields: [
				{
					key: "query",
					label: "Query",
					type: "taskQuery",
					required: true,
					wide: true,
					description: "Runtime task query using TaskNotes fields, operators, sort, grouping, and limit.",
					defaultValue: defaultRuntimeTaskQuery(),
				},
			],
			outputFields: [
				{ key: "tasks", label: "Tasks", type: "TaskInfo[]", description: "The matching TaskNotes tasks." },
				{ key: "count", label: "Count", type: "number", description: "Number of returned tasks." },
				{ key: "total", label: "Total", type: "number", description: "Total tasks before filtering." },
				{ key: "matched", label: "Matched", type: "number", description: "Tasks matching the query before offset and limit." },
				{ key: "returned", label: "Returned", type: "number", description: "Tasks returned after offset and limit." },
				{ key: "groups", label: "Groups", type: "TaskQueryGroup[]", description: "TaskNotes query group details." },
				{ key: "groupPaths", label: "Group paths", type: "object", description: "Task paths keyed by group key." },
				{ key: "query", label: "Query", type: "object", description: "The normalized TaskNotes runtime query." },
				{ key: "warnings", label: "Warnings", type: "object[]", description: "Non-fatal TaskNotes query warnings." },
			],
			examples: [
				{
					label: "Open tasks",
					input: { query: defaultRuntimeTaskQuery() },
				},
			],
			mutatesTasks: false,
			supportsDryRun: true,
			supportsForEach: false,
			run: async (input, context) => {
				const api = requireTaskNotes(context.tasknotes);
				if (!api.query?.tasks) {
					throw new Error("TaskNotes runtime query API is unavailable.");
				}
				const queryInput = asRecord(input);
				const query = queryInput.query;
				if (!isRuntimeTaskQuery(query)) throw new Error("task.query requires a TaskNotes runtime query object.");
				const result = await api.query.tasks(query);
				return taskQueryOutput(result);
			},
		},
		taskRelationshipListStep(
			"task.parents",
			"Get parent tasks",
			"Reads parent tasks linked from the task's projects.",
			async (api, task) => await api.relationships.parents(task)
		),
		taskRelationshipListStep(
			"task.subtasks",
			"Get subtasks",
			"Reads tasks that reference this task as a project.",
			async (api, task) => await api.relationships.subtasks(task)
		),
		taskRelationshipListStep(
			"task.blocking",
			"Get blocking tasks",
			"Reads tasks that are blocked by this task.",
			async (api, task) => await api.relationships.blocking(task)
		),
		{
			type: "task.dependencies",
			label: "Get dependencies",
			description: "Reads the tasks that block this task.",
			category: "Task relationships",
			inputFields: [taskPathField()],
			outputFields: [
				{
					key: "dependencies",
					label: "Dependencies",
					type: "ResolvedTaskDependency[]",
					description: "Dependency objects with resolved TaskNotes task data when available.",
				},
				{ key: "tasks", label: "Tasks", type: "TaskInfo[]", description: "Resolved dependency tasks." },
				{ key: "count", label: "Count", type: "number", description: "Number of dependencies." },
			],
			examples: [{ label: "Read triggering task dependencies", input: { task: "{{trigger.after.path}}" } }],
			mutatesTasks: false,
			supportsDryRun: true,
			supportsForEach: true,
			run: async (input, context) => {
				const api = requireTaskNotes(context.tasknotes);
				const dependencies = await api.relationships.dependencies(requiredString(input, "task"));
				const tasks = dependencies
					.map((dependency) => dependency.task)
					.filter((task): task is Record<string, unknown> => task !== null);
				return { dependencies, tasks, count: dependencies.length };
			},
		},
		{
			type: "task.relationships",
			label: "Get relationships",
			description: "Reads parents, subtasks, dependencies, and blocking tasks for one task.",
			category: "Task relationships",
			inputFields: [taskPathField()],
			outputFields: [
				{ key: "task", label: "Task", type: "TaskInfo", description: "The task." },
				{ key: "parents", label: "Parents", type: "TaskInfo[]", description: "Parent tasks." },
				{ key: "subtasks", label: "Subtasks", type: "TaskInfo[]", description: "Subtasks." },
				{
					key: "dependencies",
					label: "Dependencies",
					type: "ResolvedTaskDependency[]",
					description: "Tasks that block this task.",
				},
				{ key: "blocking", label: "Blocking", type: "TaskInfo[]", description: "Tasks blocked by this task." },
			],
			examples: [{ label: "Read all relationships", input: { task: "{{trigger.after.path}}" } }],
			mutatesTasks: false,
			supportsDryRun: true,
			supportsForEach: true,
			run: async (input, context) =>
				await requireTaskNotes(context.tasknotes).relationships.all(requiredString(input, "task")),
		},
		taskMutationStep("task.create", "Create task", "Creates a new TaskNotes task.", async (api, input, context) => {
			const task = await api.tasks.create(asRecord(input), context.mutationContext("task.create"));
			return { task, path: task.path };
		}, {
			inputFields: [
				{ key: "title", label: "Title", type: "text", required: true, defaultValue: "New task" },
				{ key: "status", label: "Status", type: "select", optionsFrom: "task-statuses" },
				{ key: "priority", label: "Priority", type: "select", optionsFrom: "task-priorities" },
				{ key: "due", label: "Due", type: "date" },
				{ key: "scheduled", label: "Scheduled", type: "date" },
				{ key: "details", label: "Details", type: "textarea", wide: true },
			],
			examples: [{ label: "Create an inbox task", input: { title: "Follow up", status: "open" } }],
		}),
		taskMutationStep("task.patch", "Patch task", "Updates task fields.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.patch(
				requiredString(record, "task"),
				asRecord(record.patch),
				context.mutationContext("task.patch")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{
					key: "patch",
					label: "Patch",
					type: "json",
					required: true,
					wide: true,
					description: "Task fields to update, such as status, priority, due, scheduled, tags, projects, or contexts.",
					defaultValue: { status: "active" },
				},
			],
			examples: [{ label: "Mark active", input: { task: "{{trigger.after.path}}", patch: { status: "active" } } }],
		}),
		taskMutationStep("task.set", "Set task fields", "Alias for task.patch.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.patch(
				requiredString(record, "task"),
				asRecord(record.patch),
				context.mutationContext("task.set")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{
					key: "patch",
					label: "Fields",
					type: "json",
					required: true,
					wide: true,
					description: "Task fields to set.",
					defaultValue: { status: "active" },
				},
			],
		}),
		taskMutationStep("task.move", "Move task", "Moves a task note.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.move(
				requiredString(record, "task"),
				requiredString(record, "targetFolder"),
				context.mutationContext("task.move")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{
					key: "targetFolder",
					label: "Target folder",
					type: "folder",
					required: true,
					defaultValue: "TaskNotes/Review",
				},
			],
			examples: [{ label: "Move triggering task", input: { task: "{{trigger.after.path}}", targetFolder: "TaskNotes/Review" } }],
		}),
		taskMutationStep("task.archive", "Archive task", "Archives a task.", async (api, input, context) => {
			const task = await api.tasks.archive(
				requiredString(input, "task"),
				true,
				context.mutationContext("task.archive")
			);
			return { task, path: task.path };
		}, { inputFields: [taskPathField()] }),
		taskMutationStep("task.unarchive", "Unarchive task", "Unarchives a task.", async (api, input, context) => {
			const task = await api.tasks.archive(
				requiredString(input, "task"),
				false,
				context.mutationContext("task.unarchive")
			);
			return { task, path: task.path };
		}, { inputFields: [taskPathField()] }),
		taskMutationStep("task.complete", "Complete task", "Marks a task complete.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.complete(
				requiredString(record, "task"),
				asRecord(record.options),
				context.mutationContext("task.complete")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{ key: "options.status", label: "Completed status", type: "select", optionsFrom: "task-statuses" },
			],
		}),
		taskMutationStep("task.uncomplete", "Uncomplete task", "Reopens a completed task.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.uncomplete(
				requiredString(record, "task"),
				asRecord(record.options),
				context.mutationContext("task.uncomplete")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{ key: "options.status", label: "Reopened status", type: "select", optionsFrom: "task-statuses" },
			],
		}),
		taskMutationStep("task.reschedule", "Reschedule task", "Sets or clears scheduled date.", async (api, input, context) => {
			const record = asRecord(input);
			const date = record.date === null ? null : requiredString(record, "date");
			const task = await api.tasks.reschedule(
				requiredString(record, "task"),
				date,
				context.mutationContext("task.reschedule")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{ key: "date", label: "Scheduled date", type: "date", required: true, defaultValue: "{{today}}" },
			],
		}),
		taskPropertyStep("task.setDue", "Set due date", "due", false),
		taskPropertyStep("task.clearDue", "Clear due date", "due", true),
		taskPropertyStep("task.setScheduled", "Set scheduled date", "scheduled", false),
		taskPropertyStep("task.clearScheduled", "Clear scheduled date", "scheduled", true),
		taskStringListStep("task.addTag", "Add tag", "tag", "addTag"),
		taskStringListStep("task.removeTag", "Remove tag", "tag", "removeTag"),
		taskStringListStep("task.addProject", "Add project", "project", "addProject"),
		taskStringListStep("task.removeProject", "Remove project", "project", "removeProject"),
		taskStringListStep("task.addContext", "Add context", "context", "addContext"),
		taskStringListStep("task.removeContext", "Remove context", "context", "removeContext"),
		taskMutationStep("task.addDependency", "Add dependency", "Adds a blocking dependency.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.addDependency(
				requiredString(record, "task"),
				asRecord(record.dependency),
				context.mutationContext("task.addDependency")
			);
			return { task, path: task.path };
		}, {
			inputFields: [
				taskPathField(),
				{
					key: "dependency",
					label: "Dependency",
					type: "json",
					required: true,
					wide: true,
					defaultValue: { path: "Tasks/example.md" },
				},
			],
		}),
		taskMutationStep("task.removeDependency", "Remove dependency", "Removes a dependency.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.tasks.removeDependency(
				requiredString(record, "task"),
				requiredString(record, "uid"),
				context.mutationContext("task.removeDependency")
			);
			return { task, path: task.path };
		}, {
			inputFields: [taskPathField(), { key: "uid", label: "Dependency ID", type: "text", required: true }],
		}),
		taskMutationStep("time.start", "Start timer", "Starts time tracking.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.time.start(
				requiredString(record, "task"),
				asRecord(record.options),
				context.mutationContext("time.start")
			);
			return { task, path: task.path, startedAt: new Date().toISOString() };
		}, {
			category: "Time tracking",
			inputFields: [
				taskPathField(),
				{ key: "options.description", label: "Description", type: "text", defaultValue: "Started by {{workflow.name}}" },
			],
			outputFields: [
				...taskOutputFields(),
				{ key: "startedAt", label: "Started at", type: "string", description: "ISO timestamp recorded by the workflow run." },
			],
		}),
		taskMutationStep("time.stop", "Stop timer", "Stops time tracking.", async (api, input, context) => {
			const task = await api.time.stop(requiredString(input, "task"), context.mutationContext("time.stop"));
			return { task, path: task.path, stoppedAt: new Date().toISOString() };
		}, {
			category: "Time tracking",
			inputFields: [taskPathField()],
			outputFields: [
				...taskOutputFields(),
				{ key: "stoppedAt", label: "Stopped at", type: "string", description: "ISO timestamp recorded by the workflow run." },
			],
		}),
		taskMutationStep("time.appendEntry", "Append time entry", "Adds a time entry.", async (api, input, context) => {
			const record = asRecord(input);
			const task = await api.time.append(
				requiredString(record, "task"),
				asRecord(record.entry),
				context.mutationContext("time.appendEntry")
			);
			return { task, path: task.path };
		}, {
			category: "Time tracking",
			inputFields: [
				taskPathField(),
				{
					key: "entry",
					label: "Entry",
					type: "json",
					required: true,
					wide: true,
					defaultValue: { minutes: 25, date: "{{today}}" },
				},
			],
		}),
		{
			type: "notice.show",
			label: "Show notice",
			description: "Shows an Obsidian notice.",
			category: "Obsidian",
			inputFields: [
				{
					key: "message",
					label: "Message",
					type: "textarea",
					required: true,
					wide: true,
					defaultValue: "Workflow ran.",
				},
			],
			outputFields: [{ key: "message", label: "Message", type: "string" }],
			examples: [{ label: "Show task title", input: { message: "Updated {{trigger.after.title}}" } }],
			mutatesTasks: false,
			supportsDryRun: true,
			supportsForEach: true,
			run: async (input, context) => {
				const message = requiredString(input, "message");
				if (!context.dryRun) context.notice(message);
				return { message };
			},
		},
		obsidianStep("obsidian.openFile", "Open file", "Opens a vault file in the workspace.", async (app, input) => {
			const record = asRecord(input);
			const file = requireVaultFile(app, requiredString(record, "path"));
			const newLeaf = paneType(record.newLeaf);
			const leaf = app.workspace.getLeaf(newLeaf);
			await leaf.openFile(file);
			return { opened: true, path: file.path, newLeaf: record.newLeaf ?? "current" };
		}, {
			inputFields: [
				filePathField(),
				{
					key: "newLeaf",
					label: "Open in",
					type: "select",
					defaultValue: "current",
					options: [
						{ value: "current", label: "Current leaf" },
						{ value: "tab", label: "New tab" },
						{ value: "split", label: "Split" },
						{ value: "window", label: "Popout window" },
					],
				},
			],
			outputFields: [
				{ key: "opened", label: "Opened", type: "boolean" },
				{ key: "path", label: "Path", type: "string" },
				{ key: "newLeaf", label: "Open target", type: "string" },
			],
			examples: [{ label: "Open triggering file", input: { path: "{{trigger.path}}", newLeaf: "tab" } }],
		}),
		obsidianStep("obsidian.createNote", "Create note", "Creates a Markdown note in the vault.", async (app, input) => {
			const record = asRecord(input);
			const path = normalizePath(requiredString(record, "path"));
			await ensureParentFolder(app, path);
			const file = await app.vault.create(path, optionalText(record, "content") ?? "");
			return { created: true, path: file.path };
		}, {
			writes: true,
			inputFields: [
				filePathField("path", "Path", "Notes/new-note.md"),
				{ key: "content", label: "Content", type: "textarea", wide: true, defaultValue: "" },
			],
			outputFields: [
				{ key: "created", label: "Created", type: "boolean" },
				{ key: "path", label: "Path", type: "string" },
			],
			examples: [{ label: "Create a dated note", input: { path: "Journal/{{today}}.md", content: "# {{today}}\n" } }],
		}),
		obsidianStep("obsidian.appendNote", "Append to note", "Appends text to an existing Markdown note.", async (app, input) => {
			const record = asRecord(input);
			const file = requireVaultFile(app, requiredString(record, "path"));
			const text = requiredText(record, "text");
			await app.vault.append(file, text);
			return { appended: true, path: file.path, length: text.length };
		}, {
			writes: true,
			inputFields: [
				filePathField(),
				{
					key: "text",
					label: "Text",
					type: "textarea",
					required: true,
					wide: true,
					defaultValue: "\n- Workflow ran at {{now}}\n",
				},
			],
			outputFields: [
				{ key: "appended", label: "Appended", type: "boolean" },
				{ key: "path", label: "Path", type: "string" },
				{ key: "length", label: "Length", type: "number" },
			],
			examples: [{ label: "Append to triggering file", input: { path: "{{trigger.path}}", text: "\nUpdated at {{now}}\n" } }],
		}),
		obsidianStep(
			"obsidian.updateFrontmatter",
			"Update frontmatter",
			"Applies a top-level frontmatter patch to a Markdown note.",
			async (app, input) => {
				const record = asRecord(input);
				const file = requireVaultFile(app, requiredString(record, "path"));
				const patch = asRecord(record.frontmatter);
				await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
					applyFrontmatterPatch(frontmatter, patch);
				});
				return { updated: true, path: file.path, keys: Object.keys(patch) };
			},
			{
				writes: true,
				inputFields: [
					filePathField(),
					{
						key: "frontmatter",
						label: "Frontmatter",
						type: "json",
						required: true,
						wide: true,
						description: "Top-level keys to set. Use null to delete a key.",
						defaultValue: { reviewed: true },
					},
				],
				outputFields: [
					{ key: "updated", label: "Updated", type: "boolean" },
					{ key: "path", label: "Path", type: "string" },
					{ key: "keys", label: "Keys", type: "string[]" },
				],
				examples: [{ label: "Mark triggering file reviewed", input: { path: "{{trigger.path}}", frontmatter: { reviewed: true } } }],
			}
		),
		obsidianStep("obsidian.moveFile", "Move file", "Moves or renames a vault file.", async (app, input) => {
			const record = asRecord(input);
			const file = requireVaultFile(app, requiredString(record, "path"));
			const oldPath = file.path;
			const targetPath = normalizePath(requiredString(record, "targetPath"));
			await ensureParentFolder(app, targetPath);
			if (record.updateLinks === false) {
				await app.vault.rename(file, targetPath);
			} else {
				await app.fileManager.renameFile(file, targetPath);
			}
			return { moved: true, oldPath, path: targetPath };
		}, {
			writes: true,
			inputFields: [
				filePathField(),
				filePathField("targetPath", "Target path", "Archive/example.md"),
				{
					key: "updateLinks",
					label: "Update links",
					type: "boolean",
					defaultValue: true,
					description: "Use Obsidian's file manager so links are updated according to vault settings.",
				},
			],
			outputFields: [
				{ key: "moved", label: "Moved", type: "boolean" },
				{ key: "oldPath", label: "Old path", type: "string" },
				{ key: "path", label: "New path", type: "string" },
			],
			examples: [{ label: "Archive triggering file", input: { path: "{{trigger.path}}", targetPath: "Archive/{{trigger.file.name}}" } }],
		}),
		{
			type: "workflow.stop",
			label: "Stop workflow",
			description: "Stops the current workflow run.",
			category: "Control flow",
			inputFields: [{ key: "reason", label: "Reason", type: "text", defaultValue: "Stopped by workflow." }],
			outputFields: [
				{ key: "stopped", label: "Stopped", type: "boolean" },
				{ key: "reason", label: "Reason", type: "string" },
			],
			examples: [{ label: "Stop with reason", input: { reason: "Condition matched." } }],
			mutatesTasks: false,
			supportsDryRun: true,
			supportsForEach: true,
			run: async (input) => ({ stopped: true, reason: optionalString(input, "reason") }),
		},
	];
}

function obsidianStep(
	type: string,
	label: string,
	description: string,
	run: (app: App, input: unknown, context: StepExecutionContext) => Promise<unknown>,
	metadata: StepMetadata = {}
): StepDefinition {
	return {
		type,
		label,
		description,
		category: metadata.category ?? "Obsidian",
		inputFields: metadata.inputFields ?? [],
		outputFields: metadata.outputFields ?? [],
		examples: metadata.examples ?? [],
		mutatesTasks: false,
		writesVault: metadata.writes === true,
		supportsDryRun: true,
		supportsForEach: true,
		run: async (input, context) => {
			if (context.dryRun) {
				return { dryRun: true, wouldRun: type, input };
			}
			return run(requireObsidian(context.obsidian), input, context);
		},
	};
}

function taskRelationshipListStep(
	type: string,
	label: string,
	description: string,
	run: (api: TaskNotesRuntimeApi, taskPath: string) => Promise<Record<string, unknown>[]>
): StepDefinition {
	return {
		type,
		label,
		description,
		category: "Task relationships",
		inputFields: [taskPathField()],
		outputFields: [
			{ key: "tasks", label: "Tasks", type: "TaskInfo[]", description: "Related TaskNotes tasks." },
			{ key: "count", label: "Count", type: "number", description: "Number of related tasks." },
		],
		examples: [{ label: "Read relationships for the triggering task", input: { task: "{{trigger.after.path}}" } }],
		mutatesTasks: false,
		supportsDryRun: true,
		supportsForEach: true,
		run: async (input, context) => {
			const tasks = await run(requireTaskNotes(context.tasknotes), requiredString(input, "task"));
			return { tasks, count: tasks.length };
		},
	};
}

function taskReadStep(
	type: string,
	label: string,
	description: string,
	run: (api: TaskNotesRuntimeApi, input: unknown) => Promise<unknown>,
	metadata: StepMetadata = {}
): StepDefinition {
	return {
		type,
		label,
		description,
		category: metadata.category ?? "TaskNotes",
		inputFields: metadata.inputFields ?? [taskPathField()],
		outputFields: metadata.outputFields ?? taskOutputFields(),
		examples: metadata.examples ?? [],
		mutatesTasks: false,
		supportsDryRun: true,
		supportsForEach: true,
		run: async (input, context) => run(requireTaskNotes(context.tasknotes), input),
	};
}

function taskMutationStep(
	type: string,
	label: string,
	description: string,
	run: (api: TaskNotesRuntimeApi, input: unknown, context: StepExecutionContext) => Promise<unknown>,
	metadata: StepMetadata = {}
): StepDefinition {
	return {
		type,
		label,
		description,
		category: metadata.category ?? "TaskNotes",
		inputFields: metadata.inputFields ?? [taskPathField()],
		outputFields: metadata.outputFields ?? taskOutputFields(),
		examples: metadata.examples ?? [],
		mutatesTasks: true,
		supportsDryRun: true,
		supportsForEach: true,
		run: async (input, context) => {
			if (context.dryRun) {
				return { dryRun: true, wouldRun: type, input };
			}
			return run(requireTaskNotes(context.tasknotes), input, context);
		},
	};
}

function taskPropertyStep(
	type: string,
	label: string,
	property: "due" | "scheduled",
	clear: boolean
): StepDefinition {
	return taskMutationStep(type, label, label, async (api, input, context) => {
		const record = asRecord(input);
		const path = requiredString(record, "task");
		const mutationContext = context.mutationContext(type);
		const task =
			property === "due"
				? clear
					? await api.tasks.clearDue(path, mutationContext)
					: await api.tasks.setDue(path, requiredString(record, "date"), mutationContext)
				: clear
					? await api.tasks.clearScheduled(path, mutationContext)
					: await api.tasks.setScheduled(path, requiredString(record, "date"), mutationContext);
		return { task, path: task.path };
	}, {
		inputFields: clear
			? [taskPathField()]
			: [
					taskPathField(),
					{ key: "date", label: `${label.replace(/^Set /u, "")}`, type: "date", required: true, defaultValue: "{{today}}" },
				],
	});
}

function taskStringListStep(
	type: string,
	label: string,
	valueField: "tag" | "project" | "context",
	method: "addTag" | "removeTag" | "addProject" | "removeProject" | "addContext" | "removeContext"
): StepDefinition {
	return taskMutationStep(type, label, label, async (api, input, context) => {
		const record = asRecord(input);
		const task = await api.tasks[method](
			requiredString(record, "task"),
			requiredString(record, valueField),
			context.mutationContext(type)
		);
		return { task, path: task.path };
	}, {
		inputFields: [
			taskPathField(),
			{
				key: valueField,
				label: valueField[0].toUpperCase() + valueField.slice(1),
				type: "text",
				required: true,
				defaultValue: valueField === "tag" ? "#review" : valueField === "project" ? "Project" : "Context",
			},
		],
	});
}

function taskPathField(): WorkflowInputField {
	return {
		key: "task",
		label: "Task",
		type: "taskPath",
		required: true,
		description: "Vault path to a TaskNotes task. Triggered task workflows usually use {{trigger.after.path}}.",
		defaultValue: "{{trigger.after.path}}",
	};
}

function filePathField(key = "path", label = "Path", defaultValue = "{{trigger.path}}"): WorkflowInputField {
	return {
		key,
		label,
		type: "text",
		required: true,
		description: "Vault path to a Markdown file.",
		defaultValue,
	};
}

function taskOutputFields(): WorkflowOutputField[] {
	return [
		{ key: "task", label: "Task", type: "TaskInfo", description: "Updated TaskNotes task data." },
		{ key: "path", label: "Path", type: "string", description: "Vault path of the task after the step completes." },
	];
}

function requireTaskNotes(api: TaskNotesRuntimeApi | null): TaskNotesRuntimeApi {
	if (!api) throw new Error("TaskNotes runtime API is unavailable.");
	return api;
}

function requireObsidian(obsidian: WorkflowObsidianContext | null): App {
	if (!obsidian) throw new Error("Obsidian app context is unavailable.");
	return obsidian.app;
}

function requireVaultFile(app: App, path: string): TFile {
	const normalizedPath = normalizePath(path);
	const file = app.vault.getAbstractFileByPath(normalizedPath);
	if (!(file instanceof TFile)) throw new Error(`Vault file not found: ${normalizedPath}`);
	return file;
}

async function ensureParentFolder(app: App, path: string): Promise<void> {
	const folder = normalizePath(path).split("/").slice(0, -1).join("/");
	if (!folder) return;
	let current = "";
	for (const segment of folder.split("/")) {
		current = current ? `${current}/${segment}` : segment;
		if (!app.vault.getFolderByPath(current)) {
			await app.vault.createFolder(current);
		}
	}
}

function paneType(value: unknown): PaneType | false {
	if (value === "tab" || value === "split" || value === "window") return value;
	return false;
}

function applyFrontmatterPatch(frontmatter: Record<string, unknown>, patch: Record<string, unknown>): void {
	for (const [key, value] of Object.entries(patch)) {
		if (value === null) {
			delete frontmatter[key];
			continue;
		}
		frontmatter[key] = value;
	}
}

export function createStepExecutionContext(
	runId: string,
	dryRun: boolean,
	tasknotes: TaskNotesRuntimeApi | null,
	obsidian: App | null,
	source: string
): StepExecutionContext {
	return {
		runId,
		dryRun,
		tasknotes,
		obsidian: obsidian ? { app: obsidian } : null,
		notice: (message) => new Notice(message),
		resolve: resolveTemplateValue,
		mutationContext: (reason): TaskNotesMutationContext => ({
			source: source || DEFAULT_SOURCE,
			correlationId: runId,
			reason,
		}),
	};
}

function taskQueryOutput(result: TaskNotesRuntimeTaskQueryResult): Record<string, unknown> {
	return {
		tasks: result.tasks,
		count: result.returned,
		total: result.total,
		matched: result.matched,
		returned: result.returned,
		groups: result.groups ?? [],
		groupPaths: groupPathsByKey(result.groups ?? []),
		query: result.query,
		warnings: result.warnings ?? [],
	};
}

function groupPathsByKey(groups: readonly TaskNotesRuntimeQueryGroup[]): Record<string, string[]> {
	return Object.fromEntries(groups.map((group) => [group.key, [...group.taskPaths]]));
}

function isRuntimeTaskQuery(value: unknown): value is TaskNotesRuntimeTaskQuery {
	if (!isRecord(value)) return false;
	return Object.keys(value).every((key) =>
		key === "where" ||
		key === "sort" ||
		key === "limit" ||
		key === "offset" ||
		key === "group" ||
		key === "scope"
	);
}

function requiredString(input: unknown, field: string): string {
	const value = asRecord(input)[field];
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`Step input requires non-empty string: ${field}`);
	}
	return value.trim();
}

function requiredText(input: unknown, field: string): string {
	const value = asRecord(input)[field];
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`Step input requires non-empty text: ${field}`);
	}
	return value;
}

function optionalString(input: unknown, field: string): string | undefined {
	const value = asRecord(input)[field];
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalText(input: unknown, field: string): string | undefined {
	const value = asRecord(input)[field];
	return typeof value === "string" ? value : undefined;
}

function asRecord(input: unknown): Record<string, unknown> {
	return isRecord(input) ? input : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
