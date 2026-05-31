import { Notice, TFile, type EventRef, type Plugin } from "obsidian";
import { cronMatches } from "./cron";
import { parseDurationMs } from "./duration";
import { pathMatchesFilter } from "./path";
import type { TaskNotesBridge } from "./tasknotesBridge";
import type {
	LoadedWorkflow,
	ObsidianMetadataTrigger,
	ObsidianWorkspaceTrigger,
	TaskNotesEventTrigger,
	TaskNotesWorkflowsSettings,
	WorkflowRunDetail,
	WorkflowRunOptions,
	WorkflowTriggerPayload,
} from "./types";

type RunWorkflow = (
	workflow: LoadedWorkflow,
	options: WorkflowRunOptions
) => Promise<WorkflowRunDetail>;

export class WorkflowScheduler {
	private taskEventRefs: EventRef[] = [];
	private intervalIds: number[] = [];
	private cleanupCallbacks: Array<() => void> = [];
	private cronLastRun = new Map<string, string>();
	private intervalLastRun = new Map<string, number>();

	constructor(
		private readonly plugin: Plugin,
		private readonly bridge: TaskNotesBridge,
		private readonly getSettings: () => TaskNotesWorkflowsSettings,
		private readonly getWorkflows: () => LoadedWorkflow[],
		private readonly runWorkflow: RunWorkflow
	) {}

	start(): void {
		this.stop();
		this.registerTaskEvents();
		this.registerSchedules();
		this.registerObsidianEvents();
	}

	stop(): void {
		for (const ref of this.taskEventRefs) {
			this.bridge.api?.events.off(ref);
		}
		this.taskEventRefs = [];
		for (const id of this.intervalIds) {
			window.clearInterval(id);
		}
		this.intervalIds = [];
		for (const cleanup of this.cleanupCallbacks) cleanup();
		this.cleanupCallbacks = [];
	}

	runManual(workflow: LoadedWorkflow, dryRun = false): Promise<WorkflowRunDetail> {
		return this.runWorkflow(workflow, {
			dryRun,
			manual: true,
			trigger: {
				type: dryRun ? "dry-run" : "manual",
				event: "manual",
				manual: true,
				actualAt: new Date().toISOString(),
			},
		});
	}

	private registerTaskEvents(): void {
		if (!this.getSettings().enableTaskEventTriggers) return;
		const events = new Set<string>();
		for (const loaded of this.getWorkflows()) {
			for (const trigger of loaded.workflow?.triggers ?? []) {
				if (isTaskNotesEventTrigger(trigger)) events.add(trigger.event);
			}
		}

		for (const event of events) {
			const ref = this.bridge.onTaskEvent(event, (payload) => {
				void this.handleTaskEvent(event, payload).catch(showError);
			});
			if (ref) this.taskEventRefs.push(ref);
		}
	}

	private registerSchedules(): void {
		if (!this.getSettings().enableScheduledTriggers) return;
		const tick = window.setInterval(() => {
			void this.handleScheduleTick().catch(showError);
		}, 60_000);
		this.intervalIds.push(tick);
		void this.handleScheduleTick().catch(showError);
	}

