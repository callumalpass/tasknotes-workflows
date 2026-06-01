import {
	AbstractInputSuggest,
	ButtonComponent,
	Modal,
	Notice,
	setIcon,
	ToggleComponent,
	type App,
	type IconName,
} from "obsidian";
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
	TaskNotesRuntimeCondition,
	TaskNotesEventTrigger,
	TaskNotesRuntimeEventDefinition,
	TaskNotesRuntimeFilterOperatorDefinition,
	TaskNotesRuntimeFilterPropertyDefinition,
	TaskNotesRuntimeOperator,
	TaskNotesRuntimePredicate,
	TaskNotesRuntimeTaskQuery,
	TaskNotesRuntimeValue,
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

type WorkflowEditorSection = "definition" | "triggers" | "steps" | "run";

type ValidationResult = {
	issues: Map<string, string>;
	firstMessage: string | null;
};

type StepOptionGroup = {
	category: string;
	steps: StepDefinition[];
};

type TemplateOption = {
	value: string;
	label: string;
};

type SimpleTaskQuery = {
	mode: "all" | "any";
	conditions: TaskNotesRuntimeCondition[];
};

const EDITOR_SECTIONS: Array<{ id: WorkflowEditorSection; labelKey: string; descriptionKey: string }> = [
	{ id: "definition", labelKey: "editor.sections.definition.label", descriptionKey: "editor.sections.definition.description" },
	{ id: "triggers", labelKey: "editor.sections.triggers.label", descriptionKey: "editor.sections.triggers.description" },
	{ id: "steps", labelKey: "editor.sections.steps.label", descriptionKey: "editor.sections.steps.description" },
	{ id: "run", labelKey: "editor.sections.run.label", descriptionKey: "editor.sections.run.description" },
];

const INTERVAL_PLACEHOLDER = ["30", "m"].join("");

const VALUELESS_OPERATORS = new Set<TaskNotesRuntimeOperator>(["exists", "missing", "isTrue", "isFalse"]);

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

const TRIGGER_TYPE_KEYS: Record<WorkflowTrigger["type"], string> = {
	manual: "manual",
	"tasknotes.event": "tasknotesEvent",
	cron: "cron",
	interval: "interval",
	"obsidian.vault": "obsidianVault",
	"obsidian.metadata": "obsidianMetadata",
	"obsidian.workspace": "obsidianWorkspace",
};

