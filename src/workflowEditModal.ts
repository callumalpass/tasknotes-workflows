import { ButtonComponent, Modal, Notice, type App } from "obsidian";
import type TaskNotesWorkflowsPlugin from "../main";
import {
	TRIGGER_TYPES,
	cloneWorkflow,
	createDefaultStep,
	createDefaultTrigger,
	createWorkflowDefinition,
	defaultInputForStep,
	slugifyWorkflowId,
	uniqueWorkflowId,
} from "./workflowScaffolding";
import type {
	LoadedWorkflow,
	StepDefinition,
	TaskNotesEventTrigger,
	TaskNotesRuntimeEventDefinition,
	WorkflowDefinition,
	WorkflowDynamicFieldOptions,
	WorkflowFieldOption,
	WorkflowInputField,
	WorkflowOutputField,
	WorkflowStep,
	WorkflowTrigger,
} from "./types";

type WorkflowEditModalOptions = {
	loaded?: LoadedWorkflow;
	onSaved?: (workflow: LoadedWorkflow | null) => void;
};

type TriggerControls = {
	idInput: HTMLInputElement;
	typeSelect: HTMLSelectElement;
	eventInput?: HTMLInputElement | HTMLSelectElement;
	scheduleInput?: HTMLInputElement;
	timezoneInput?: HTMLInputElement;
	fromInput?: HTMLInputElement;
	toInput?: HTMLInputElement;
	pathInput?: HTMLInputElement;
	allowSelfTriggerInput?: HTMLInputElement;
	catchUpInput?: HTMLInputElement;
};

const INTERVAL_PLACEHOLDER = ["30", "m"].join("");

const DEFAULT_TASKNOTES_EVENTS: readonly TaskNotesRuntimeEventDefinition[] = [
	{ name: "task.created", label: "Task created", category: "task" },
	{ name: "task.updated", label: "Task updated", category: "task" },
	{ name: "task.deleted", label: "Task deleted", category: "task" },
	{ name: "task.moved", label: "Task moved", category: "task" },
	{ name: "task.status.changed", label: "Task status changed", category: "task" },
	{ name: "task.completed", label: "Task completed", category: "task" },
	{ name: "task.uncompleted", label: "Task uncompleted", category: "task" },
	{ name: "task.archived", label: "Task archived", category: "task" },
	{ name: "task.unarchived", label: "Task unarchived", category: "task" },
	{ name: "task.scheduled.changed", label: "Task scheduled date changed", category: "task" },
	{ name: "task.due.changed", label: "Task due date changed", category: "task" },
	{ name: "task.priority.changed", label: "Task priority changed", category: "task" },
	{ name: "task.tags.changed", label: "Task tags changed", category: "task" },
	{ name: "task.contexts.changed", label: "Task contexts changed", category: "task" },
	{ name: "task.projects.changed", label: "Task projects changed", category: "task" },
	{ name: "task.reminders.changed", label: "Task reminders changed", category: "task" },
	{ name: "task.dependencies.changed", label: "Task dependencies changed", category: "task" },
	{ name: "task.recurrence.changed", label: "Task recurrence changed", category: "task" },
	{ name: "time.started", label: "Time tracking started", category: "time" },
	{ name: "time.stopped", label: "Time tracking stopped", category: "time" },
	{ name: "pomodoro.started", label: "Pomodoro started", category: "pomodoro" },
	{ name: "pomodoro.completed", label: "Pomodoro completed", category: "pomodoro" },
	{ name: "pomodoro.interrupted", label: "Pomodoro interrupted", category: "pomodoro" },
	{ name: "recurring.instance.completed", label: "Recurring instance completed", category: "recurring" },
	{ name: "recurring.instance.skipped", label: "Recurring instance skipped", category: "recurring" },
];

const TRIGGER_TYPE_DETAILS: Record<WorkflowTrigger["type"], { label: string; description: string }> = {
	manual: {
		label: "Manual",
		description: "Runs only when explicitly started.",
	},
	"tasknotes.event": {
		label: "TaskNotes event",
		description: "Runs when TaskNotes emits the selected runtime event.",
	},
	cron: {
		label: "Cron schedule",
		description: "Runs when the five-part cron schedule matches the current minute.",
	},
	interval: {
		label: "Interval",
		description: "Runs repeatedly while Obsidian is open.",
	},
	"obsidian.vault": {
		label: "Vault file event",
		description: "Runs when Obsidian creates, modifies, deletes, or renames a file.",
	},
	"obsidian.metadata": {
		label: "Metadata event",
		description: "Runs when Obsidian metadata changes or resolves.",
	},
	"obsidian.workspace": {
		label: "Workspace event",
		description: "Runs when selected workspace activity occurs, such as opening a file or changing the active leaf.",
	},
};

export class WorkflowEditModal extends Modal {
	private draft: WorkflowDefinition;
	private readonly existingPath: string | null;
	private readonly loaded: LoadedWorkflow | null;

	constructor(
		app: App,
		private readonly plugin: TaskNotesWorkflowsPlugin,
		options: WorkflowEditModalOptions = {}
	) {
		super(app);
		this.loaded = options.loaded ?? null;
		this.existingPath = options.loaded?.file.path ?? null;
		this.draft = options.loaded?.workflow
			? cloneWorkflow(options.loaded.workflow)
			: createWorkflowDefinition({
					id: uniqueWorkflowId("untitled-workflow", plugin.workflows),
					name: "Untitled workflow",
				});
		this.onSaved = options.onSaved;
	}

