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
import type {
	LoadedWorkflow,
	RunSummary,
	TaskNotesRuntimeEventDefinition,
	TaskNotesWorkflowsSettings,
	WorkflowRunDetail,
	WorkflowRunOptions,
	WorkflowsRuntimeApi,
} from "./src/types";

export default class TaskNotesWorkflowsPlugin extends Plugin {
	override settings: TaskNotesWorkflowsSettings = { ...DEFAULT_SETTINGS };
	repository!: WorkflowRepository;
	runLogs!: RunLogService;
	stepRegistry!: StepRegistry;

	private bridge!: TaskNotesBridge;
	private engine!: WorkflowEngine;
	private scheduler!: WorkflowScheduler;
	private defaults!: DefaultWorkflowsService;
	private loadedWorkflows: LoadedWorkflow[] = [];
	private workflowBaseViews = new Set<WorkflowBasesView>();
	private manualWorkflowCommandIds = new Set<string>();

	get workflows(): LoadedWorkflow[] {
		return [...this.loadedWorkflows];
	}

	get tasknotesAvailable(): boolean {
		return this.bridge.available;
	}

	override async onload(): Promise<void> {
		await this.loadSettings();

		this.bridge = new TaskNotesBridge(this.app);
		this.repository = new WorkflowRepository(this.app, () => this.settings);
		this.runLogs = new RunLogService(this.app, () => this.settings);
		this.stepRegistry = new StepRegistry();
		this.engine = new WorkflowEngine(this.stepRegistry, () => this.bridge.api, () => this.app);
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
		this.registerRuntimeExtension();
		this.registerInterval(
			window.setInterval(() => {
				this.registerRuntimeExtension();
			}, 5000)
		);

		this.addRibbonIcon("workflow", "Workflows", () => {
			void this.openWorkflowBase();
		});
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

	private registerCommands(): void {
		this.addCommand({
			id: "open-workflows",
			name: "Open workflows",
			icon: "workflow",
			callback: () => {
				void this.openWorkflowBase();
			},
		});

		this.addCommand({
			id: "new-workflow",
			name: "New workflow",
			icon: "plus",
			callback: () => {
				new WorkflowEditModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: "reload-workflows",
			name: "Reload workflows",
			icon: "refresh-cw",
			callback: () => {
				void this.reloadWorkflows().then(() => new Notice("Workflows reloaded."));
			},
		});

		this.addCommand({
			id: "maintain-default-workflows",
			name: "Maintain default workflow files",
			icon: "file-plus-2",
			callback: () => {
				void this.ensureDefaultFiles().then((result) => {
					const created = [...result.workflows, ...(result.view ? [result.view] : [])];
					new Notice(
						created.length > 0
							? `Created ${created.length} default file${created.length === 1 ? "" : "s"}.`
							: "Default workflow files are already present."
					);
				});
			},
		});
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
				name: `Run: ${workflow.name}`,
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
			new Notice("Workflow command is no longer available.");
			return;
		}
		void this.runWorkflowById(workflow.workflow.id)
			.then((run) => {
				new Notice(`Run ${run.status}: ${run.workflowName}`);
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
		new Notice(`Workflow base not found: ${this.settings.workflowViewPath}`);
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
					name: "TaskNotes Workflows",
					icon: "workflow",
					factory: buildWorkflowBasesViewFactory(this),
				}
			);
		} catch (error) {
			console.warn("Failed to register TaskNotes Workflows Bases view", error);
		}
	}

	private registerRuntimeExtension(): void {
		this.bridge.registerExtension(this.runtimeApi(), this.manifest.version);
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
