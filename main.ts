import { Notice, Plugin, TFile } from "obsidian";
import type { BasesViewRegistration } from "obsidian";
import { DefaultWorkflowsService } from "./src/defaultWorkflowsService";
import { RunLogService } from "./src/runLogService";
import { WorkflowScheduler } from "./src/scheduler";
import { DEFAULT_SETTINGS, normalizeSettings } from "./src/settings";
import { WorkflowsSettingsTab } from "./src/settingsTab";
import { StepRegistry } from "./src/stepRegistry";
import { TaskNotesBridge } from "./src/tasknotesBridge";
import { WORKFLOW_BASE_VIEW_TYPE } from "./src/constants";
import { isWorkflowPath } from "./src/path";
import { WorkflowEngine } from "./src/workflowEngine";
import { WorkflowRepository } from "./src/workflowRepository";
import { buildWorkflowBasesViewFactory, WorkflowBasesView } from "./src/workflowBasesView";
import { refreshWorkflowNoteCards, registerWorkflowNoteCards } from "./src/workflowNoteCard";
import { WorkflowEditModal } from "./src/workflowEditModal";
import { createI18nService, I18nService, type InterpolationValues } from "./src/i18n";
import type {
	LoadedWorkflow,
	RunSummary,
	TaskNotesRuntimeEventDefinition,
	TaskNotesRuntimeFilterOperatorDefinition,
	TaskNotesRuntimeFilterPropertyDefinition,
	TaskNotesRuntimeQueryExplainResult,
	TaskNotesRuntimeQueryValidationResult,
	TaskNotesWorkflowsSettings,
	WorkflowDynamicFieldOptions,
	WorkflowFieldOption,
	WorkflowRunDetail,
	WorkflowRunOptions,
	WorkflowsRuntimeApi,
} from "./src/types";

export default class TaskNotesWorkflowsPlugin extends Plugin {
	override settings: TaskNotesWorkflowsSettings = { ...DEFAULT_SETTINGS };
	i18n!: I18nService;
	repository!: WorkflowRepository;
	runLogs!: RunLogService;
	stepRegistry!: StepRegistry;

	private bridge!: TaskNotesBridge;
	private engine!: WorkflowEngine;
	private scheduler!: WorkflowScheduler;
	private defaults!: DefaultWorkflowsService;
	private loadedWorkflows: LoadedWorkflow[] = [];
	private workflowBaseViews = new Set<WorkflowBasesView>();
	private staticWorkflowCommandIds = new Set<string>();
	private manualWorkflowCommandIds = new Set<string>();
	private workflowsRibbonEl: HTMLElement | null = null;
	private tasknotesRuntimeAvailable = false;
	private tasknotesLifecycleRegistered = false;

	get workflows(): LoadedWorkflow[] {
		return [...this.loadedWorkflows];
	}

	get tasknotesAvailable(): boolean {
		return this.bridge.available;
	}

	override async onload(): Promise<void> {
		await this.loadSettings();

		this.i18n = createI18nService({
			initialLocale: this.settings.uiLanguage,
			getSystemLocale: () => this.getSystemUILocale(),
		});
		this.i18n.on("locale-changed", ({ current }) => {
			const languageLabel = this.i18n.getNativeLanguageName(current);
			new Notice(this.t("notices.languageChanged", { language: languageLabel }));
			this.refreshLocalizedUi();
		});

		this.bridge = new TaskNotesBridge(this.app);
		this.repository = new WorkflowRepository(this.app, () => this.settings);
		this.runLogs = new RunLogService(this.app, () => this.settings);
		this.stepRegistry = new StepRegistry((key, params) => this.t(key, params));
		this.engine = new WorkflowEngine(
			this.stepRegistry,
			() => this.bridge.api,
			() => this.app,
			(key, params) => this.t(key, params)
		);
		this.scheduler = new WorkflowScheduler(
			this,
			this.bridge,
			() => this.settings,
			() => this.loadedWorkflows,
			(workflow, options) => this.executeWorkflow(workflow, options)
		);
		this.defaults = new DefaultWorkflowsService(this.app, () => this.settings);

		this.addSettingTab(new WorkflowsSettingsTab(this.app, this));
		this.registerWorkflowBasesView();
		registerWorkflowNoteCards(this);
		this.registerCommands();
		this.registerWorkflowFileWatchers();

		if (this.settings.autoCreateDefaultWorkflows) {
			await this.ensureDefaultWorkflows();
		}
		if (this.settings.autoCreateWorkflowView) {
			await this.defaults.ensureWorkflowViewFile();
		}
		await this.reloadWorkflows();
		this.refreshTaskNotesRuntimeState();
		this.registerInterval(
			window.setInterval(() => {
				this.refreshTaskNotesRuntimeState();
			}, 5000)
		);

		this.workflowsRibbonEl = this.addRibbonIcon("workflow", this.t("baseView.title"), () => {
			void this.openWorkflowBase();
		});
		this.updateRibbonLabels();
	}