	private readonly onSaved?: (workflow: LoadedWorkflow | null) => void;

	override onOpen(): void {
		this.modalEl.addClass("tnw-modal");
		this.render();
	}

	override onClose(): void {
		this.contentEl.empty();
		this.modalEl.querySelector(".tnw-modal-footer")?.remove();
	}

	private render(): void {
		this.titleEl.setText(this.existingPath ? "Edit workflow" : "New workflow");
		this.contentEl.empty();
		this.modalEl.querySelector(".tnw-modal-footer")?.remove();

		const root = this.contentEl.createDiv({ cls: "tnw-modal-body" });
		this.renderSummary(root);
		this.renderDefinition(root);
		this.renderTriggers(root);
		this.renderSteps(root);
		this.renderRunPolicy(root);
		this.renderFooter();
	}

	private renderSummary(parent: HTMLElement): void {
		const summary = parent.createDiv({ cls: "tnw-modal-summary" });
		const title = summary.createDiv({ cls: "tnw-modal-summary-main" });
		title.createDiv({ cls: "tnw-modal-summary-title", text: this.draft.name || "Untitled workflow" });
		title.createDiv({
			cls: "tnw-modal-summary-path",
			text: this.existingPath ?? this.plugin.settings.workflowFolder,
		});

		const meta = summary.createDiv({ cls: "tnw-modal-summary-meta" });
		renderPill(meta, this.draft.enabled ? "Enabled" : "Disabled", this.draft.enabled ? "is-enabled" : "is-disabled");
		renderPill(meta, `${this.draft.triggers.length} trigger${this.draft.triggers.length === 1 ? "" : "s"}`);
		renderPill(meta, `${this.draft.steps.length} step${this.draft.steps.length === 1 ? "" : "s"}`);
		renderPill(meta, this.draft.run.noOverlap ? "No overlap" : "Overlap allowed");
	}

	private renderDefinition(parent: HTMLElement): void {
		const section = createSection(parent, "Definition", "Name, identity, and whether this workflow can run automatically.");
		const panel = section.createDiv({ cls: "tnw-definition-panel" });
		const fields = panel.createDiv({ cls: "tnw-definition-fields" });
		const grid = fields.createDiv({ cls: "tnw-form-grid tnw-definition-grid" });

		const enabledLabel = panel.createEl("label", { cls: "tnw-switch-row" });
		const enabled = enabledLabel.createEl("input", { type: "checkbox" });
		enabled.checked = this.draft.enabled;
		enabled.addEventListener("change", () => {
			this.draft.enabled = enabled.checked;
		});
		const enabledCopy = enabledLabel.createSpan({ cls: "tnw-switch-copy" });
		enabledCopy.createSpan({ cls: "tnw-switch-title", text: "Enabled" });
		enabledCopy.createSpan({
			cls: "tnw-switch-description",
			text: "Allow automatic triggers to run this workflow.",
		});

		const nameInput = renderTextInput(grid, "Name", this.draft.name);
		nameInput.addEventListener("input", () => {
			this.draft.name = nameInput.value;
		});

		const idInput = renderTextInput(grid, "ID", this.draft.id);
		idInput.addEventListener("input", () => {
			this.draft.id = slugifyWorkflowId(idInput.value);
			idInput.value = this.draft.id;
		});

		const description = renderTextareaInput(fields, "Description", this.draft.description ?? "", true);
		description.parentElement?.addClass("tnw-description-field");
		description.placeholder = "Optional note for why this workflow exists.";
		description.addEventListener("input", () => {
			this.draft.description = description.value.trim() || undefined;
		});
	}

	private renderTriggers(parent: HTMLElement): void {
		const section = createSection(parent, "Triggers", "Run the workflow manually, on a schedule, from TaskNotes events, or from selected Obsidian events.");

		for (const [index, trigger] of this.draft.triggers.entries()) {
			this.renderTriggerCard(section, trigger, index);
		}

		const addRow = section.createDiv({ cls: "tnw-add-row is-bottom" });
		const addText = addRow.createDiv({ cls: "tnw-add-row-copy" });
		addText.createDiv({ cls: "tnw-add-row-title", text: "Add trigger" });
		addText.createDiv({ cls: "tnw-add-row-subtitle", text: "Additional triggers start the same workflow." });
		const addControls = addRow.createDiv({ cls: "tnw-add-row-controls" });
		const addSelect = renderSelectInput(addControls, "Trigger type", triggerTypeOptions(), "manual");
		addSelect.addClass("tnw-compact-select");

		new ButtonComponent(addControls)
			.setIcon("plus")
			.setButtonText("Add trigger")
			.setTooltip("Add trigger")
			.onClick(() => {
				this.draft.triggers.push(createDefaultTrigger(addSelect.value as WorkflowTrigger["type"], this.draft.triggers));
				this.render();
			});
	}