	private registerObsidianEvents(): void {
		if (!this.getSettings().enableObsidianTriggers) return;

		this.registerVaultEvent("create", (file) => {
			void this.handleVaultEvent("create", file).catch(showError);
		});
		this.registerVaultEvent("modify", (file) => {
			void this.handleVaultEvent("modify", file).catch(showError);
		});
		this.registerVaultEvent("delete", (file) => {
			void this.handleVaultEvent("delete", file).catch(showError);
		});
		const renameRef = this.plugin.app.vault.on("rename", (file, oldPath) => {
			void this.handleVaultEvent("rename", file, oldPath).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.vault.offref(renameRef));

		const fileOpenRef = this.plugin.app.workspace.on("file-open", (file) => {
			void this.handleWorkspaceEvent("file-open", file).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.workspace.offref(fileOpenRef));

		const activeLeafRef = this.plugin.app.workspace.on("active-leaf-change", () => {
			void this.handleWorkspaceEvent("active-leaf-change", this.plugin.app.workspace.getActiveFile()).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.workspace.offref(activeLeafRef));

		const layoutChangeRef = this.plugin.app.workspace.on("layout-change", () => {
			void this.handleWorkspaceEvent("layout-change", this.plugin.app.workspace.getActiveFile()).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.workspace.offref(layoutChangeRef));

		const metadataChangedRef = this.plugin.app.metadataCache.on("changed", (file, _data, cache) => {
			void this.handleMetadataEvent("changed", file, { cache }).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.metadataCache.offref(metadataChangedRef));

		const metadataDeletedRef = this.plugin.app.metadataCache.on("deleted", (file, previousCache) => {
			void this.handleMetadataEvent("deleted", file, { previousCache }).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.metadataCache.offref(metadataDeletedRef));

		const metadataResolveRef = this.plugin.app.metadataCache.on("resolve", (file) => {
			void this.handleMetadataEvent("resolve", file).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.metadataCache.offref(metadataResolveRef));

		const metadataResolvedRef = this.plugin.app.metadataCache.on("resolved", () => {
			void this.handleMetadataEvent("resolved", null).catch(showError);
		});
		this.cleanupCallbacks.push(() => this.plugin.app.metadataCache.offref(metadataResolvedRef));
	}

	private registerVaultEvent(
		event: "create" | "modify" | "delete",
		handler: (file: unknown) => void
	): void {
		const vault = this.plugin.app.vault as typeof this.plugin.app.vault & {
			on(name: "create" | "modify" | "delete", callback: (file: unknown) => void): EventRef;
		};
		const ref = vault.on(event, handler);
		this.cleanupCallbacks.push(() => this.plugin.app.vault.offref(ref));
	}

	private async handleTaskEvent(event: string, rawPayload: unknown): Promise<void> {
		const payload = normalizeTaskNotesEventPayload(event, rawPayload);
		for (const workflow of this.getWorkflows()) {
			for (const trigger of workflow.workflow?.triggers ?? []) {
				if (!isTaskNotesEventTrigger(trigger)) continue;
				if (!this.taskNotesTriggerMatches(trigger, payload)) continue;
				await this.runWorkflow(workflow, { trigger: { ...payload, id: trigger.id } });
			}
		}
	}

	private async handleScheduleTick(): Promise<void> {
		const now = new Date();
		for (const workflow of this.getWorkflows()) {
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (trigger.type === "cron" && this.shouldRunCron(workflow.workflow.id, trigger.id, trigger.schedule, now)) {
					await this.runWorkflow(workflow, {
						trigger: {
							type: "cron",
							id: trigger.id,
							event: "cron",
							scheduledAt: now.toISOString(),
							actualAt: new Date().toISOString(),
						},
					});
				}
				if (trigger.type === "interval" && this.shouldRunInterval(workflow.workflow.id, trigger.id, trigger.every)) {
					await this.runWorkflow(workflow, {
						trigger: {
							type: "interval",
							id: trigger.id,
							event: "interval",
							scheduledAt: now.toISOString(),
							actualAt: new Date().toISOString(),
						},
					});
				}
			}
		}
	}

	private async handleVaultEvent(
		event: "create" | "modify" | "delete" | "rename",
		file: unknown,
		oldPath?: string
	): Promise<void> {
		if (!(file instanceof TFile)) return;
		for (const workflow of this.getWorkflows()) {
			for (const trigger of workflow.workflow?.triggers ?? []) {
				if (trigger.type !== "obsidian.vault" || trigger.event !== event) continue;
				if (!pathMatchesFilter(file.path, trigger.path)) continue;
				await this.runWorkflow(workflow, {
					trigger: {
						type: "obsidian.vault",
						id: trigger.id,
						event,
						path: file.path,
						file: filePayload(file),
						data: { oldPath },
						actualAt: new Date().toISOString(),
					},
				});
			}
		}
	}

	private async handleWorkspaceEvent(
		event: ObsidianWorkspaceTrigger["event"],
		file: TFile | null
	): Promise<void> {
		for (const workflow of this.getWorkflows()) {
			for (const trigger of workflow.workflow?.triggers ?? []) {
				if (trigger.type !== "obsidian.workspace" || trigger.event !== event) continue;
				if (file && !pathMatchesFilter(file.path, trigger.path)) continue;
				if (!file && trigger.path) continue;
				await this.runWorkflow(workflow, {
					trigger: {
						type: "obsidian.workspace",
						id: trigger.id,
						event,
						path: file?.path,
						file: file ? filePayload(file) : undefined,
						actualAt: new Date().toISOString(),
					},
				});
			}
		}
	}

	private async handleMetadataEvent(
		event: ObsidianMetadataTrigger["event"],
		file: TFile | null,
		data?: unknown
	): Promise<void> {
		for (const workflow of this.getWorkflows()) {
			for (const trigger of workflow.workflow?.triggers ?? []) {
				if (trigger.type !== "obsidian.metadata" || trigger.event !== event) continue;
				if (file && !pathMatchesFilter(file.path, trigger.path)) continue;
				if (!file && trigger.path) continue;
				await this.runWorkflow(workflow, {
					trigger: {
						type: "obsidian.metadata",
						id: trigger.id,
						event,
						path: file?.path,
						file: file ? filePayload(file) : undefined,
						data,
						actualAt: new Date().toISOString(),
					},
				});
			}
		}
	}

	private taskNotesTriggerMatches(trigger: TaskNotesEventTrigger, payload: WorkflowTriggerPayload): boolean {
		if (trigger.event !== payload.event) return false;
		if (!trigger.allowSelfTrigger && payload.source === "tasknotes-workflows") return false;
		const taskPath = stringifyScalar(payload.after?.path ?? payload.task?.path ?? payload.path ?? "");
		if (taskPath && !pathMatchesFilter(taskPath, trigger.path)) return false;
		if (typeof trigger.from !== "undefined") {
			const before = payload.changes?.status?.before ?? payload.before?.status;
			if (stringifyScalar(before) !== stringifyScalar(trigger.from)) return false;
		}
		if (typeof trigger.to !== "undefined") {
			const after = payload.changes?.status?.after ?? payload.after?.status;
			if (stringifyScalar(after) !== stringifyScalar(trigger.to)) return false;
		}
		return true;
	}

	private shouldRunCron(
		workflowId: string,
		triggerId: string,
		schedule: string,
		now: Date
	): boolean {
		if (!cronMatches(schedule, now)) return false;
		const key = `${workflowId}:${triggerId}`;
		const minuteKey = now.toISOString().slice(0, 16);
		if (this.cronLastRun.get(key) === minuteKey) return false;
		this.cronLastRun.set(key, minuteKey);
		return true;
	}

	private shouldRunInterval(workflowId: string, triggerId: string, every: string): boolean {
		const interval = Math.max(
			parseDurationMs(every, this.getSettings().minIntervalMs),
			this.getSettings().minIntervalMs
		);
		const key = `${workflowId}:${triggerId}`;
		const now = Date.now();
		const lastRun = this.intervalLastRun.get(key) ?? 0;
		if (now - lastRun < interval) return false;
		this.intervalLastRun.set(key, now);
		return true;
	}
}

function normalizeTaskNotesEventPayload(event: string, rawPayload: unknown): WorkflowTriggerPayload {
	const payload = isRecord(rawPayload) ? rawPayload : {};
	return {
		type: "tasknotes.event",
		event,
		task: asRecord(payload.task),
		before: asRecord(payload.before),
		after: asRecord(payload.after),
		changes: isRecord(payload.changes)
			? (payload.changes as Record<string, { before: unknown; after: unknown }>)
			: undefined,
		source: typeof payload.source === "string" ? payload.source : undefined,
		correlationId: typeof payload.correlationId === "string" ? payload.correlationId : undefined,
		path: typeof payload.taskPath === "string" ? payload.taskPath : undefined,
		data: payload,
		actualAt: new Date().toISOString(),
	};
}

function isTaskNotesEventTrigger(trigger: { type: string }): trigger is TaskNotesEventTrigger {
	return trigger.type === "tasknotes.event";
}

function filePayload(file: TFile): { path: string; name: string; extension: string } {
	return {
		path: file.path,
		name: file.name,
		extension: file.extension,
	};
}

function showError(error: unknown): void {
	new Notice(error instanceof Error ? error.message : String(error));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringifyScalar(value: unknown): string {
	if (value === null || typeof value === "undefined") return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
		return String(value);
	}
	return JSON.stringify(value);
}