export class WorkflowEditModal extends Modal {
	private draft: WorkflowDefinition;
	private readonly existingPath: string | null;
	private readonly loaded: LoadedWorkflow | null;
	private readonly initialSerialized: string;
	private activeSection: WorkflowEditorSection = "definition";
	private readonly openTriggerIds = new Set<string>();
	private readonly openStepIds = new Set<string>();
	private readonly advancedOpen = new Set<string>();
	private validationMessages = new Map<string, string>();
	private skipUnsavedPrompt = false;
	private discardWarningArmed = false;

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
					name: plugin.t("editor.untitledWorkflow"),
				});
		this.initialSerialized = serializeWorkflowDraft(this.draft);
		if (this.draft.triggers[0]) this.openTriggerIds.add(this.draft.triggers[0].id);
		if (this.draft.steps[0]) this.openStepIds.add(this.draft.steps[0].id);
		this.onSaved = options.onSaved;
	}

	private readonly onSaved?: (workflow: LoadedWorkflow | null) => void;

	override close(): void {
		if (
			!this.skipUnsavedPrompt &&
			this.isDirty() &&
			!this.confirmDiscardWithNotice(this.t("notices.discardChanges"))
		) {
			return;
		}
		super.close();
	}

	override onOpen(): void {
		this.modalEl.addClass("tnw-modal");
		this.render();
	}

	override onClose(): void {
		this.contentEl.empty();
		this.modalEl.querySelector(".tnw-modal-footer")?.remove();
	}

	private render(): void {
		this.pruneOpenItems();
		this.validationMessages = this.collectValidation().issues;
		this.titleEl.setText(this.t(this.existingPath ? "editor.title.edit" : "editor.title.new"));
		this.contentEl.empty();
		this.modalEl.querySelector(".tnw-modal-footer")?.remove();

		const root = this.contentEl.createDiv({ cls: "tnw-modal-body" });
		this.renderSummary(root);
		const editor = root.createDiv({ cls: "tnw-modal-editor-shell" });
		this.renderOutline(editor);
		const main = editor.createDiv({ cls: "tnw-modal-editor-main" });
		if (this.activeSection === "definition") this.renderDefinition(main);
		if (this.activeSection === "triggers") this.renderTriggers(main);
		if (this.activeSection === "steps") this.renderSteps(main);
		if (this.activeSection === "run") this.renderRunPolicy(main);
		this.renderFooter();
	}

	private t(key: string, params?: Record<string, string | number>): string {
		return this.plugin.t(key, params);
	}

	private renderOutline(parent: HTMLElement): void {
		const outline = parent.createDiv({ cls: "tnw-modal-outline" });
		outline.createDiv({ cls: "tnw-outline-heading", text: this.t("editor.workflowEditor") });
		for (const section of EDITOR_SECTIONS) {
			const button = outline.createEl("button", { cls: "tnw-outline-item" });
			button.setAttr("type", "button");
			button.toggleClass("is-active", this.activeSection === section.id);
			button.toggleClass("has-error", this.sectionHasValidation(section.id));
			button.addEventListener("click", () => {
				this.activeSection = section.id;
				this.render();
			});
			const label = button.createSpan({ cls: "tnw-outline-label" });
			label.createSpan({ cls: "tnw-outline-title", text: this.t(section.labelKey) });
			label.createSpan({ cls: "tnw-outline-description", text: this.t(section.descriptionKey) });
			const metaText = this.sectionMeta(section.id);
			if (metaText) {
				const meta = button.createSpan({ cls: "tnw-outline-meta", text: metaText });
				if (this.sectionHasValidation(section.id)) meta.addClass("has-error");
			}
		}
	}

	private renderSummary(parent: HTMLElement): void {
		const summary = parent.createDiv({ cls: "tnw-modal-summary" });
		const title = summary.createDiv({ cls: "tnw-modal-summary-main" });
		title.createDiv({ cls: "tnw-modal-summary-title", text: this.draft.name || this.t("editor.untitledWorkflow") });
		title.createDiv({
			cls: "tnw-modal-summary-path",
			text: this.existingPath ?? this.plugin.settings.workflowFolder,
		});

		const status = summary.createDiv({ cls: "tnw-modal-summary-status" });
		this.renderEnabledToggle(status);
		const meta = status.createDiv({ cls: "tnw-modal-summary-meta" });
		renderPill(meta, this.plugin.i18n.translatePlural("editor.summary.triggerCount", this.draft.triggers.length));
		renderPill(meta, this.plugin.i18n.translatePlural("editor.summary.stepCount", this.draft.steps.length));
		renderPill(meta, this.draft.run.noOverlap ? this.t("editor.summary.noOverlap") : this.t("editor.summary.overlapAllowed"));
		if (this.isDirty()) renderPill(meta, this.t("common.unsavedChanges"), "is-warning");
	}

	private renderEnabledToggle(parent: HTMLElement): void {
		const control = parent.createDiv({ cls: "tnw-enabled-toggle" });
		const statusText = this.draft.enabled ? this.t("common.enabled") : this.t("common.disabled");
		const tooltip = this.draft.enabled
			? this.t("editor.summary.enabledDescription")
			: this.t("editor.summary.disabledDescription");
		control.createSpan({
			cls: `tnw-enabled-toggle-title ${this.draft.enabled ? "is-enabled" : "is-disabled"}`,
			text: statusText,
		});
		const toggleHost = control.createDiv({ cls: "tnw-enabled-toggle-control" });
		const toggle = new ToggleComponent(toggleHost)
			.setValue(this.draft.enabled)
			.setTooltip(tooltip)
			.onChange((enabled) => {
				this.draft.enabled = enabled;
				this.render();
			});
		toggle.toggleEl.setAttr("aria-label", `${statusText}. ${tooltip}`);
	}

	private renderDefinition(parent: HTMLElement): void {
		const section = createSection(parent, this.t("editor.sections.definition.title"), this.t("editor.sections.definition.body"));
		const panel = section.createDiv({ cls: "tnw-definition-panel" });
		const fields = panel.createDiv({ cls: "tnw-definition-fields" });
		const grid = fields.createDiv({ cls: "tnw-form-grid tnw-definition-grid" });

		const nameInput = renderTextInput(grid, this.t("editor.definition.name"), this.draft.name);
		nameInput.addEventListener("input", () => {
			this.draft.name = nameInput.value;
		});
		this.renderValidation(nameInput, "definition.name");

		const description = renderTextareaInput(fields, this.t("editor.definition.description"), this.draft.description ?? "", true);
		description.parentElement?.addClass("tnw-description-field");
		description.placeholder = this.t("editor.definition.descriptionPlaceholder");
		description.addEventListener("input", () => {
			this.draft.description = description.value.trim() || undefined;
		});
		this.attachTemplateSuggest(description);

		const advanced = this.renderAdvancedDetails(
			fields,
			this.t("editor.definition.advancedTitle"),
			this.t("editor.definition.advancedDescription"),
			"definition"
		);
		const idInput = renderTextInput(advanced, this.t("editor.definition.id"), this.draft.id);
		idInput.addEventListener("input", () => {
			this.draft.id = slugifyWorkflowId(idInput.value);
			idInput.value = this.draft.id;
		});
		this.renderValidation(idInput, "definition.id");
	}

	private renderTriggers(parent: HTMLElement): void {
		const section = createSection(parent, this.t("editor.sections.triggers.title"), this.t("editor.sections.triggers.body"));
		this.renderSectionValidation(section, "triggers");

		for (const [index, trigger] of this.draft.triggers.entries()) {
			this.renderTriggerCard(section, trigger, index);
		}

		const addRow = section.createDiv({ cls: "tnw-add-row is-bottom" });
		const addText = addRow.createDiv({ cls: "tnw-add-row-copy" });
		addText.createDiv({ cls: "tnw-add-row-title", text: this.t("editor.triggers.addTitle") });
		addText.createDiv({ cls: "tnw-add-row-subtitle", text: this.t("editor.triggers.addDescription") });
		const addControls = addRow.createDiv({ cls: "tnw-add-row-controls" });
		const addSelect = renderSelectInput(addControls, this.t("editor.triggers.type"), this.triggerTypeOptions(), "manual");
		addSelect.addClass("tnw-compact-select");

		setButtonIconText(new ButtonComponent(addControls), "plus", this.t("editor.triggers.addButton"))
			.setTooltip(this.t("editor.triggers.addButton"))
			.onClick(() => {
				const trigger = createDefaultTrigger(addSelect.value as WorkflowTrigger["type"], this.draft.triggers);
				this.draft.triggers.push(trigger);
				this.openTriggerIds.add(trigger.id);
				this.render();
			});
	}

	private renderTriggerCard(parent: HTMLElement, trigger: WorkflowTrigger, index: number): void {
		const card = parent.createDiv({ cls: "tnw-edit-card" });
		const isOpen = this.openTriggerIds.has(trigger.id);
		card.toggleClass("is-active", isOpen);
		card.toggleClass("has-error", this.hasValidationPrefix(`trigger.${index}.`));
		const header = card.createDiv({ cls: "tnw-edit-card-header" });
		const summaryButton = header.createEl("button", { cls: "tnw-card-summary-button" });
		summaryButton.setAttr("type", "button");
		summaryButton.setAttr("aria-expanded", String(isOpen));
		summaryButton.addEventListener("click", () => {
			this.toggleTriggerOpen(trigger.id);
			this.render();
		});
		const title = summaryButton.createSpan({ cls: "tnw-edit-card-title" });
		title.createSpan({ cls: "tnw-card-row-chevron" });
		title.createSpan({ cls: "tnw-step-index", text: String(index + 1) });
		const copy = title.createSpan({ cls: "tnw-card-summary-copy" });
		copy.createSpan({ cls: "tnw-card-summary-title", text: this.summarizeTrigger(trigger) });
		copy.createSpan({ cls: "tnw-card-path", text: this.triggerSummaryDetail(trigger) });
		if (this.hasValidationPrefix(`trigger.${index}.`)) {
			title.createSpan({ cls: "tnw-chip is-invalid", text: this.t("editor.triggers.needsAttention") });
		}
		const actions = header.createDiv({ cls: "tnw-row-actions" });
		new ButtonComponent(actions)
			.setIcon("arrow-up")
			.setTooltip(this.t("editor.triggers.tooltips.moveUp"))
			.setDisabled(index === 0)
			.onClick(() => this.moveTrigger(index, -1));
		new ButtonComponent(actions)
			.setIcon("arrow-down")
			.setTooltip(this.t("editor.triggers.tooltips.moveDown"))
			.setDisabled(index >= this.draft.triggers.length - 1)
			.onClick(() => this.moveTrigger(index, 1));
		new ButtonComponent(actions)
			.setIcon("trash")
			.setTooltip(this.t("editor.triggers.tooltips.delete"))
			.setDisabled(this.draft.triggers.length <= 1)
			.onClick(() => {
				this.draft.triggers.splice(index, 1);
				this.openTriggerIds.delete(trigger.id);
				this.render();
			});

		if (!isOpen) return;

		card.createDiv({ cls: "tnw-card-description", text: this.triggerTypeDescription(trigger.type) });

		const grid = card.createDiv({ cls: "tnw-form-grid" });
		const typeSelect = renderSelectInput(
			grid,
			this.t("editor.triggers.typeLabel"),
			this.triggerTypeOptions(),
			trigger.type
		);

		const advanced = this.renderAdvancedDetails(
			card,
			this.t("editor.triggers.advancedTitle"),
			this.t("editor.triggers.advancedDescription"),
			`trigger.${trigger.id}`
		);
		const advancedGrid = advanced.createDiv({ cls: "tnw-form-grid" });
		const idInput = renderTextInput(advancedGrid, this.t("editor.triggers.id"), trigger.id);
		let currentTriggerId = trigger.id;
		idInput.addEventListener("input", () => {
			const id = slugifyWorkflowId(idInput.value);
			idInput.value = id;
			this.draft.triggers[index] = { ...this.draft.triggers[index], id };
			this.openTriggerIds.delete(currentTriggerId);
			this.openTriggerIds.add(id);
			currentTriggerId = id;
		});
		this.renderValidation(idInput, `trigger.${index}.id`);

		typeSelect.addEventListener("change", () => {
			const defaultTrigger = createDefaultTrigger(
				typeSelect.value as WorkflowTrigger["type"],
				this.draft.triggers.filter((_, triggerIndex) => triggerIndex !== index)
			);
			const id = slugifyWorkflowId(idInput.value);
			this.draft.triggers[index] = id ? { ...defaultTrigger, id } : defaultTrigger;
			if (id) this.openTriggerIds.add(id);
			this.render();
		});

		const controls: TriggerControls = {
			idInput,
			typeSelect,
		};
		this.renderTriggerSpecificFields(grid, advancedGrid, trigger, controls, index);
		this.renderTriggerOutputs(card, trigger);
		const update = (): void => {
			const next = triggerFromControls({
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
			this.draft.triggers[index] = next;
			if (next.id) this.openTriggerIds.add(next.id);
		};
		for (const input of triggerControlsInputs(controls)) {
			input.addEventListener("change", update);
			if (input instanceof HTMLInputElement && input.type !== "checkbox") input.addEventListener("input", update);
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
		advancedParent: HTMLElement,
		trigger: WorkflowTrigger,
		controls: TriggerControls,
		index: number
	): void {
		if (trigger.type === "manual") {
			parent.createDiv({ cls: "tnw-field-help is-wide", text: this.t("editor.triggers.manualHelp") });
			return;
		}
		if (isTaskNotesEventTrigger(trigger)) {
			controls.eventInput = renderSelectInput(
				parent,
				this.t("editor.triggers.tasknotesEvent"),
				this.tasknotesEventOptions(trigger.event),
				trigger.event
			);
			this.renderValidation(controls.eventInput, `trigger.${index}.event`);
			if (trigger.event === "task.status.changed") {
				controls.fromInput = renderTextInput(parent, this.t("editor.triggers.fromStatus"), stringifyScalar(trigger.from));
				controls.toInput = renderTextInput(parent, this.t("editor.triggers.toStatus"), stringifyScalar(trigger.to));
				this.attachTemplateSuggest(controls.fromInput, trigger);
				this.attachTemplateSuggest(controls.toInput, trigger);
			}
			controls.pathInput = renderTextInput(advancedParent, this.t("editor.triggers.pathGlob"), trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "TaskNotes/**/*.md";
			this.attachTemplateSuggest(controls.pathInput, trigger);
			controls.allowSelfTriggerInput = renderCheckboxInput(advancedParent, this.t("editor.triggers.allowSelfTrigger"), trigger.allowSelfTrigger === true);
			return;
		}
		if (trigger.type === "cron") {
			controls.scheduleInput = renderTextInput(parent, this.t("editor.triggers.schedule"), trigger.schedule);
			controls.scheduleInput.placeholder = "0 9 * * *";
			this.attachTemplateSuggest(controls.scheduleInput, trigger);
			this.renderValidation(controls.scheduleInput, `trigger.${index}.schedule`);
			controls.timezoneInput = renderTextInput(advancedParent, this.t("editor.triggers.timezone"), trigger.timezone ?? "local");
			controls.catchUpInput = renderCheckboxInput(advancedParent, this.t("editor.triggers.catchUp"), trigger.catchUp === true);
			return;
		}
		if (trigger.type === "interval") {
			controls.scheduleInput = renderTextInput(parent, this.t("editor.triggers.every"), trigger.every);
			controls.scheduleInput.setAttribute("placeholder", INTERVAL_PLACEHOLDER);
			this.attachTemplateSuggest(controls.scheduleInput, trigger);
			this.renderValidation(controls.scheduleInput, `trigger.${index}.schedule`);
			return;
		}
		if (trigger.type === "obsidian.vault") {
			controls.eventInput = renderSelectInput(
				parent,
				this.t("editor.triggers.event"),
				[
					["create", this.t("editor.triggers.events.create")],
					["modify", this.t("editor.triggers.events.modify")],
					["delete", this.t("editor.triggers.events.delete")],
					["rename", this.t("editor.triggers.events.rename")],
				],
				trigger.event
			);
			controls.pathInput = renderTextInput(advancedParent, this.t("editor.triggers.pathGlob"), trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "**/*.md";
			this.attachTemplateSuggest(controls.pathInput, trigger);
			return;
		}
		if (trigger.type === "obsidian.metadata") {
			controls.eventInput = renderSelectInput(
				parent,
				this.t("editor.triggers.event"),
				[
					["changed", this.t("editor.triggers.events.changed")],
					["deleted", this.t("editor.triggers.events.deleted")],
					["resolve", this.t("editor.triggers.events.resolve")],
					["resolved", this.t("editor.triggers.events.resolved")],
				],
				trigger.event
			);
			controls.pathInput = renderTextInput(advancedParent, this.t("editor.triggers.pathGlob"), trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "**/*.md";
			this.attachTemplateSuggest(controls.pathInput, trigger);
			return;
		}
		if (trigger.type === "obsidian.workspace") {
			controls.eventInput = renderSelectInput(
				parent,
				this.t("editor.triggers.event"),
				[
					["file-open", this.t("editor.triggers.events.fileOpen")],
					["active-leaf-change", this.t("editor.triggers.events.activeLeafChange")],
					["layout-change", this.t("editor.triggers.events.layoutChange")],
				],
				trigger.event
			);
			controls.pathInput = renderTextInput(advancedParent, this.t("editor.triggers.pathGlob"), trigger.path?.glob ?? "");
			controls.pathInput.placeholder = "**/*.md";
			this.attachTemplateSuggest(controls.pathInput, trigger);
			return;
		}
	}

	private renderTriggerOutputs(parent: HTMLElement, trigger: WorkflowTrigger): void {
		const outputs = this.triggerOutputFields(trigger);
		if (outputs.length === 0) return;
		const details = parent.createEl("details", { cls: "tnw-output-fields tnw-trigger-output-fields" });
		renderDisclosureSummary(details, this.t("editor.triggers.valuesAvailable", { count: outputs.length }));
		for (const output of outputs) {
			const row = details.createDiv({ cls: output.description ? "tnw-output-row" : "tnw-output-row is-compact" });
			row.createSpan({ cls: "tnw-output-key", text: `{{trigger.${output.key}}}` });
			row.createSpan({ cls: "tnw-output-type", text: output.type });
			if (output.description) row.createSpan({ cls: "tnw-output-description", text: output.description });
		}
	}

	private renderSteps(parent: HTMLElement): void {
		const section = createSection(parent, this.t("editor.sections.steps.title"), this.t("editor.sections.steps.body"));
		this.renderSectionValidation(section, "steps");

		for (const [index, step] of this.draft.steps.entries()) {
			this.renderStepCard(section, step, index);
		}

		const addRow = section.createDiv({ cls: "tnw-add-row is-bottom" });
		const addText = addRow.createDiv({ cls: "tnw-add-row-copy" });
		addText.createDiv({ cls: "tnw-add-row-title", text: this.t("editor.steps.addTitle") });
		addText.createDiv({ cls: "tnw-add-row-subtitle", text: this.t("editor.steps.addDescription") });
		const addControls = addRow.createDiv({ cls: "tnw-add-row-controls" });
		const addSelect = this.renderStepTypeSelect(addControls, this.t("editor.steps.type"), "notice.show");
		setButtonIconText(new ButtonComponent(addControls), "plus", this.t("editor.steps.addButton"))
			.setTooltip(this.t("editor.steps.addButton"))
			.onClick(() => {
				const step = createDefaultStep(addSelect.value || "notice.show", new Set(this.draft.steps.map((step) => step.id)));
				this.draft.steps.push(step);
				this.openStepIds.add(step.id);
				this.render();
			});
	}

	private renderStepCard(parent: HTMLElement, step: WorkflowStep, index: number): void {
		const definition = this.plugin.stepRegistry.get(step.type);
		const card = parent.createDiv({ cls: "tnw-edit-card" });
		const isOpen = this.openStepIds.has(step.id);
		card.toggleClass("is-active", isOpen);
		card.toggleClass("has-error", this.hasValidationPrefix(`step.${index}.`));
		const header = card.createDiv({ cls: "tnw-edit-card-header" });
		const summaryButton = header.createEl("button", { cls: "tnw-card-summary-button" });
		summaryButton.setAttr("type", "button");
		summaryButton.setAttr("aria-expanded", String(isOpen));
		summaryButton.addEventListener("click", () => {
			this.toggleStepOpen(step.id);
			this.render();
		});
		const title = summaryButton.createSpan({ cls: "tnw-edit-card-title" });
		title.createSpan({ cls: "tnw-card-row-chevron" });
		title.createSpan({ cls: "tnw-step-index", text: String(index + 1) });
		const copy = title.createSpan({ cls: "tnw-card-summary-copy" });
		copy.createSpan({ cls: "tnw-card-summary-title", text: summarizeStep(step, definition) });
		copy.createSpan({ cls: "tnw-card-path", text: this.stepSummaryDetail(step, definition) });
		if (definition?.mutatesTasks || definition?.writesVault) title.createSpan({ cls: "tnw-chip is-warning", text: this.t("editor.steps.writes") });
		if (this.hasValidationPrefix(`step.${index}.`)) title.createSpan({ cls: "tnw-chip is-invalid", text: this.t("editor.steps.needsAttention") });
		const actions = header.createDiv({ cls: "tnw-row-actions" });
		new ButtonComponent(actions)
			.setIcon("arrow-up")
			.setTooltip(this.t("editor.steps.tooltips.moveUp"))
			.setDisabled(index === 0)
			.onClick(() => this.moveStep(index, -1));
		new ButtonComponent(actions)
			.setIcon("arrow-down")
			.setTooltip(this.t("editor.steps.tooltips.moveDown"))
			.setDisabled(index >= this.draft.steps.length - 1)
			.onClick(() => this.moveStep(index, 1));
		new ButtonComponent(actions)
			.setIcon("trash")
			.setTooltip(this.t("editor.steps.tooltips.delete"))
			.setDisabled(this.draft.steps.length <= 1)
			.onClick(() => {
				this.draft.steps.splice(index, 1);
				this.openStepIds.delete(step.id);
				this.render();
			});

		if (!isOpen) return;

		if (definition) {
			card.createDiv({ cls: "tnw-card-description", text: definition.description });
		}

		const grid = card.createDiv({ cls: "tnw-form-grid" });
		const typeSelect = this.renderStepTypeSelect(grid, this.t("editor.steps.type"), step.type);
		typeSelect.addEventListener("change", () => {
			const type = typeSelect.value;
			this.draft.steps[index] = {
				id: this.draft.steps[index].id,
				type,
				input: defaultInputForStep(type),
			};
			this.render();
		});

		const advanced = this.renderAdvancedDetails(
			card,
			this.t("editor.steps.advancedTitle"),
			this.t("editor.steps.advancedDescription"),
			`step.${step.id}`
		);
		const advancedGrid = advanced.createDiv({ cls: "tnw-form-grid" });
		const idInput = renderTextInput(advancedGrid, this.t("editor.steps.id"), step.id);
		let currentStepId = step.id;
		idInput.addEventListener("input", () => {
			const id = slugifyWorkflowId(idInput.value);
			idInput.value = id;
			this.draft.steps[index].id = id;
			this.openStepIds.delete(currentStepId);
			this.openStepIds.add(id);
			currentStepId = id;
		});
		this.renderValidation(idInput, `step.${index}.id`);

		if (definition?.supportsForEach !== false) {
			const forEach = renderTextInput(advancedGrid, this.t("editor.steps.forEach"), step.forEach ?? "");
			forEach.placeholder = "{{steps.query.tasks}}";
			this.attachTemplateSuggest(forEach);
			forEach.addEventListener("change", () => {
				this.draft.steps[index].forEach = forEach.value.trim() || undefined;
			});
			forEach.parentElement?.createDiv({
				cls: "tnw-field-help",
				text: this.t("editor.steps.forEachHelp"),
			});
		}

		this.renderStepInputFields(grid, step, index, definition);
		this.renderStepOutputs(card, step, definition);
	}

	private renderStepInputFields(
		parent: HTMLElement,
		step: WorkflowStep,
		stepIndex: number,
		definition: StepDefinition | undefined
	): void {
		const fields = definition?.inputFields ?? [];
		if (fields.length === 0) {
			const area = renderTextareaInput(parent, this.t("editor.steps.inputJson"), JSON.stringify(step.input ?? {}, null, 2), true, true);
			this.attachTemplateSuggest(area);
			area.addEventListener("change", () => {
				const parsed = parseObjectJson(area.value);
				if (parsed.error) {
					new Notice(parsed.error === "json-object" ? this.t("editor.validation.jsonObject") : parsed.error);
					return;
				}
				step.input = parsed.value;
			});
			return;
		}

		for (const field of fields) {
			this.renderStepInputField(parent, step, stepIndex, field);
		}
	}

	private renderStepInputField(parent: HTMLElement, step: WorkflowStep, stepIndex: number, field: WorkflowInputField): void {
		if (!step.input) step.input = {};
		const inputRecord = step.input;
		const current = getPath(inputRecord, field.key) ?? field.defaultValue ?? "";
		const validationPath = `step.${stepIndex}.input.${field.key}`;
		const options = field.options ?? this.dynamicOptions(field.optionsFrom);
		if (field.type === "boolean") {
			const wrapper = parent.createEl("label", { cls: "tnw-field is-inline" });
			wrapper.createSpan({ cls: "tnw-field-label", text: field.label });
			const input = wrapper.createEl("input", { type: "checkbox" });
			input.checked = current === true;
			input.addEventListener("change", () => setPath(inputRecord, field.key, input.checked));
			this.renderFieldHelp(wrapper, field);
			this.renderValidation(input, validationPath);
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
			this.renderValidation(select, validationPath);
			return;
		}
		if (field.type === "json") {
			const area = renderTextareaInput(parent, field.label, JSON.stringify(current || {}, null, 2), true, true);
			this.attachTemplateSuggest(area);
			area.addEventListener("change", () => {
				const parsed = parseObjectJson(area.value);
				if (parsed.error) {
					new Notice(parsed.error === "json-object" ? this.t("editor.validation.jsonObject") : parsed.error);
					return;
				}
				setPath(inputRecord, field.key, parsed.value ?? {});
			});
			this.renderFieldHelp(area.parentElement, field);
			this.renderValidation(area, validationPath);
			return;
		}
		if (field.type === "taskQuery") {
			this.renderTaskQueryInput(parent, inputRecord, field, validationPath);
			return;
		}
		const input =
			field.type === "textarea"
				? renderTextareaInput(parent, field.label, stringifyScalar(current), field.wide !== false)
				: renderTextInput(parent, field.label, stringifyScalar(current), inputTypeForField(field));
		if (field.placeholder) input.placeholder = field.placeholder;
		this.attachTemplateSuggest(input);
		input.addEventListener("change", () => {
			const next = coerceInputValue(input.value, field);
			setOrDeletePath(inputRecord, field.key, next);
		});
		input.addEventListener("input", () => {
			const next = coerceInputValue(input.value, field);
			setOrDeletePath(inputRecord, field.key, next);
		});
		this.renderFieldHelp(input.parentElement, field);
		this.renderValidation(input, validationPath);
	}

	private renderTaskQueryInput(
		parent: HTMLElement,
		inputRecord: Record<string, unknown>,
		field: WorkflowInputField,
		validationPath: string
	): void {
		const query = taskQueryFromValue(getPath(inputRecord, field.key) ?? field.defaultValue);
		setPath(inputRecord, field.key, query);

		const properties = this.plugin.tasknotesFilterProperties();
		const operators = this.plugin.tasknotesFilterOperators();
		const wrapper = parent.createDiv({ cls: "tnw-query-builder tnw-field is-wide" });
		const header = wrapper.createDiv({ cls: "tnw-query-header" });
		const copy = header.createDiv({ cls: "tnw-query-copy" });
		copy.createDiv({ cls: "tnw-field-label", text: field.label });
		if (field.description) copy.createDiv({ cls: "tnw-field-help", text: field.description });
		const actions = header.createDiv({ cls: "tnw-query-actions" });
		setButtonIconText(new ButtonComponent(actions), "search", this.t("editor.query.preview"))
			.setTooltip(this.t("editor.query.preview"))
			.onClick(() => {
				void this.previewTaskQuery(query);
			});

		this.renderTaskQueryRuntimeValidation(wrapper, query);
		this.renderValidation(wrapper, validationPath);

		if (properties.length === 0 || operators.length === 0) {
			wrapper.createDiv({
				cls: "tnw-query-empty",
				text: this.t("editor.query.runtimeUnavailable"),
			});
			this.renderTaskQueryJson(wrapper, inputRecord, field.key, query);
			return;
		}

		const simple = simpleTaskQuery(query.where);
		if (!simple) {
			wrapper.createDiv({
				cls: "tnw-query-empty",
				text: this.t("editor.query.advancedOnly"),
			});
			this.renderTaskQueryJson(wrapper, inputRecord, field.key, query);
			return;
		}

		this.renderTaskQueryConditions(wrapper, inputRecord, field.key, query, simple, properties, operators);
		this.renderTaskQueryOptions(wrapper, inputRecord, field.key, query, properties);
		this.renderTaskQueryJson(wrapper, inputRecord, field.key, query);
	}

	private renderTaskQueryConditions(
		parent: HTMLElement,
		inputRecord: Record<string, unknown>,
		path: string,
		query: TaskNotesRuntimeTaskQuery,
		simple: SimpleTaskQuery,
		properties: TaskNotesRuntimeFilterPropertyDefinition[],
		operators: TaskNotesRuntimeFilterOperatorDefinition[]
	): void {
		const section = parent.createDiv({ cls: "tnw-query-section" });
		const toolbar = section.createDiv({ cls: "tnw-query-toolbar" });
		const modeSelect = renderSelectInput(
			toolbar,
			this.t("editor.query.match"),
			[
				["all", this.t("editor.query.matchAll")],
				["any", this.t("editor.query.matchAny")],
			],
			simple.mode
		);
		modeSelect.addEventListener("change", () => {
			simple.mode = modeSelect.value === "any" ? "any" : "all";
			writeSimpleTaskQuery(inputRecord, path, query, simple);
		});
		setButtonIconText(new ButtonComponent(toolbar), "plus", this.t("editor.query.addCondition"))
			.setTooltip(this.t("editor.query.addCondition"))
			.onClick(() => {
				simple.conditions.push(defaultQueryCondition(properties));
				writeSimpleTaskQuery(inputRecord, path, query, simple);
				this.render();
			});

		if (simple.conditions.length === 0) {
			section.createDiv({ cls: "tnw-query-empty", text: this.t("editor.query.noConditions") });
		}

		for (const [index, condition] of simple.conditions.entries()) {
			const row = section.createDiv({ cls: "tnw-query-condition" });
			const property = propertyForCondition(properties, condition);
			const fieldSelect = renderSelectInput(
				row,
				this.t("editor.query.field"),
				queryPropertyOptions(properties, condition.field),
				condition.field
			);
			fieldSelect.addEventListener("change", () => {
				condition.field = fieldSelect.value;
				const nextProperty = propertyForCondition(properties, condition);
				condition.op = firstSupportedOperator(nextProperty, operators);
				setDefaultConditionValue(condition, nextProperty, operatorById(operators, condition.op));
				writeSimpleTaskQuery(inputRecord, path, query, simple);
				this.render();
			});

			const operator = operatorById(operators, condition.op);
			const operatorSelect = renderSelectInput(
				row,
				this.t("editor.query.operator"),
				queryOperatorOptions(property, operators, condition.op),
				condition.op
			);
			operatorSelect.addEventListener("change", () => {
				condition.op = operatorSelect.value;
				setDefaultConditionValue(condition, property, operatorById(operators, condition.op));
				writeSimpleTaskQuery(inputRecord, path, query, simple);
				this.render();
			});

			this.renderTaskQueryValueInput(row, condition, property, operator, () => {
				writeSimpleTaskQuery(inputRecord, path, query, simple);
			});

			const rowActions = row.createDiv({ cls: "tnw-row-actions tnw-query-row-actions" });
			new ButtonComponent(rowActions)
				.setIcon("trash")
				.setTooltip(this.t("editor.query.removeCondition"))
				.onClick(() => {
					simple.conditions.splice(index, 1);
					writeSimpleTaskQuery(inputRecord, path, query, simple);
					this.render();
				});
		}
	}

	private renderTaskQueryValueInput(
		parent: HTMLElement,
		condition: TaskNotesRuntimeCondition,
		property: TaskNotesRuntimeFilterPropertyDefinition | undefined,
		operator: TaskNotesRuntimeFilterOperatorDefinition | undefined,
		onChange: () => void
	): void {
		if (!operatorValueRequired(operator, condition.op)) {
			delete condition.value;
			parent.createDiv({
				cls: "tnw-query-value-placeholder",
				text: this.t("editor.query.noValue"),
			});
			return;
		}

		if (property?.valueType === "boolean") {
			const select = renderSelectInput(
				parent,
				this.t("editor.query.value"),
				[
					["true", this.t("editor.query.true")],
					["false", this.t("editor.query.false")],
				],
				condition.value === false ? "false" : "true"
			);
			select.addEventListener("change", () => {
				condition.value = select.value === "true";
				onChange();
			});
			return;
		}

		const input = renderTextInput(
			parent,
			this.t("editor.query.value"),
			stringifyQueryValue(condition.value),
			inputTypeForQueryValue(property)
		);
		input.placeholder = valuePlaceholder(property, condition.op);
		this.attachTemplateSuggest(input);
		this.attachQueryValueSuggestions(input, property);
		const update = (): void => {
			condition.value = parseQueryValueInput(input.value, property, condition.op);
			onChange();
		};
		input.addEventListener("change", update);
		input.addEventListener("input", update);
	}

	private renderTaskQueryOptions(
		parent: HTMLElement,
		inputRecord: Record<string, unknown>,
		path: string,
		query: TaskNotesRuntimeTaskQuery,
		properties: TaskNotesRuntimeFilterPropertyDefinition[]
	): void {
		const details = parent.createEl("details", { cls: "tnw-query-options" });
		details.open = true;
		renderDisclosureSummary(details, this.t("editor.query.options"), this.t("editor.query.optionsDescription"));
		const grid = details.createDiv({ cls: "tnw-query-options-grid" });

		const sort = query.sort?.[0];
		const sortField = renderSelectInput(
			grid,
			this.t("editor.query.sortField"),
			[["", this.t("editor.query.none")], ...queryPropertyOptions(properties.filter((property) => property.sortable), sort?.field)],
			sort?.field ?? ""
		);
		sortField.addEventListener("change", () => {
			if (sortField.value) {
				query.sort = [{ field: sortField.value, direction: sortDirection(query) }];
			} else {
				delete query.sort;
			}
			setPath(inputRecord, path, query);
			this.render();
		});

		const direction = renderSelectInput(
			grid,
			this.t("editor.query.sortDirection"),
			[
				["asc", this.t("editor.query.ascending")],
				["desc", this.t("editor.query.descending")],
			],
			sortDirection(query)
		);
		direction.disabled = !sortField.value;
		direction.addEventListener("change", () => {
			if (query.sort?.[0]) query.sort[0].direction = direction.value === "desc" ? "desc" : "asc";
			setPath(inputRecord, path, query);
		});

		const group = query.group?.[0];
		const groupField = renderSelectInput(
			grid,
			this.t("editor.query.groupField"),
			[["", this.t("editor.query.none")], ...queryPropertyOptions(properties.filter((property) => property.groupable), group?.field)],
			group?.field ?? ""
		);
		groupField.addEventListener("change", () => {
			if (groupField.value) {
				query.group = [{ field: groupField.value }];
			} else {
				delete query.group;
			}
			setPath(inputRecord, path, query);
		});

		const limit = renderTextInput(grid, this.t("editor.query.limit"), query.limit ? String(query.limit) : "", "number");
		limit.placeholder = "25";
		limit.addEventListener("change", () => {
			const value = Number(limit.value);
			if (Number.isFinite(value) && value > 0) {
				query.limit = Math.floor(value);
			} else {
				delete query.limit;
			}
			setPath(inputRecord, path, query);
		});

		const includeArchived = renderCheckboxInput(
			grid,
			this.t("editor.query.includeArchived"),
			query.scope?.includeArchived === true
		);
		includeArchived.addEventListener("change", () => {
			if (includeArchived.checked) {
				query.scope = { ...(query.scope ?? {}), includeArchived: true };
			} else if (query.scope) {
				delete query.scope.includeArchived;
				if (Object.keys(query.scope).length === 0) delete query.scope;
			}
			setPath(inputRecord, path, query);
		});
	}

	private renderTaskQueryJson(
		parent: HTMLElement,
		inputRecord: Record<string, unknown>,
		path: string,
		query: TaskNotesRuntimeTaskQuery
	): void {
		const advanced = parent.createEl("details", { cls: "tnw-query-json tnw-advanced" });
		renderDisclosureSummary(advanced, this.t("editor.query.jsonTitle"), this.t("editor.query.jsonDescription"));
		const body = advanced.createDiv({ cls: "tnw-advanced-body" });
		const area = renderTextareaInput(body, this.t("editor.query.jsonLabel"), JSON.stringify(query, null, 2), true, true);
		this.attachTemplateSuggest(area);
		area.addEventListener("change", () => {
			const parsed = parseObjectJson(area.value);
			if (parsed.error) {
				new Notice(parsed.error === "json-object" ? this.t("editor.validation.jsonObject") : parsed.error);
				return;
			}
			setPath(inputRecord, path, taskQueryFromValue(parsed.value));
			this.render();
		});
	}

	private renderTaskQueryRuntimeValidation(parent: HTMLElement, query: TaskNotesRuntimeTaskQuery): void {
		let validation;
		try {
			validation = this.plugin.tasknotesValidateQuery(query);
		} catch (error) {
			parent.createDiv({ cls: "tnw-query-validation is-error", text: error instanceof Error ? error.message : String(error) });
			return;
		}
		if (!validation) return;
		if (validation.valid && validation.warnings.length === 0) {
			parent.createDiv({ cls: "tnw-query-validation is-valid", text: this.t("editor.query.valid") });
			return;
		}
		const box = parent.createDiv({ cls: validation.valid ? "tnw-query-validation is-warning" : "tnw-query-validation is-error" });
		for (const issue of validation.issues) {
			box.createDiv({ text: `${issue.path}: ${issue.message}` });
		}
		for (const warning of validation.warnings) {
			box.createDiv({ text: `${warning.path}: ${warning.message}` });
		}
	}

	private async previewTaskQuery(query: TaskNotesRuntimeTaskQuery): Promise<void> {
		try {
			const result = await this.plugin.tasknotesExplainQuery(query);
			if (!result) {
				new Notice(this.t("editor.query.previewUnavailable"));
				return;
			}
			if (!result.valid) {
				new Notice(result.issues[0]?.message ?? this.t("editor.query.invalid"));
				return;
			}
			new Notice(this.t("editor.query.previewResult", {
				matched: result.matched ?? 0,
				returned: result.returned ?? 0,
				total: result.total ?? 0,
			}));
		} catch (error) {
			new Notice(error instanceof Error ? error.message : String(error));
		}
	}

	private attachQueryValueSuggestions(
		input: HTMLInputElement,
		property: TaskNotesRuntimeFilterPropertyDefinition | undefined
	): void {
		const options = queryValueOptions(this.plugin, property);
		if (options.length === 0) return;
		const id = `tnw-query-values-${Math.random().toString(36).slice(2)}`;
		input.setAttr("list", id);
		const list = input.parentElement?.createEl("datalist");
		if (!list) return;
		list.id = id;
		for (const option of options) {
			list.createEl("option", { value: option.value, text: option.label });
		}
	}

	private renderStepOutputs(parent: HTMLElement, step: WorkflowStep, definition: StepDefinition | undefined): void {
		if (!definition || definition.outputFields.length === 0) return;
		const details = parent.createEl("details", { cls: "tnw-output-fields" });
		renderDisclosureSummary(details, this.t("editor.steps.outputsAvailable", { count: definition.outputFields.length }));
		for (const output of definition.outputFields) {
			const row = details.createDiv({ cls: output.description ? "tnw-output-row" : "tnw-output-row is-compact" });
			row.createSpan({ cls: "tnw-output-key", text: `{{steps.${step.id}.${output.key}}}` });
			row.createSpan({ cls: "tnw-output-type", text: output.type });
			if (output.description) row.createSpan({ cls: "tnw-output-description", text: output.description });
		}
	}

	private renderFieldHelp(parent: HTMLElement | null, field: WorkflowInputField): void {
		if (!parent || !field.description) return;
		parent.createDiv({ cls: "tnw-field-help", text: field.description });
	}

	private renderRunPolicy(parent: HTMLElement): void {
		const section = createSection(parent, this.t("editor.sections.run.title"), this.t("editor.sections.run.body"));
		const grid = section.createDiv({ cls: "tnw-form-grid" });

		const noOverlapLabel = grid.createEl("label", { cls: "tnw-field is-inline" });
		noOverlapLabel.createSpan({ cls: "tnw-field-label", text: this.t("editor.runPolicy.noOverlap") });
		const noOverlap = noOverlapLabel.createEl("input", { type: "checkbox" });
		noOverlap.checked = this.draft.run.noOverlap;
		noOverlap.addEventListener("change", () => {
			this.draft.run.noOverlap = noOverlap.checked;
		});

		const onError = renderSelectInput(
			grid,
			this.t("editor.runPolicy.onError"),
			[["stop", this.t("common.stop")], ["continue", this.t("common.continue")]],
			this.draft.run.onError
		);
		onError.addEventListener("change", () => {
			this.draft.run.onError = onError.value === "continue" ? "continue" : "stop";
		});

		const advanced = this.renderAdvancedDetails(
			section,
			this.t("editor.runPolicy.advancedTitle"),
			this.t("editor.runPolicy.advancedDescription"),
			"run"
		);
		const advancedGrid = advanced.createDiv({ cls: "tnw-form-grid" });

		const maxTasks = renderTextInput(advancedGrid, this.t("editor.runPolicy.maxTasks"), String(this.draft.run.maxTasks), "number");
		maxTasks.addEventListener("change", () => {
			const value = Number(maxTasks.value);
			if (Number.isFinite(value) && value > 0) this.draft.run.maxTasks = Math.floor(value);
		});
		this.renderValidation(maxTasks, "run.maxTasks");

		const source = renderTextInput(advancedGrid, this.t("editor.runPolicy.source"), this.draft.run.source);
		source.addEventListener("change", () => {
			this.draft.run.source = source.value.trim() || "tasknotes-workflows";
		});
		this.attachTemplateSuggest(source);
	}

	private renderFooter(): void {
		const footer = this.modalEl.createDiv({ cls: "tnw-modal-footer" });
		footer.createDiv({
			cls: "tnw-modal-footer-status",
			text: this.isDirty() ? this.t("common.unsavedChanges") : this.t("common.saved"),
		});
		const actions = footer.createDiv({ cls: "tnw-modal-footer-actions" });
		if (this.existingPath) {
			setButtonIconText(new ButtonComponent(actions), "file-text", this.t("editor.footer.openNote"))
				.onClick(() => {
					if (
						this.isDirty() &&
						!this.confirmDiscardWithNotice(this.t("notices.discardAndOpenNote"))
					) {
						return;
					}
					if (this.loaded?.file) void this.plugin.openWorkflowFile(this.loaded.file);
					this.closeWithoutPrompt();
				});
		}
		setButtonIconText(new ButtonComponent(actions), "x", this.t("common.cancel"))
			.onClick(() => this.close());
		setButtonIconText(new ButtonComponent(actions), "save", this.t("common.save"))
			.setCta()
			.onClick(() => {
				void this.save();
			});
	}

	private async save(): Promise<void> {
		const validation = this.validate();
		if (validation) {
			this.render();
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
		new Notice(this.t("notices.workflowSaved", { name: this.draft.name }));
		this.closeWithoutPrompt();
	}

	private validate(): string | null {
		this.draft.name = this.draft.name.trim();
		this.draft.id = slugifyWorkflowId(this.draft.id);
		const validation = this.collectValidation();
		this.validationMessages = validation.issues;
		return validation.firstMessage;
	}

	private closeWithoutPrompt(): void {
		this.skipUnsavedPrompt = true;
		super.close();
	}

	private confirmDiscardWithNotice(message: string): boolean {
		if (this.discardWarningArmed) return true;
		this.discardWarningArmed = true;
		new Notice(message);
		return false;
	}

	private isDirty(): boolean {
		return serializeWorkflowDraft(this.draft) !== this.initialSerialized;
	}

	private pruneOpenItems(): void {
		const triggerIds = new Set(this.draft.triggers.map((trigger) => trigger.id));
		for (const id of this.openTriggerIds) {
			if (!triggerIds.has(id)) this.openTriggerIds.delete(id);
		}
		const stepIds = new Set(this.draft.steps.map((step) => step.id));
		for (const id of this.openStepIds) {
			if (!stepIds.has(id)) this.openStepIds.delete(id);
		}
	}

	private toggleTriggerOpen(id: string): void {
		if (this.openTriggerIds.has(id)) {
			this.openTriggerIds.delete(id);
		} else {
			this.openTriggerIds.add(id);
		}
	}

	private toggleStepOpen(id: string): void {
		if (this.openStepIds.has(id)) {
			this.openStepIds.delete(id);
		} else {
			this.openStepIds.add(id);
		}
	}

	private renderAdvancedDetails(
		parent: HTMLElement,
		title: string,
		description: string,
		key: string
	): HTMLElement {
		const details = parent.createEl("details", { cls: "tnw-advanced" });
		details.open = this.advancedOpen.has(key);
		details.addEventListener("toggle", () => {
			if (details.open) {
				this.advancedOpen.add(key);
			} else {
				this.advancedOpen.delete(key);
			}
		});
		const summary = renderDisclosureSummary(details, title, description);
		summary.addClass("tnw-advanced-summary");
		return details.createDiv({ cls: "tnw-advanced-body" });
	}

	private templateOptions(trigger?: WorkflowTrigger): TemplateOption[] {
		const options: TemplateOption[] = [
			{ value: "{{workflow.id}}", label: this.t("editor.templateSuggestions.workflowId") },
			{ value: "{{workflow.name}}", label: this.t("editor.templateSuggestions.workflowName") },
			{ value: "{{today}}", label: this.t("editor.templateSuggestions.today") },
			{ value: "{{now}}", label: this.t("editor.templateSuggestions.now") },
			{ value: "{{item.path}}", label: this.t("editor.templateSuggestions.itemPath") },
		];
		const activeTrigger =
			trigger ??
			this.draft.triggers.find((item) => this.openTriggerIds.has(item.id)) ??
			this.draft.triggers[0];
		if (activeTrigger) {
			for (const output of this.triggerOutputFields(activeTrigger)) {
				options.push({
					value: `{{trigger.${output.key}}}`,
					label: this.t("editor.templateSuggestions.triggerValue", { label: output.label || output.key }),
				});
			}
		}
		for (const step of this.draft.steps) {
			const definition = this.plugin.stepRegistry.get(step.type);
			if (!definition) continue;
			for (const output of definition.outputFields) {
				options.push({
					value: `{{steps.${step.id}.${output.key}}}`,
					label: this.t("editor.templateSuggestions.stepValue", {
						stepId: step.id,
						label: output.label || output.key,
					}),
				});
			}
		}
		return dedupeTemplateOptions(options);
	}

	private attachTemplateSuggest(input: HTMLInputElement | HTMLTextAreaElement, trigger?: WorkflowTrigger): void {
		new TemplateValueSuggest(this.app, input, () => this.templateOptions(trigger));
	}

	private renderSectionValidation(parent: HTMLElement, path: string): void {
		const message = this.validationMessages.get(path);
		if (!message) return;
		parent.createDiv({ cls: "tnw-section-warning", text: message });
	}

	private renderValidation(input: HTMLElement, path: string): void {
		const message = this.validationMessages.get(path);
		if (!message) return;
		input.addClass("is-invalid");
		input.setAttr("aria-invalid", "true");
		const wrapper = input.closest(".tnw-field");
		(wrapper ?? input.parentElement)?.createDiv({ cls: "tnw-field-error", text: message });
	}

	private collectValidation(): ValidationResult {
		const issues = new Map<string, string>();
		const add = (path: string, message: string): void => {
			if (!issues.has(path)) issues.set(path, message);
		};

		if (!this.draft.name.trim()) add("definition.name", this.t("editor.validation.nameRequired"));
		if (!isValidWorkflowId(this.draft.id)) {
			add("definition.id", this.t("editor.validation.invalidWorkflowId"));
		}
		const duplicate = this.plugin.workflows.find(
			(workflow) => workflow.workflow?.id === this.draft.id && workflow.file.path !== this.existingPath
		);
		if (duplicate) add("definition.id", this.t("editor.validation.duplicateWorkflowId", { path: duplicate.file.path }));

		if (this.draft.triggers.length === 0) add("triggers", this.t("editor.validation.triggerRequired"));
		const triggerIds = new Set<string>();
		for (const [index, trigger] of this.draft.triggers.entries()) {
			if (!isValidWorkflowId(trigger.id)) add(`trigger.${index}.id`, this.t("editor.validation.invalidTriggerId"));
			if (triggerIds.has(trigger.id)) add(`trigger.${index}.id`, this.t("editor.validation.duplicateTriggerId"));
			triggerIds.add(trigger.id);
			if (isTaskNotesEventTrigger(trigger) && !trigger.event.trim()) add(`trigger.${index}.event`, this.t("editor.validation.tasknotesEventRequired"));
			if (trigger.type === "cron" && !trigger.schedule.trim()) add(`trigger.${index}.schedule`, this.t("editor.validation.cronScheduleRequired"));
			if (trigger.type === "interval" && !trigger.every.trim()) add(`trigger.${index}.schedule`, this.t("editor.validation.intervalRequired"));
		}

		if (this.draft.steps.length === 0) add("steps", this.t("editor.validation.stepRequired"));
		const stepIds = new Set<string>();
		for (const [index, step] of this.draft.steps.entries()) {
			if (!isValidWorkflowId(step.id)) add(`step.${index}.id`, this.t("editor.validation.invalidStepId"));
			if (stepIds.has(step.id)) add(`step.${index}.id`, this.t("editor.validation.duplicateStepId"));
			stepIds.add(step.id);
			const definition = this.plugin.stepRegistry.get(step.type);
			if (!definition) {
				add(`step.${index}.type`, this.t("editor.validation.unknownStepType", { type: step.type }));
				continue;
			}
			for (const field of definition.inputFields) {
				const value = getPath(step.input ?? {}, field.key) ?? field.defaultValue;
				if (field.required && isEmptyRequiredValue(value)) {
					add(`step.${index}.input.${field.key}`, this.t("editor.validation.fieldRequired", { field: field.label }));
				}
			}
		}

		if (!Number.isFinite(this.draft.run.maxTasks) || this.draft.run.maxTasks <= 0) {
			add("run.maxTasks", this.t("editor.validation.positiveNumber"));
		}
		return {
			issues,
			firstMessage: issues.values().next().value ?? null,
		};
	}

	private hasValidationPrefix(prefix: string): boolean {
		for (const key of this.validationMessages.keys()) {
			if (key.startsWith(prefix)) return true;
		}
		return false;
	}

	private sectionHasValidation(section: WorkflowEditorSection): boolean {
		if (section === "definition") return this.hasValidationPrefix("definition.");
		if (section === "triggers") return this.validationMessages.has("triggers") || this.hasValidationPrefix("trigger.");
		if (section === "steps") return this.validationMessages.has("steps") || this.hasValidationPrefix("step.");
		return this.hasValidationPrefix("run.");
	}

	private sectionMeta(section: WorkflowEditorSection): string {
		if (section === "definition") return "";
		if (section === "triggers") return `${this.draft.triggers.length}`;
		if (section === "steps") return `${this.draft.steps.length}`;
		return this.draft.run.noOverlap ? this.t("workflowCard.labels.noOverlap") : this.t("editor.summary.overlapAllowed");
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

	private renderStepTypeSelect(parent: HTMLElement, label: string, value: string): HTMLSelectElement {
		const wrapper = parent.createEl("label", { cls: "tnw-field" });
		if (label) wrapper.createSpan({ cls: "tnw-field-label", text: label });
		const select = wrapper.createEl("select", { cls: "tnw-select tnw-step-select" });
		for (const group of this.groupedStepOptions()) {
			const groupEl = select.createEl("optgroup");
			groupEl.label = group.category;
			for (const step of group.steps) {
				const option = groupEl.createEl("option", {
					text: `${step.label} (${step.type})`,
					value: step.type,
				});
				option.selected = step.type === value;
			}
		}
		return select;
	}

	private groupedStepOptions(): StepOptionGroup[] {
		const groups = new Map<string, StepDefinition[]>();
		for (const step of this.plugin.stepRegistry.list()) {
			const category = step.category || this.t("editor.steps.unknownCategory");
			const existing = groups.get(category) ?? [];
			existing.push(step);
			groups.set(category, existing);
		}
		return Array.from(groups.entries())
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([category, steps]) => ({
				category,
				steps: steps.sort((left, right) => left.label.localeCompare(right.label)),
			}));
	}

	private tasknotesEventOptions(selectedEvent?: string): Array<[string, string]> {
		const runtimeEvents = this.plugin.tasknotesEventDefinitions();
		const events = runtimeEvents.length > 0 ? runtimeEvents : DEFAULT_TASKNOTES_EVENTS;
		const options = events.map((event): [string, string] => [
			event.name,
			`${this.tasknotesEventLabel(event.name, event.label)} (${event.name})`,
		]);
		if (selectedEvent && !options.some(([value]) => value === selectedEvent)) {
			options.unshift([selectedEvent, selectedEvent]);
		}
		return options;
	}

	private dynamicOptions(source: WorkflowDynamicFieldOptions | undefined): WorkflowFieldOption[] {
		return this.plugin.tasknotesDynamicOptions(source);
	}

	private triggerTypeOptions(): Array<[WorkflowTrigger["type"], string]> {
		return TRIGGER_TYPES.map((type) => [type, this.triggerTypeLabel(type)]);
	}

	private triggerTypeLabel(type: WorkflowTrigger["type"]): string {
		const key = TRIGGER_TYPE_KEYS[type];
		return this.t(`editor.triggers.types.${key}.label`);
	}

	private triggerTypeDescription(type: WorkflowTrigger["type"]): string {
		const key = TRIGGER_TYPE_KEYS[type];
		return this.t(`editor.triggers.types.${key}.description`);
	}

	private tasknotesEventLabel(eventName: string, fallback?: string): string {
		const key = `editor.triggers.tasknotesEvents.${eventName}`;
		const translated = this.t(key);
		return translated === key ? fallback ?? eventName : translated;
	}

	private summarizeTrigger(trigger: WorkflowTrigger): string {
		if (isTaskNotesEventTrigger(trigger)) {
			if (trigger.event === "task.status.changed" && (trigger.from || trigger.to)) {
				if (trigger.from && trigger.to) {
					return this.t("editor.triggers.summary.statusFromTo", {
						from: stringifyScalar(trigger.from),
						to: stringifyScalar(trigger.to),
					});
				}
				if (trigger.to) {
					return this.t("editor.triggers.summary.statusTo", { to: stringifyScalar(trigger.to) });
				}
				return this.t("editor.triggers.summary.statusFrom", { from: stringifyScalar(trigger.from) });
			}
			return this.tasknotesEventLabel(trigger.event);
		}
		if (trigger.type === "cron") return this.t("editor.triggers.summary.schedule", { schedule: trigger.schedule });
		if (trigger.type === "interval") return this.t("editor.triggers.summary.every", { every: trigger.every });
		if (trigger.type === "obsidian.vault") return this.t("editor.triggers.summary.vaultFile", { event: trigger.event });
		if (trigger.type === "obsidian.metadata") return this.t("editor.triggers.summary.metadata", { event: trigger.event });
		if (trigger.type === "obsidian.workspace") return this.t("editor.triggers.summary.workspace", { event: trigger.event });
		return this.t("editor.triggers.summary.manual");
	}

	private triggerSummaryDetail(trigger: WorkflowTrigger): string {
		const parts = [trigger.id, this.triggerTypeLabel(trigger.type)];
		const path = triggerPathGlobValue(trigger);
		if (path) parts.push(path);
		return parts.join(" / ");
	}

	private stepSummaryDetail(step: WorkflowStep, definition: StepDefinition | undefined): string {
		const parts = [step.id, definition?.category ?? step.type];
		if (step.forEach) parts.push(this.t("editor.steps.summary.forEach", { value: step.forEach }));
		return parts.join(" / ");
	}

	private triggerOutputFields(trigger: WorkflowTrigger): WorkflowOutputField[] {
		const output = (key: string, type: string): WorkflowOutputField => ({
			key,
			type,
			label: this.t(`editor.triggers.outputs.${key}.label`),
			description: this.t(`editor.triggers.outputs.${key}.description`),
		});
		const common = [
			output("type", "string"),
			output("id", "string"),
			output("event", "string"),
			output("actualAt", "datetime"),
		];
		if (isTaskNotesEventTrigger(trigger)) {
			return [
				...common,
				output("after.path", "string"),
				output("after.title", "string"),
				output("after.status", "string"),
				output("before.status", "string"),
				output("changes", "object"),
				output("source", "string"),
				output("correlationId", "string"),
			];
		}
		if (trigger.type === "cron" || trigger.type === "interval") {
			return [...common, output("scheduledAt", "datetime")];
		}
		if (
			trigger.type === "obsidian.vault" ||
			trigger.type === "obsidian.metadata" ||
			trigger.type === "obsidian.workspace"
		) {
			return [
				...common,
				output("path", "string"),
				output("file.path", "string"),
				output("file.name", "string"),
				output("file.extension", "string"),
				output("data", "object"),
			];
		}
		return [output("type", "string"), output("id", "string"), output("manual", "boolean"), output("actualAt", "datetime")];
	}
}

class TemplateValueSuggest extends AbstractInputSuggest<TemplateOption> {
	private readonly textInputEl: HTMLInputElement | HTMLTextAreaElement;

	constructor(
		app: App,
		textInputEl: HTMLInputElement | HTMLTextAreaElement,
		private readonly getTemplateOptions: () => TemplateOption[]
	) {
		super(app, textInputEl as HTMLInputElement);
		this.textInputEl = textInputEl;
		this.limit = 40;
	}

	protected override getSuggestions(_query: string): TemplateOption[] {
		const range = templateQueryRange(this.textInputEl);
		if (!range) return [];
		const query = range.query.toLowerCase();
		return this.getTemplateOptions().filter((option) => {
			if (!query) return true;
			return option.value.toLowerCase().includes(query) || option.label.toLowerCase().includes(query);
		});
	}

	override renderSuggestion(value: TemplateOption, el: HTMLElement): void {
		const wrapper = el.createDiv({ cls: "tnw-template-suggestion" });
		wrapper.createDiv({ cls: "tnw-template-suggestion-token", text: value.value });
		wrapper.createDiv({ cls: "tnw-template-suggestion-label", text: value.label });
	}

	override selectSuggestion(value: TemplateOption, _evt: MouseEvent | KeyboardEvent): void {
		insertTemplateSuggestion(this.textInputEl, value.value);
		this.close();
	}
}

function serializeWorkflowDraft(workflow: WorkflowDefinition): string {
	return JSON.stringify(workflow);
}

function summarizeStep(step: WorkflowStep, definition: StepDefinition | undefined): string {
	return definition?.label ?? step.type;
}

function dedupeTemplateOptions(options: TemplateOption[]): TemplateOption[] {
	const seen = new Set<string>();
	return options.filter((option) => {
		if (seen.has(option.value)) return false;
		seen.add(option.value);
		return true;
	});
}

function templateQueryRange(input: HTMLInputElement | HTMLTextAreaElement): { start: number; end: number; query: string } | null {
	const cursor = input.selectionStart ?? input.value.length;
	const beforeCursor = input.value.slice(0, cursor);
	const start = beforeCursor.lastIndexOf("{{");
	if (start < 0) return null;
	const query = beforeCursor.slice(start + 2);
	if (query.includes("}}")) return null;
	const nextClose = input.value.indexOf("}}", cursor);
	return {
		start,
		end: nextClose >= 0 ? nextClose + 2 : cursor,
		query: query.trim(),
	};
}

function insertTemplateSuggestion(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
	const range = templateQueryRange(input);
	const cursor = input.selectionStart ?? input.value.length;
	const start = range?.start ?? cursor;
	const end = range?.end ?? cursor;
	input.value = `${input.value.slice(0, start)}${value}${input.value.slice(end)}`;
	const nextCursor = start + value.length;
	input.selectionStart = nextCursor;
	input.selectionEnd = nextCursor;
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.dispatchEvent(new Event("change", { bubbles: true }));
	input.focus();
}

function isValidWorkflowId(value: string): boolean {
	return /^[a-z][a-z0-9._-]*$/u.test(value);
}

function isEmptyRequiredValue(value: unknown): boolean {
	return typeof value === "undefined" || value === null || value === "";
}

function createSection(parent: HTMLElement, title: string, description?: string): HTMLElement {
	const section = parent.createDiv({ cls: "tnw-editor-section" });
	const header = section.createDiv({ cls: "tnw-modal-section-heading" });
	header.createDiv({ cls: "tnw-section-title", text: title });
	if (description) header.createDiv({ cls: "tnw-section-description", text: description });
	return section;
}

function renderDisclosureSummary(parent: HTMLDetailsElement, title: string, description?: string): HTMLElement {
	const summary = parent.createEl("summary", { cls: "tnw-disclosure-summary" });
	summary.createSpan({ cls: "tnw-disclosure-chevron" });
	const copy = summary.createSpan({ cls: "tnw-disclosure-copy" });
	copy.createSpan({ cls: "tnw-disclosure-title", text: title });
	if (description) copy.createSpan({ cls: "tnw-disclosure-description", text: description });
	return summary;
}

function setButtonIconText(button: ButtonComponent, icon: IconName, text: string): ButtonComponent {
	button.buttonEl.empty();
	setIcon(button.buttonEl, icon);
	button.buttonEl.createSpan({ cls: "tnw-button-label", text });
	button.buttonEl.setAttr("aria-label", text);
	return button;
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

function taskQueryFromValue(value: unknown): TaskNotesRuntimeTaskQuery {
	if (!isRecord(value)) return {};
	return JSON.parse(JSON.stringify(value)) as TaskNotesRuntimeTaskQuery;
}

function simpleTaskQuery(where: TaskNotesRuntimePredicate | undefined): SimpleTaskQuery | null {
	if (typeof where === "undefined") return { mode: "all", conditions: [] };
	if (isRuntimeCondition(where)) return { mode: "all", conditions: [where] };
	if (!isRecord(where)) return null;
	const all = predicateChildren(where, "all");
	if (all && all.every(isRuntimeCondition)) {
		return { mode: "all", conditions: all };
	}
	const any = predicateChildren(where, "any");
	if (any && any.every(isRuntimeCondition)) {
		return { mode: "any", conditions: any };
	}
	return null;
}

function predicateChildren(
	where: TaskNotesRuntimePredicate,
	key: "all" | "any"
): TaskNotesRuntimePredicate[] | null {
	if (key === "all") {
		return "all" in where && Array.isArray(where.all) ? where.all : null;
	}
	return "any" in where && Array.isArray(where.any) ? where.any : null;
}

function writeSimpleTaskQuery(
	inputRecord: Record<string, unknown>,
	path: string,
	query: TaskNotesRuntimeTaskQuery,
	simple: SimpleTaskQuery
): void {
	if (simple.conditions.length === 0) {
		delete query.where;
	} else if (simple.mode === "any") {
		query.where = { any: simple.conditions };
	} else {
		query.where = { all: simple.conditions };
	}
	setPath(inputRecord, path, query);
}

function defaultQueryCondition(
	properties: readonly TaskNotesRuntimeFilterPropertyDefinition[]
): TaskNotesRuntimeCondition {
	const property = properties.find((item) => item.id === "task.status") ?? properties[0];
	const op = property?.supportedOperators?.includes("ne") ? "ne" : property?.supportedOperators?.[0] ?? "eq";
	const condition: TaskNotesRuntimeCondition = {
		field: property?.id ?? "task.status",
		op,
	};
	setDefaultConditionValue(condition, property, undefined);
	return condition;
}

function propertyForCondition(
	properties: readonly TaskNotesRuntimeFilterPropertyDefinition[],
	condition: TaskNotesRuntimeCondition
): TaskNotesRuntimeFilterPropertyDefinition | undefined {
	return properties.find((property) => property.id === condition.field);
}

function queryPropertyOptions(
	properties: readonly TaskNotesRuntimeFilterPropertyDefinition[],
	selected?: string
): Array<[string, string]> {
	const options = properties.map((property): [string, string] => [
		property.id,
		property.label ? `${property.label} (${property.id})` : property.id,
	]);
	if (selected && !options.some(([value]) => value === selected)) {
		options.unshift([selected, selected]);
	}
	return options;
}

function firstSupportedOperator(
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined,
	operators: readonly TaskNotesRuntimeFilterOperatorDefinition[]
): string {
	return property?.supportedOperators?.[0] ?? operators[0]?.id ?? "eq";
}

function operatorById(
	operators: readonly TaskNotesRuntimeFilterOperatorDefinition[],
	id: string
): TaskNotesRuntimeFilterOperatorDefinition | undefined {
	return operators.find((operator) => operator.id === id);
}

function queryOperatorOptions(
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined,
	operators: readonly TaskNotesRuntimeFilterOperatorDefinition[],
	selected: string
): Array<[string, string]> {
	const supported = new Set(property?.supportedOperators);
	const filtered = supported.size > 0 ? operators.filter((operator) => supported.has(operator.id)) : operators;
	const options = filtered.map((operator): [string, string] => [operator.id, operator.label]);
	if (selected && !options.some(([value]) => value === selected)) {
		options.unshift([selected, selected]);
	}
	return options;
}

function setDefaultConditionValue(
	condition: TaskNotesRuntimeCondition,
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined,
	operator: TaskNotesRuntimeFilterOperatorDefinition | undefined
): void {
	if (!operatorValueRequired(operator, condition.op)) {
		delete condition.value;
		return;
	}
	if (typeof condition.value !== "undefined") return;
	condition.value = defaultQueryValue(property);
}

function operatorValueRequired(
	operator: TaskNotesRuntimeFilterOperatorDefinition | undefined,
	op: string
): boolean {
	if (VALUELESS_OPERATORS.has(op as TaskNotesRuntimeOperator)) return false;
	return operator?.valueRequired ?? true;
}

function defaultQueryValue(property: TaskNotesRuntimeFilterPropertyDefinition | undefined): TaskNotesRuntimeValue {
	if (property?.valueType === "boolean") return true;
	if (property?.valueType === "number") return 0;
	if (property?.valueType === "date" || property?.valueType === "datetime") return { fn: "today" };
	return "";
}

function stringifyQueryValue(value: unknown): string {
	if (Array.isArray(value)) return value.map((item) => stringifyQueryValue(item)).join(", ");
	if (isRecord(value)) {
		if (value.fn === "today" || value.fn === "now") return value.fn;
		if (value.fn === "date" && typeof value.value === "string") return value.value;
		return JSON.stringify(value);
	}
	return stringifyScalar(value);
}

function parseQueryValueInput(
	value: string,
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined,
	op: string
): TaskNotesRuntimeValue {
	if (op === "in" || op === "notIn") {
		return value
			.split(",")
			.map((item) => parseSingleQueryValue(item, property))
			.filter((item) => item !== "");
	}
	return parseSingleQueryValue(value, property);
}

function parseSingleQueryValue(
	value: string,
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined
): TaskNotesRuntimeValue {
	const trimmed = value.trim();
	if (trimmed === "today" || trimmed === "now") return { fn: trimmed };
	if (property?.valueType === "number") {
		const numberValue = Number(trimmed);
		return Number.isFinite(numberValue) ? numberValue : 0;
	}
	if (property?.valueType === "boolean") return trimmed === "true";
	return trimmed;
}

function inputTypeForQueryValue(property: TaskNotesRuntimeFilterPropertyDefinition | undefined): string {
	return property?.valueType === "number" ? "number" : "text";
}

function valuePlaceholder(
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined,
	op: string
): string {
	if (op === "in" || op === "notIn") return "value-one, value-two";
	if (property?.valueType === "date" || property?.valueType === "datetime") return "today, now, or YYYY-MM-DD";
	if (property?.valueType === "number") return "0";
	return "";
}

function sortDirection(query: TaskNotesRuntimeTaskQuery): "asc" | "desc" {
	return query.sort?.[0]?.direction === "desc" ? "desc" : "asc";
}

function queryValueOptions(
	plugin: TaskNotesWorkflowsPlugin,
	property: TaskNotesRuntimeFilterPropertyDefinition | undefined
): WorkflowFieldOption[] {
	if (property?.id === "task.status") return plugin.tasknotesDynamicOptions("task-statuses");
	if (property?.id === "task.priority") return plugin.tasknotesDynamicOptions("task-priorities");
	return [];
}

function isRuntimeCondition(value: unknown): value is TaskNotesRuntimeCondition {
	return (
		isRecord(value) &&
		typeof value.field === "string" &&
		value.field.length > 0 &&
		typeof value.op === "string" &&
		value.op.length > 0
	);
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
		if (!isRecord(parsed)) return { error: "json-object" };
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