	private renderTriggerCard(parent: HTMLElement, trigger: WorkflowTrigger, index: number): void {
		const card = parent.createDiv({ cls: "tnw-edit-card" });
		const header = card.createDiv({ cls: "tnw-edit-card-header" });
		const title = header.createDiv({ cls: "tnw-edit-card-title" });
		title.createSpan({ cls: "tnw-step-index", text: String(index + 1) });
		title.createSpan({ text: trigger.id });
		title.createSpan({ cls: "tnw-card-path", text: triggerTypeLabel(trigger.type) });
		const actions = header.createDiv({ cls: "tnw-row-actions" });
		new ButtonComponent(actions)
			.setIcon("arrow-up")
			.setTooltip("Move up")
			.setDisabled(index === 0)
			.onClick(() => this.moveTrigger(index, -1));
		new ButtonComponent(actions)
			.setIcon("arrow-down")
			.setTooltip("Move down")
			.setDisabled(index >= this.draft.triggers.length - 1)
			.onClick(() => this.moveTrigger(index, 1));
		new ButtonComponent(actions)
			.setIcon("trash")
			.setTooltip("Delete trigger")
			.setDisabled(this.draft.triggers.length <= 1)
			.onClick(() => {
				this.draft.triggers.splice(index, 1);
				this.render();
			});

		card.createDiv({ cls: "tnw-card-description", text: triggerTypeDescription(trigger.type) });

		const grid = card.createDiv({ cls: "tnw-form-grid" });
		const idInput = renderTextInput(grid, "ID", trigger.id);
		const typeSelect = renderSelectInput(
			grid,
			"Type",
			triggerTypeOptions(),
			trigger.type
		);

		typeSelect.addEventListener("change", () => {
			const defaultTrigger = createDefaultTrigger(
				typeSelect.value as WorkflowTrigger["type"],
				this.draft.triggers.filter((_, triggerIndex) => triggerIndex !== index)
			);
			const id = slugifyWorkflowId(idInput.value);
			this.draft.triggers[index] = id ? { ...defaultTrigger, id } : defaultTrigger;
			this.render();
		});

		const controls: TriggerControls = {
			idInput,
			typeSelect,
		};
			this.renderTriggerSpecificFields(grid, trigger, controls);
			this.renderTriggerOutputs(card, trigger);
			const update = (): void => {
			this.draft.triggers[index] = triggerFromControls({
				id: idInput.value,
				type: typeSelect.value as WorkflowTrigger["type"],
				event: controls.eventInput?.value ?? triggerEventValue(trigger),
				schedule: controls.scheduleInput?.value ?? triggerScheduleValue(trigger),
				timezone: controls.timezoneInput?.value ?? triggerTimezoneValue(trigger),
				from: controls.fromInput?.value ?? ("from" in trigger ? stringifyScalar(trigger.from) : ""),
				to: controls.toInput?.value ?? ("to" in trigger ? stringifyScalar(trigger.to) : ""),
				pathGlob: controls.pathInput?.value ?? triggerPathGlobValue(trigger),
				allowSelfTrigger: controls.allowSelfTriggerInput?.checked ?? triggerAllowSelfValue(trigger),
				catchUp: controls.catchUpInput?.checked ?? triggerCatchUpValue(trigger),
			});
		};
		for (const input of triggerControlsInputs(controls)) {
			input.addEventListener("change", update);
		}
		if (isTaskNotesEventTriggerType(typeSelect.value as WorkflowTrigger["type"]) && controls.eventInput) {
			controls.eventInput.addEventListener("change", () => {
				update();
				this.render();
			});
		}
	}