	override onunload(): void {
		this.unregisterManualWorkflowCommands();
		this.scheduler.stop();
		this.bridge.unregisterExtension();
	}

	async loadSettings(): Promise<void> {
		const loaded = (await this.loadData()) as Partial<TaskNotesWorkflowsSettings> | null;
		this.settings = normalizeSettings(loaded ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async saveSettingsAndReload(): Promise<void> {
		await this.saveSettings();
		await this.reloadWorkflows();
	}

	async ensureDefaultWorkflows(): Promise<string[]> {
		const paths = await this.defaults.ensureDefaultWorkflows();
		if (paths.length > 0) await this.reloadWorkflows();
		return paths;
	}

	async ensureDefaultFiles(): Promise<{ workflows: string[]; view: string | null }> {
		const result = await this.defaults.ensureDefaultFiles();
		if (result.workflows.length > 0) await this.reloadWorkflows();
		return result;
	}

	async reloadWorkflows(): Promise<void> {
		this.loadedWorkflows = await this.repository.reload();
		this.loadedWorkflows = await this.withLastRunSummaries(this.loadedWorkflows);
		this.scheduler.start();
		this.refreshManualWorkflowCommands();
		await this.renderWorkflowBaseViews();
		refreshWorkflowNoteCards(this);
	}

	async runWorkflowById(
		workflowId: string,
		options: Partial<WorkflowRunOptions> = {}
	): Promise<WorkflowRunDetail> {
		const workflow = this.repository.getById(workflowId);
		if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
		return await this.executeWorkflow(workflow, {
			trigger: {
				type: options.dryRun ? "dry-run" : "manual",
				event: options.dryRun ? "dry-run" : "manual",
				manual: true,
				actualAt: new Date().toISOString(),
				...options.trigger,
			},
			dryRun: options.dryRun,
			manual: options.manual ?? true,
		});
	}

	async recentRuns(workflowId?: string): Promise<RunSummary[]> {
		return await this.runLogs.recentRuns(workflowId);
	}

	async readRunDetail(workflowId: string, runId: string): Promise<WorkflowRunDetail | null> {
		return await this.runLogs.readRunDetail(workflowId, runId);
	}

	async clearRunHistory(): Promise<void> {
		await this.runLogs.clearHistory();
		await this.reloadWorkflows();
	}

	tasknotesSettingsSnapshot(): Record<string, unknown> | null {
		return this.bridge.api?.settings?.snapshot?.() ?? null;
	}

	tasknotesEventDefinitions(): TaskNotesRuntimeEventDefinition[] {
		return this.bridge.listEvents();
	}

	tasknotesDynamicOptions(source: WorkflowDynamicFieldOptions | undefined): WorkflowFieldOption[] {
		return this.bridge.dynamicOptions(source);
	}

	tasknotesFilterProperties(): TaskNotesRuntimeFilterPropertyDefinition[] {
		return this.bridge.filterProperties();
	}

	tasknotesFilterOperators(): TaskNotesRuntimeFilterOperatorDefinition[] {
		return this.bridge.filterOperators();
	}

	tasknotesValidateQuery(query: unknown): TaskNotesRuntimeQueryValidationResult | null {
		return this.bridge.validateTaskQuery(query);
	}

	async tasknotesExplainQuery(query: unknown): Promise<TaskNotesRuntimeQueryExplainResult | null> {
		return await this.bridge.explainTaskQuery(query);
	}

	async openWorkflowFile(file: TFile): Promise<void> {
		const leaf = this.app.workspace.getLeaf("tab");
		await leaf.openFile(file);
	}

	registerWorkflowBaseView(view: WorkflowBasesView): void {
		this.workflowBaseViews.add(view);
	}

	unregisterWorkflowBaseView(view: WorkflowBasesView): void {
		this.workflowBaseViews.delete(view);
	}

	private async executeWorkflow(
		workflow: LoadedWorkflow,
		options: WorkflowRunOptions
	): Promise<WorkflowRunDetail> {
		const detail = await this.engine.runWorkflow(workflow, options);
		await this.runLogs.recordRun(this.redactRunDetail(detail));
		await this.refreshWorkflowLastRun(detail.workflowId);
		await this.renderWorkflowBaseViews();
		refreshWorkflowNoteCards(this, workflow.file.path);
		return detail;
	}

	t(key: string, params?: InterpolationValues): string {
		return this.i18n.translate(key, params);
	}

	private getSystemUILocale(): string {
		if (typeof navigator !== "undefined" && navigator.language) {
			return navigator.language;
		}
		return "en";
	}

	private refreshLocalizedUi(): void {
		this.stepRegistry.updateTranslator((key, params) => this.t(key, params));
		this.bridge.unregisterExtension();
		this.registerRuntimeExtension();
		this.refreshStaticWorkflowCommands();
		this.refreshManualWorkflowCommands();
		this.updateRibbonLabels();
		void this.renderWorkflowBaseViews();
		refreshWorkflowNoteCards(this);
	}

	private updateRibbonLabels(): void {
		if (!this.workflowsRibbonEl) return;
		const label = this.t("baseView.title");
		this.workflowsRibbonEl.setAttr("aria-label", label);
		this.workflowsRibbonEl.setAttr("title", label);
	}

	private registerCommands(): void {
		this.addCommand({
			id: "open-workflows",
			name: this.t("commands.openWorkflows"),
			icon: "workflow",
			callback: () => {
				void this.openWorkflowBase();
			},
		});
		this.staticWorkflowCommandIds.add("open-workflows");

		this.addCommand({
			id: "new-workflow",
			name: this.t("commands.newWorkflow"),
			icon: "plus",
			callback: () => {
				new WorkflowEditModal(this.app, this).open();
			},
		});
		this.staticWorkflowCommandIds.add("new-workflow");

		this.addCommand({
			id: "reload-workflows",
			name: this.t("commands.reloadWorkflows"),
			icon: "refresh-cw",
			callback: () => {
				void this.reloadWorkflows().then(() => new Notice(this.t("notices.workflowsReloaded")));
			},
		});
		this.staticWorkflowCommandIds.add("reload-workflows");

		this.addCommand({
			id: "maintain-default-workflows",
			name: this.t("commands.maintainDefaultWorkflows"),
			icon: "file-plus-2",
			callback: () => {
				void this.ensureDefaultFiles().then((result) => {
					this.showDefaultFilesNotice(result);
				});
			},
		});
		this.staticWorkflowCommandIds.add("maintain-default-workflows");
	}

	private refreshStaticWorkflowCommands(): void {
		for (const commandId of this.staticWorkflowCommandIds) {
			this.removeCommand(commandId);
		}
		this.staticWorkflowCommandIds.clear();
		this.registerCommands();
	}

	showDefaultFilesNotice(result: { workflows: string[]; view: string | null }): void {
		const created = [...result.workflows, ...(result.view ? [result.view] : [])];
		new Notice(
			created.length > 0
				? this.t("notices.defaultFilesCreated", {
						count: created.length,
						fileLabel: created.length === 1 ? "file" : "files",
					})
				: this.t("notices.defaultFilesAlreadyPresent")
		);
	}

	private refreshManualWorkflowCommands(): void {
		this.unregisterManualWorkflowCommands();

		const commandIds = new Set<string>();
		for (const loaded of this.loadedWorkflows) {
			const workflow = loaded.workflow;
			if (!workflow?.enabled) continue;
			if (!workflow.triggers.some((trigger) => trigger.type === "manual")) continue;

			const commandId = manualWorkflowCommandId(workflow.id);
			if (commandIds.has(commandId)) continue;
			commandIds.add(commandId);

			this.addCommand({
				id: commandId,
				name: this.t("commands.runWorkflow", { name: workflow.name }),
				icon: "play",
				checkCallback: (checking) => {
					const currentWorkflow = this.findEnabledManualWorkflow(workflow.id);
					if (!currentWorkflow) return false;
					if (!checking) this.runManualWorkflowCommand(workflow.id);
					return true;
				},
			});
			this.manualWorkflowCommandIds.add(commandId);
		}
	}

	private unregisterManualWorkflowCommands(): void {
		for (const commandId of this.manualWorkflowCommandIds) {
			this.removeCommand(commandId);
		}
		this.manualWorkflowCommandIds.clear();
	}

	private findEnabledManualWorkflow(workflowId: string): LoadedWorkflow | null {
		const loaded = this.loadedWorkflows.find((workflow) => workflow.workflow?.id === workflowId);
		if (!loaded?.workflow?.enabled) return null;
		if (!loaded.workflow.triggers.some((trigger) => trigger.type === "manual")) return null;
		return loaded;
	}

	private runManualWorkflowCommand(workflowId: string): void {
		const workflow = this.findEnabledManualWorkflow(workflowId);
		if (!workflow?.workflow) {
			new Notice(this.t("notices.workflowCommandUnavailable"));
			return;
		}
		void this.runWorkflowById(workflow.workflow.id)
			.then((run) => {
				new Notice(
					this.t("notices.workflowRunCompleted", {
						status: this.t(`common.runStatus.${run.status}`),
						name: run.workflowName,
					})
				);
			})
			.catch((error) => {
				new Notice(error instanceof Error ? error.message : String(error));
			});
	}

	private registerWorkflowFileWatchers(): void {
		const reloadIfWorkflowPath = (path: string): void => {
			if (!isWorkflowPath(path, this.settings.workflowFolder)) return;
			window.setTimeout(() => {
				void this.reloadWorkflows();
			}, 100);
		};

		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile) reloadIfWorkflowPath(file.path);
			})
		);
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile) reloadIfWorkflowPath(file.path);
			})
		);
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile) reloadIfWorkflowPath(file.path);
			})
		);
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile) {
					reloadIfWorkflowPath(file.path);
					reloadIfWorkflowPath(oldPath);
				}
			})
		);
	}

	private async openWorkflowBase(): Promise<void> {
		await this.defaults.ensureWorkflowViewFile();
		const file = this.app.vault.getAbstractFileByPath(this.settings.workflowViewPath);
		if (file instanceof TFile) {
			await this.openWorkflowBaseFile(file);
			return;
		}
		new Notice(this.t("notices.workflowBaseNotFound", { path: this.settings.workflowViewPath }));
	}

	private async openWorkflowBaseFile(file: TFile): Promise<void> {
		const leaf = this.app.workspace.getLeaf("tab");
		await leaf.setViewState({
			type: "bases",
			state: { file: file.path },
			active: false,
		});
	}

	private async renderWorkflowBaseViews(): Promise<void> {
		for (const view of this.workflowBaseViews) {
			await view.render();
		}
	}

	private registerWorkflowBasesView(): void {
		const registerBasesView = (this as unknown as Record<string, unknown>)["registerBasesView"];
		if (typeof registerBasesView !== "function") return;
		try {
			(registerBasesView as (viewId: string, registration: BasesViewRegistration) => boolean).call(
				this,
				WORKFLOW_BASE_VIEW_TYPE,
				{
					name: this.t("common.appName"),
					icon: "workflow",
					factory: buildWorkflowBasesViewFactory(this),
				}
			);
		} catch (error) {
			console.warn("Failed to register TaskNotes Workflows Bases view", error);
		}
	}

	private registerRuntimeExtension(): void {
		this.bridge.registerExtension(this.runtimeApi(), this.manifest.version, this.t("common.appName"));
	}

	private refreshTaskNotesRuntimeState(): void {
		const available = this.bridge.available;
		if (!available) {
			if (this.tasknotesRuntimeAvailable) {
				this.bridge.unregisterExtension();
				this.tasknotesLifecycleRegistered = false;
			}
			this.tasknotesRuntimeAvailable = false;
			return;
		}

		this.registerRuntimeExtension();
		this.registerTaskNotesLifecycleListeners();

		if (!this.tasknotesRuntimeAvailable) {
			this.scheduler.start();
			void this.renderWorkflowBaseViews();
			refreshWorkflowNoteCards(this);
		}
		this.tasknotesRuntimeAvailable = true;
	}

	private registerTaskNotesLifecycleListeners(): void {
		if (this.tasknotesLifecycleRegistered) return;
		const events = ["ready", "settings.changed", "cache.changed", "cache.rebuilt"] as const;
		let registered = false;
		for (const event of events) {
			const ref = this.bridge.onLifecycle(event, () => {
				this.handleTaskNotesLifecycleEvent(event);
			});
			if (ref) {
				this.registerEvent(ref);
				registered = true;
			}
		}
		this.tasknotesLifecycleRegistered = registered;
	}

	private handleTaskNotesLifecycleEvent(event: string): void {
		if (event === "ready") {
			this.refreshTaskNotesRuntimeState();
		}
		if (event === "settings.changed") {
			this.refreshManualWorkflowCommands();
		}
		void this.renderWorkflowBaseViews();
		refreshWorkflowNoteCards(this);
	}

	private runtimeApi(): WorkflowsRuntimeApi {
		return {
			listWorkflows: () => this.workflows,
			listStepDefinitions: () =>
				this.stepRegistry.list().map((step) => ({
					type: step.type,
					label: step.label,
					description: step.description,
					category: step.category,
					inputFields: step.inputFields,
					outputFields: step.outputFields,
					examples: step.examples,
					mutatesTasks: step.mutatesTasks,
					supportsDryRun: step.supportsDryRun,
					supportsForEach: step.supportsForEach,
				})),
			runWorkflow: async (workflowId, input) =>
				await this.runWorkflowById(workflowId, { ...input, dryRun: false }),
			dryRunWorkflow: async (workflowId, input) =>
				await this.runWorkflowById(workflowId, { ...input, dryRun: true }),
			reloadWorkflows: async () => await this.reloadWorkflows(),
			validateWorkflows: async () => {
				await this.reloadWorkflows();
				return this.workflows;
			},
			recentRuns: async (workflowId) => await this.recentRuns(workflowId),
		};
	}

	private async withLastRunSummaries(workflows: LoadedWorkflow[]): Promise<LoadedWorkflow[]> {
		const runs = await this.recentRuns();
		return workflows.map((workflow) => ({
			...workflow,
			lastRun: runs.find((run) => run.workflowId === workflow.workflow?.id),
		}));
	}

	private async refreshWorkflowLastRun(workflowId: string): Promise<void> {
		const lastRun = (await this.recentRuns(workflowId))[0];
		this.loadedWorkflows = this.loadedWorkflows.map((workflow) =>
			workflow.workflow?.id === workflowId ? { ...workflow, lastRun } : workflow
		);
	}

	private redactRunDetail(detail: WorkflowRunDetail): WorkflowRunDetail {
		if (this.settings.runLogLevel === "inputs-and-outputs") return detail;
		return {
			...detail,
			steps: detail.steps.map((step) => ({
				...step,
				output: this.settings.runLogLevel === "summary" ? undefined : step.output,
				input: this.settings.runLogLevel === "summary" ? undefined : step.input,
			})),
		};
	}
}

function manualWorkflowCommandId(workflowId: string): string {
	return `run-workflow-${workflowId}`;
}

export type { TaskNotesWorkflowsPlugin };