	private renderTriggerSpecificFields(
		parent: HTMLElement,
		trigger: WorkflowTrigger,
		controls: TriggerControls
	): void {
		if (trigger.type === "manual") {
			parent.createDiv({ cls: "tnw-field-help is-wide", text: "No trigger fields." });
			return;
		}
		if (isTaskNotesEventTrigger(trigger)) {
			controls.eventInput = renderSelectInput(
				parent,
				"TaskNotes event",
				this.tasknotesEventOptions(trigger.event),
				trigger.event
			);
			if (trigger.event === "task.status.changed") {
				controls.fromInput = renderTextInput(parent, "From status", stringifyScalar(trigger.from));
				controls.toInput = renderTextInput(parent, "To status", stringifyScalar(trigger.to));
			}
			controls.pathInput = renderTextInput(parent, "Path glob", trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "TaskNotes/**/*.md";
			controls.allowSelfTriggerInput = renderCheckboxInput(parent, "Allow self-trigger", trigger.allowSelfTrigger === true);
			return;
		}
		if (trigger.type === "cron") {
			controls.scheduleInput = renderTextInput(parent, "Schedule", trigger.schedule);
			controls.scheduleInput.placeholder = "0 9 * * *";
			controls.timezoneInput = renderTextInput(parent, "Timezone", trigger.timezone ?? "local");
			controls.catchUpInput = renderCheckboxInput(parent, "Catch up", trigger.catchUp === true);
			return;
		}
		if (trigger.type === "interval") {
			controls.scheduleInput = renderTextInput(parent, "Every", trigger.every);
			controls.scheduleInput.setAttribute("placeholder", INTERVAL_PLACEHOLDER);
			return;
		}
		if (trigger.type === "obsidian.vault") {
			controls.eventInput = renderSelectInput(
				parent,
				"Event",
				[["create", "Create"], ["modify", "Modify"], ["delete", "Delete"], ["rename", "Rename"]],
				trigger.event
			);
			controls.pathInput = renderTextInput(parent, "Path glob", trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "**/*.md";
			return;
		}
		if (trigger.type === "obsidian.metadata") {
			controls.eventInput = renderSelectInput(
				parent,
				"Event",
				[["changed", "Changed"], ["deleted", "Deleted"], ["resolve", "Resolve"], ["resolved", "Resolved"]],
				trigger.event
			);
			controls.pathInput = renderTextInput(parent, "Path glob", trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "**/*.md";
			return;
		}
		if (trigger.type === "obsidian.workspace") {
			controls.eventInput = renderSelectInput(
				parent,
				"Event",
				[
					["file-open", "File open"],
					["active-leaf-change", "Active leaf changed"],
					["layout-change", "Layout changed"],
				],
				trigger.event
			);
			controls.pathInput = renderTextInput(parent, "Path glob", trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "**/*.md";
			return;
		}
	}

	private renderTriggerOutputs(parent: HTMLElement, trigger: WorkflowTrigger): void {
		const outputs = triggerOutputFields(trigger);
		if (outputs.length === 0) return;
		const details = parent.createEl("details", { cls: "tnw-output-fields tnw-trigger-output-fields" });
		details.createEl("summary", {
			cls: "tnw-output-title",
			text: `Trigger values available to steps (${outputs.length})`,
		});
		for (const output of outputs) {
			const row = details.createDiv({ cls: "tnw-output-row" });
			row.createSpan({ cls: "tnw-output-key", text: `{{trigger.${output.key}}}` });
			row.createSpan({ cls: "tnw-output-type", text: output.type });
			if (output.description) row.createSpan({ cls: "tnw-output-description", text: output.description });
		}
	}

	private renderSteps(parent: HTMLElement): void {
		const section = createSection(parent, "Steps", "Steps run from top to bottom. Outputs from earlier steps can be referenced by later steps.");

		for (const [index, step] of this.draft.steps.entries()) {
			this.renderStepCard(section, step, index);
		}

		const addRow = section.createDiv({ cls: "tnw-add-row is-bottom" });
		const addText = addRow.createDiv({ cls: "tnw-add-row-copy" });
		addText.createDiv({ cls: "tnw-add-row-title", text: "Add next step" });
		addText.createDiv({ cls: "tnw-add-row-subtitle", text: "The new step will run after the steps above." });
		const addControls = addRow.createDiv({ cls: "tnw-add-row-controls" });
		const addSelect = renderSelectInput(addControls, "Step type", this.stepOptions(), "notice.show");
		addSelect.addClass("tnw-compact-select");
		new ButtonComponent(addControls)
			.setIcon("plus")
			.setButtonText("Add step")
			.setTooltip("Add step")
			.onClick(() => {
				this.draft.steps.push(createDefaultStep(addSelect.value, new Set(this.draft.steps.map((step) => step.id))));
				this.render();
			});
	}

	private renderStepCard(parent: HTMLElement, step: WorkflowStep, index: number): void {
		const definition = this.plugin.stepRegistry.get(step.type);
		const card = parent.createDiv({ cls: "tnw-edit-card" });
		const header = card.createDiv({ cls: "tnw-edit-card-header" });
		const title = header.createDiv({ cls: "tnw-edit-card-title" });
		title.createSpan({ cls: "tnw-step-index", text: String(index + 1) });
		title.createSpan({ text: step.id });
		if (definition) title.createSpan({ cls: "tnw-card-path", text: definition.label });
		if (definition?.mutatesTasks || definition?.writesVault) title.createSpan({ cls: "tnw-chip is-warning", text: "writes" });
		const actions = header.createDiv({ cls: "tnw-row-actions" });
		new ButtonComponent(actions)
			.setIcon("arrow-up")
			.setTooltip("Move up")
			.setDisabled(index === 0)
			.onClick(() => this.moveStep(index, -1));
		new ButtonComponent(actions)
			.setIcon("arrow-down")
			.setTooltip("Move down")
			.setDisabled(index >= this.draft.steps.length - 1)
			.onClick(() => this.moveStep(index, 1));
		new ButtonComponent(actions)
			.setIcon("trash")
			.setTooltip("Delete step")
			.setDisabled(this.draft.steps.length <= 1)
			.onClick(() => {
				this.draft.steps.splice(index, 1);
				this.render();
			});

		if (definition) {
			card.createDiv({ cls: "tnw-card-description", text: definition.description });
		}

		const grid = card.createDiv({ cls: "tnw-form-grid" });
		const idInput = renderTextInput(grid, "ID", step.id);
		idInput.addEventListener("change", () => {
			const id = slugifyWorkflowId(idInput.value);
			if (id) {
				this.draft.steps[index].id = id;
				idInput.value = id;
			}
		});

		const typeSelect = renderSelectInput(grid, "Type", this.stepOptions(), step.type);
		typeSelect.addEventListener("change", () => {
			const type = typeSelect.value;
			this.draft.steps[index] = {
				id: this.draft.steps[index].id,
				type,
				input: defaultInputForStep(type),
			};
			this.render();
		});

		if (definition?.supportsForEach !== false) {
			const forEach = renderTextInput(grid, "For each", step.forEach ?? "");
			forEach.placeholder = "{{steps.query.tasks}}";
			forEach.addEventListener("change", () => {
				this.draft.steps[index].forEach = forEach.value.trim() || undefined;
			});
			forEach.parentElement?.createDiv({
				cls: "tnw-field-help",
				text: "Optional array reference for batch steps.",
			});
		}

		this.renderStepInputFields(grid, step, definition);
		this.renderStepOutputs(card, definition);
	}

	private renderStepInputFields(
		parent: HTMLElement,
		step: WorkflowStep,
		definition: StepDefinition | undefined
	): void {
		const fields = definition?.inputFields ?? [];
		if (fields.length === 0) {
			const area = renderTextareaInput(parent, "Input JSON", JSON.stringify(step.input ?? {}, null, 2), true, true);
			area.addEventListener("change", () => {
				const parsed = parseObjectJson(area.value);
				if (parsed.error) {
					new Notice(parsed.error);
					return;
				}
				step.input = parsed.value;
			});
			return;
		}

		for (const field of fields) {
			this.renderStepInputField(parent, step, field);
		}
	}

	private renderStepInputField(parent: HTMLElement, step: WorkflowStep, field: WorkflowInputField): void {
		if (!step.input) step.input = {};
		const inputRecord = step.input;
		const current = getPath(inputRecord, field.key) ?? field.defaultValue ?? "";
		const options = field.options ?? this.dynamicOptions(field.optionsFrom);
		if (field.type === "boolean") {
			const wrapper = parent.createEl("label", { cls: "tnw-field is-inline" });
			wrapper.createSpan({ cls: "tnw-field-label", text: field.label });
			const input = wrapper.createEl("input", { type: "checkbox" });
			input.checked = current === true;
			input.addEventListener("change", () => setPath(inputRecord, field.key, input.checked));
			this.renderFieldHelp(wrapper, field);
			return;
		}
		if (field.type === "select" && options.length > 0) {
			const selectOptions: Array<[string, string]> = [
				["", ""],
				...options.map((option): [string, string] => [option.value, option.label]),
			];
			const select = renderSelectInput(parent, field.label, selectOptions, stringifyScalar(current));
			select.addEventListener("change", () => setOrDeletePath(inputRecord, field.key, select.value));
			this.renderFieldHelp(select.parentElement, field);
			return;
		}
		if (field.type === "json") {
			const area = renderTextareaInput(parent, field.label, JSON.stringify(current || {}, null, 2), true, true);
			area.addEventListener("change", () => {
				const parsed = parseObjectJson(area.value);
				if (parsed.error) {
					new Notice(parsed.error);
					return;
				}
				setPath(inputRecord, field.key, parsed.value ?? {});
			});
			this.renderFieldHelp(area.parentElement, field);
			return;
		}
		const input =
			field.type === "textarea"
				? renderTextareaInput(parent, field.label, stringifyScalar(current), field.wide !== false)
				: renderTextInput(parent, field.label, stringifyScalar(current), inputTypeForField(field));
		if (field.placeholder) input.placeholder = field.placeholder;
		input.addEventListener("change", () => {
			const next = coerceInputValue(input.value, field);
			setOrDeletePath(inputRecord, field.key, next);
		});
		this.renderFieldHelp(input.parentElement, field);
	}

	private renderStepOutputs(parent: HTMLElement, definition: StepDefinition | undefined): void {
		if (!definition || definition.outputFields.length === 0) return;
		const details = parent.createEl("details", { cls: "tnw-output-fields" });
		details.createEl("summary", {
			cls: "tnw-output-title",
			text: `Outputs available to later steps (${definition.outputFields.length})`,
		});
		for (const output of definition.outputFields) {
			const row = details.createDiv({ cls: "tnw-output-row" });
			row.createSpan({ cls: "tnw-output-key", text: output.key });
			row.createSpan({ cls: "tnw-output-type", text: output.type });
			if (output.description) row.createSpan({ cls: "tnw-output-description", text: output.description });
		}
	}

	private renderFieldHelp(parent: HTMLElement | null, field: WorkflowInputField): void {
		if (!parent || !field.description) return;
		parent.createDiv({ cls: "tnw-field-help", text: field.description });
	}

	private renderRunPolicy(parent: HTMLElement): void {
		const section = createSection(parent, "Run policy");
		const grid = section.createDiv({ cls: "tnw-form-grid" });

		const noOverlapLabel = grid.createEl("label", { cls: "tnw-field is-inline" });
		noOverlapLabel.createSpan({ cls: "tnw-field-label", text: "No overlap" });
		const noOverlap = noOverlapLabel.createEl("input", { type: "checkbox" });
		noOverlap.checked = this.draft.run.noOverlap;
		noOverlap.addEventListener("change", () => {
			this.draft.run.noOverlap = noOverlap.checked;
		});

		const onError = renderSelectInput(grid, "On error", [["stop", "Stop"], ["continue", "Continue"]], this.draft.run.onError);
		onError.addEventListener("change", () => {
			this.draft.run.onError = onError.value === "continue" ? "continue" : "stop";
		});

		const maxTasks = renderTextInput(grid, "Max tasks", String(this.draft.run.maxTasks), "number");
		maxTasks.addEventListener("change", () => {
			const value = Number(maxTasks.value);
			if (Number.isFinite(value) && value > 0) this.draft.run.maxTasks = Math.floor(value);
		});

		const source = renderTextInput(grid, "Source", this.draft.run.source);
		source.addEventListener("change", () => {
			this.draft.run.source = source.value.trim() || "tasknotes-workflows";
		});
	}

	private renderFooter(): void {
		const footer = this.modalEl.createDiv({ cls: "tnw-modal-footer" });
		if (this.existingPath) {
			new ButtonComponent(footer)
				.setIcon("file-text")
				.setButtonText("Open note")
				.onClick(() => {
					if (this.loaded?.file) void this.plugin.openWorkflowFile(this.loaded.file);
					this.close();
				});
		}
		new ButtonComponent(footer)
			.setIcon("x")
			.setButtonText("Cancel")
			.onClick(() => this.close());
		new ButtonComponent(footer)
			.setIcon("save")
			.setButtonText("Save")
			.setCta()
			.onClick(() => {
				void this.save();
			});
	}

	private async save(): Promise<void> {
		const validation = this.validate();
		if (validation) {
			new Notice(validation);
			return;
		}

		if (this.loaded?.file) {
			await this.plugin.repository.saveWorkflow(this.loaded.file, this.draft);
		} else {
			await this.plugin.repository.createWorkflow(this.draft, `# ${this.draft.name}\n`);
		}
		await this.plugin.reloadWorkflows();
		this.onSaved?.(this.plugin.repository.getById(this.draft.id));
		new Notice(`Saved workflow: ${this.draft.name}`);
		this.close();
	}

	private validate(): string | null {
		this.draft.name = this.draft.name.trim();
		this.draft.id = slugifyWorkflowId(this.draft.id);
		if (!this.draft.name) return "Workflow name is required.";
		if (!/^[a-z][a-z0-9._-]*$/u.test(this.draft.id)) {
			return "Workflow ID must start with a letter and use lowercase letters, numbers, dots, underscores, or dashes.";
		}
		const duplicate = this.plugin.workflows.find(
			(workflow) => workflow.workflow?.id === this.draft.id && workflow.file.path !== this.existingPath
		);
		if (duplicate) return `Workflow ID already exists: ${this.draft.id}`;
		if (this.draft.triggers.length === 0) return "A workflow needs at least one trigger.";
		if (this.draft.steps.length === 0) return "A workflow needs at least one step.";
		for (const step of this.draft.steps) {
			if (!/^[a-z][a-z0-9._-]*$/u.test(step.id)) return `Invalid step ID: ${step.id}`;
		}
		return null;
	}

	private moveStep(index: number, delta: -1 | 1): void {
		const nextIndex = index + delta;
		if (nextIndex < 0 || nextIndex >= this.draft.steps.length) return;
		const [step] = this.draft.steps.splice(index, 1);
		if (step) this.draft.steps.splice(nextIndex, 0, step);
		this.render();
	}

	private moveTrigger(index: number, delta: -1 | 1): void {
		const nextIndex = index + delta;
		if (nextIndex < 0 || nextIndex >= this.draft.triggers.length) return;
		const [trigger] = this.draft.triggers.splice(index, 1);
		if (trigger) this.draft.triggers.splice(nextIndex, 0, trigger);
		this.render();
	}

	private stepOptions(): Array<[string, string]> {
		return this.plugin.stepRegistry.list().map((step) => [step.type, `${step.label} (${step.type})`]);
	}

	private tasknotesEventOptions(selectedEvent?: string): Array<[string, string]> {
		const runtimeEvents = this.plugin.tasknotesEventDefinitions();
		const events = runtimeEvents.length > 0 ? runtimeEvents : DEFAULT_TASKNOTES_EVENTS;
		const options = events.map((event): [string, string] => [
			event.name,
			`${event.label || event.name} (${event.name})`,
		]);
		if (selectedEvent && !options.some(([value]) => value === selectedEvent)) {
			options.unshift([selectedEvent, selectedEvent]);
		}
		return options;
	}

	private dynamicOptions(source: WorkflowDynamicFieldOptions | undefined): WorkflowFieldOption[] {
		const settings = this.plugin.tasknotesSettingsSnapshot();
		if (!source || !settings) return [];
		if (source === "task-statuses") return readNamedOptions(settings.customStatuses);
		if (source === "task-priorities") return readNamedOptions(settings.customPriorities);
		return [];
	}
}

function createSection(parent: HTMLElement, title: string, description?: string): HTMLElement {
	const section = parent.createDiv({ cls: "tnw-editor-section" });
	const header = section.createDiv({ cls: "tnw-modal-section-heading" });
	header.createDiv({ cls: "tnw-section-title", text: title });
	if (description) header.createDiv({ cls: "tnw-section-description", text: description });
	return section;
}

function renderPill(parent: HTMLElement, text: string, stateClass?: string): void {
	parent.createSpan({ cls: stateClass ? `tnw-chip ${stateClass}` : "tnw-chip", text });
}

function renderTextInput(
	parent: HTMLElement,
	label: string,
	value: string,
	type = "text"
): HTMLInputElement {
	const wrapper = parent.createEl("label", { cls: "tnw-field" });
	if (label) wrapper.createSpan({ cls: "tnw-field-label", text: label });
	return wrapper.createEl("input", {
		cls: "tnw-input",
		type,
		value,
	});
}

function renderTextareaInput(
	parent: HTMLElement,
	label: string,
	value: string,
	wide: boolean,
	code = false
): HTMLTextAreaElement {
	const wrapper = parent.createEl("label", { cls: wide ? "tnw-field is-wide" : "tnw-field" });
	if (label) wrapper.createSpan({ cls: "tnw-field-label", text: label });
	return wrapper.createEl("textarea", {
		cls: code ? "tnw-textarea is-code" : "tnw-textarea",
		text: value,
	});
}

function renderSelectInput(
	parent: HTMLElement,
	label: string,
	options: Array<[string, string]>,
	value: string
): HTMLSelectElement {
	const wrapper = parent.createEl("label", { cls: "tnw-field" });
	if (label) wrapper.createSpan({ cls: "tnw-field-label", text: label });
	const select = wrapper.createEl("select", { cls: "tnw-select" });
	for (const [optionValue, text] of options) {
		const option = select.createEl("option", { text, value: optionValue });
		option.selected = optionValue === value;
	}
	return select;
}

function renderCheckboxInput(parent: HTMLElement, label: string, checked: boolean): HTMLInputElement {
	const wrapper = parent.createEl("label", { cls: "tnw-field is-inline" });
	wrapper.createSpan({ cls: "tnw-field-label", text: label });
	const input = wrapper.createEl("input", { type: "checkbox" });
	input.checked = checked;
	return input;
}

function triggerTypeOptions(): Array<[WorkflowTrigger["type"], string]> {
	return TRIGGER_TYPES.map((type) => [type, triggerTypeLabel(type)]);
}

function triggerTypeLabel(type: WorkflowTrigger["type"]): string {
	return TRIGGER_TYPE_DETAILS[type].label;
}

function triggerTypeDescription(type: WorkflowTrigger["type"]): string {
	return TRIGGER_TYPE_DETAILS[type].description;
}

function triggerControlsInputs(controls: TriggerControls): Array<HTMLInputElement | HTMLSelectElement> {
	return [
		controls.idInput,
		controls.eventInput,
		controls.scheduleInput,
		controls.timezoneInput,
		controls.fromInput,
		controls.toInput,
		controls.pathInput,
		controls.allowSelfTriggerInput,
		controls.catchUpInput,
	].filter((input): input is HTMLInputElement | HTMLSelectElement => Boolean(input));
}

function isTaskNotesEventTrigger(trigger: WorkflowTrigger): trigger is TaskNotesEventTrigger {
	return isTaskNotesEventTriggerType(trigger.type);
}

function isTaskNotesEventTriggerType(type: WorkflowTrigger["type"]): type is TaskNotesEventTrigger["type"] {
	return type === "tasknotes.event";
}

function triggerOutputFields(trigger: WorkflowTrigger): WorkflowOutputField[] {
	const common: WorkflowOutputField[] = [
		{ key: "type", label: "Type", type: "string", description: "The trigger kind." },
		{ key: "id", label: "ID", type: "string", description: "The trigger ID from this workflow." },
		{ key: "event", label: "Event", type: "string", description: "The event name that started the run." },
		{ key: "actualAt", label: "Actual time", type: "datetime", description: "When the workflow run started." },
	];
	if (isTaskNotesEventTrigger(trigger)) {
		return [
			...common,
			{ key: "after.path", label: "Task path", type: "string", description: "The task path after the event." },
			{ key: "after.title", label: "Task title", type: "string", description: "The task title after the event." },
			{ key: "after.status", label: "Current status", type: "string", description: "The task status after the event." },
			{ key: "before.status", label: "Previous status", type: "string", description: "The task status before the event." },
			{ key: "changes", label: "Changes", type: "object", description: "Changed fields keyed by property name." },
			{ key: "source", label: "Source", type: "string", description: "The mutation source, when provided." },
			{ key: "correlationId", label: "Correlation ID", type: "string", description: "The mutation correlation ID, when provided." },
		];
	}
	if (trigger.type === "cron" || trigger.type === "interval") {
		return [
			...common,
			{ key: "scheduledAt", label: "Scheduled time", type: "datetime", description: "The schedule tick time." },
		];
	}
	if (
		trigger.type === "obsidian.vault" ||
		trigger.type === "obsidian.metadata" ||
		trigger.type === "obsidian.workspace"
	) {
		return [
			...common,
			{ key: "path", label: "Path", type: "string", description: "The matching vault file path." },
			{ key: "file.path", label: "File path", type: "string", description: "The matching file path." },
			{ key: "file.name", label: "File name", type: "string", description: "The matching file name." },
			{ key: "file.extension", label: "Extension", type: "string", description: "The matching file extension." },
			{ key: "data", label: "Data", type: "object", description: "Extra event data, when provided." },
		];
	}
	return [
		{ key: "type", label: "Type", type: "string", description: "The trigger kind." },
		{ key: "id", label: "ID", type: "string", description: "The trigger ID from this workflow." },
		{ key: "manual", label: "Manual", type: "boolean", description: "True for a manual run." },
		{ key: "actualAt", label: "Actual time", type: "datetime", description: "When the workflow run started." },
	];
}

function triggerFromControls(input: {
	id: string;
	type: WorkflowTrigger["type"];
	event: string;
	schedule: string;
	timezone: string;
	from: string;
	to: string;
	pathGlob: string;
	allowSelfTrigger: boolean;
	catchUp: boolean;
}): WorkflowTrigger {
	const id = slugifyWorkflowId(input.id) || "trigger";
	const path = input.pathGlob.trim() ? { glob: input.pathGlob.trim() } : undefined;
	if (isTaskNotesEventTriggerType(input.type)) {
		return {
			id,
			type: "tasknotes.event",
			event: input.event.trim() || "task.status.changed",
			from: input.from.trim() || undefined,
			to: input.to.trim() || undefined,
			path,
			allowSelfTrigger: input.allowSelfTrigger || undefined,
		};
	}
	if (input.type === "cron") {
		return {
			id,
			type: "cron",
			schedule: input.schedule.trim() || "0 9 * * *",
			timezone: input.timezone.trim() || "local",
			catchUp: input.catchUp || undefined,
		};
	}
	if (input.type === "interval") {
		return { id, type: "interval", every: input.schedule.trim() || "30m" };
	}
	if (input.type === "obsidian.vault") {
		const event = input.event.trim();
		return {
			id,
			type: "obsidian.vault",
			event: event === "create" || event === "delete" || event === "rename" ? event : "modify",
			path,
		};
	}
	if (input.type === "obsidian.metadata") {
		const event = input.event.trim();
		const safeEvent = event === "deleted" || event === "resolve" || event === "resolved" ? event : "changed";
		return { id, type: "obsidian.metadata", event: safeEvent, path };
	}
	if (input.type === "obsidian.workspace") {
		const event = input.event.trim();
		const safeEvent = event === "active-leaf-change" || event === "layout-change" ? event : "file-open";
		return { id, type: "obsidian.workspace", event: safeEvent, path };
	}
	return { id, type: "manual" };
}

function triggerEventValue(trigger: WorkflowTrigger): string {
	if ("event" in trigger) return String(trigger.event);
	return "";
}

function triggerScheduleValue(trigger: WorkflowTrigger): string {
	if (trigger.type === "cron") return trigger.schedule;
	if (trigger.type === "interval") return trigger.every;
	return "";
}

function triggerTimezoneValue(trigger: WorkflowTrigger): string {
	return trigger.type === "cron" ? trigger.timezone ?? "local" : "";
}

function triggerAllowSelfValue(trigger: WorkflowTrigger): boolean {
	return isTaskNotesEventTrigger(trigger) && trigger.allowSelfTrigger === true;
}

function triggerCatchUpValue(trigger: WorkflowTrigger): boolean {
	return trigger.type === "cron" && trigger.catchUp === true;
}

function triggerPathGlobValue(trigger: WorkflowTrigger): string {
	if ("path" in trigger) return trigger.path?.glob ?? "";
	return "";
}

function inputTypeForField(field: WorkflowInputField): string {
	if (field.type === "number") return "number";
	if (field.type === "date") return "date";
	return "text";
}

function coerceInputValue(value: string, field: WorkflowInputField): unknown {
	if (field.type === "number") {
		const numberValue = Number(value);
		return Number.isFinite(numberValue) ? numberValue : undefined;
	}
	return value.trim();
}

function parseObjectJson(raw: string): { value?: Record<string, unknown>; error?: string } {
	const trimmed = raw.trim();
	if (!trimmed) return {};
	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (!isRecord(parsed)) return { error: "Step input must be a JSON object." };
		return { value: parsed };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
}

function getPath(input: Record<string, unknown>, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = input;
	for (const part of parts) {
		if (!isRecord(current)) return undefined;
		current = current[part];
	}
	return current;
}

function setOrDeletePath(input: Record<string, unknown>, path: string, value: unknown): void {
	if (value === "" || typeof value === "undefined") {
		deletePath(input, path);
		return;
	}
	setPath(input, path, value);
}

function setPath(input: Record<string, unknown> | undefined, path: string, value: unknown): void {
	if (!input) return;
	const parts = path.split(".");
	let current: Record<string, unknown> = input;
	for (const part of parts.slice(0, -1)) {
		if (!isRecord(current[part])) current[part] = {};
		current = current[part] as Record<string, unknown>;
	}
	const finalPart = parts[parts.length - 1];
	if (finalPart) current[finalPart] = value;
}

function deletePath(input: Record<string, unknown>, path: string): void {
	const parts = path.split(".");
	let current: Record<string, unknown> = input;
	for (const part of parts.slice(0, -1)) {
		if (!isRecord(current[part])) return;
		current = current[part];
	}
	const finalPart = parts[parts.length - 1];
	if (finalPart) delete current[finalPart];
}

function readNamedOptions(value: unknown): WorkflowFieldOption[] {
	if (!Array.isArray(value)) return [];
	return value
		.map((item): WorkflowFieldOption | null => {
			if (!isRecord(item) || typeof item.value !== "string") return null;
			return {
				value: item.value,
				label: typeof item.label === "string" && item.label.trim() ? item.label : item.value,
			};
		})
		.filter((item): item is WorkflowFieldOption => item !== null);
}

function stringifyScalar(value: unknown): string {
	if (value === null || typeof value === "undefined") return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
		return String(value);
	}
	return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
