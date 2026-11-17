import { collectionSettings } from "./collection";
import { RuntimeStateStore } from "./runtimeState";
import { localCloudEvent } from "./runtimeExecutor";
import { digest } from "./runtimeHistory";
import { Notice, TFile, type EventRef, type Plugin } from "obsidian";
import type { CloudEvent } from "@callumalpass/mdbase-interop";
import { cronMatches } from "./cron";
import { parseDurationMs } from "./duration";
import { pathMatchesFilter } from "./path";
import type { TaskNotesBridge } from "./tasknotesBridge";
import type {
	LoadedWorkflow,
	ContractEventTrigger,
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
	private debounceTimers = new Map<string, { timer: number; resolve: () => void }>();
	private metadataSnapshots = new Map<string, Record<string, unknown>>();
	private typeKeys: Promise<string[]> | null = null;
	private registrationEpoch = 0;

	constructor(
		private readonly plugin: Plugin,
		private readonly bridge: TaskNotesBridge,
		private readonly getSettings: () => TaskNotesWorkflowsSettings,
		private readonly getWorkflows: () => LoadedWorkflow[],
		private readonly runWorkflow: RunWorkflow,
		private readonly automaticEnabled: () => boolean = () => true,
		private readonly state = new RuntimeStateStore(),
	) {}

	start(): void {
		this.stop();
		if (!this.automaticEnabled()) return;
		const epoch = this.registrationEpoch;
		this.registerTaskEvents();
		this.registerContractEvents(epoch);
		this.registerSchedules();
		this.registerObsidianEvents();
	}

	stop(): void {
		this.registrationEpoch += 1;
		for (const pending of this.debounceTimers.values()) { window.clearTimeout(pending.timer); pending.resolve(); }
		this.debounceTimers.clear();
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

	private registerContractEvents(epoch: number): void {
		if (!this.getSettings().enableTaskEventTriggers) return;
		const subscriptions = new Map<string, { contract: string; version: string }>();
		for (const loaded of this.getWorkflows()) {
			for (const trigger of loaded.workflow?.triggers ?? []) {
				if (trigger.type !== "contract.event") continue;
				subscriptions.set(contractTriggerKey(trigger), {
					contract: trigger.contract,
					version: trigger.version,
				});
			}
		}
		for (const [key, contract] of subscriptions) {
			void this.bridge.onContractEvent(
				{ id: contract.contract, version: contract.version },
				async (event) => {
					await this.handleContractEvent(key, event);
				},
			).then((disposable) => {
				if (!disposable) return;
				if (epoch !== this.registrationEpoch) {
					void disposable.dispose();
					return;
				}
				this.cleanupCallbacks.push(() => void disposable.dispose());
			}).catch(showError);
		}
	}

	runManual(workflow: LoadedWorkflow, dryRun = false): Promise<WorkflowRunDetail> {
		return this.runWorkflow(workflow, {
			dryRun,
			manual: true,
			trigger: {
				type: dryRun ? "dry-run" : "manual",
				triggerType: "manual",
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

		this.metadataSnapshots.clear();
		this.typeKeys = null;
		if (this.hasMetadataTrigger("changed")) {
			for (const file of this.plugin.app.vault.getMarkdownFiles()) {
				this.metadataSnapshots.set(file.path, structuredClone(this.plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {}));
			}
		}
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
		payload.cloudEvent = await localCloudEvent({ trigger: payload }, event);
		for (const workflow of this.getWorkflows()) {
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (!isTaskNotesEventTrigger(trigger)) continue;
				if (!this.taskNotesTriggerMatches(trigger, payload)) continue;
				await this.runAutomatic(workflow, { trigger: { ...payload, id: trigger.id } });
			}
		}
	}

	private async handleContractEvent(key: string, event: CloudEvent): Promise<void> {
		const payload = normalizeContractEventPayload(event);
		for (const workflow of this.getWorkflows()) {
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (trigger.type !== "contract.event") continue;
				if (contractTriggerKey(trigger) !== key) continue;
				if (trigger.source && trigger.source !== event.mdbaseapplication) continue;
				if (trigger.path && (!payload.path || !pathMatchesFilter(payload.path, trigger.path))) continue;
				await this.runAutomatic(workflow, { trigger: { ...payload, id: trigger.id } });
			}
		}
	}

	private async handleScheduleTick(): Promise<void> {
		const now = new Date();
		for (const workflow of this.getWorkflows()) {
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (trigger.type === "cron" && await this.shouldRunCron(workflow.workflow.id, trigger.id, trigger.schedule, now, trigger.timezone, trigger.catchUp)) {
					await this.runAutomatic(workflow, {
						trigger: {
							type: "cron",
							triggerType: "cron",
							id: trigger.id,
							event: "cron",
							scheduledAt: now.toISOString(),
							actualAt: new Date().toISOString(),
						},
					});
				}
				if (trigger.type === "interval" && await this.shouldRunInterval(workflow.workflow.id, trigger.id, trigger.every)) {
					await this.runAutomatic(workflow, {
						trigger: {
							type: "interval",
							triggerType: "interval",
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
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (trigger.type !== "obsidian.vault" || trigger.event !== event) continue;
				if (!pathMatchesFilter(file.path, trigger.path)) continue;
				await this.runAutomatic(workflow, {
					trigger: {
						type: event,
						triggerType: "obsidian.vault",
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
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (trigger.type !== "obsidian.workspace" || trigger.event !== event) continue;
				if (file && !pathMatchesFilter(file.path, trigger.path)) continue;
				if (!file && trigger.path) continue;
				await this.runAutomatic(workflow, {
					trigger: {
						type: event,
						triggerType: "obsidian.workspace",
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
		if (!this.hasMetadataTrigger(event)) return;
		let cloudEvent: CloudEvent | undefined;
		if (event === "changed" && file) {
			const before = this.metadataSnapshots.get(file.path) ?? {};
			const cache = (data as { cache?: { frontmatter?: Record<string, unknown> } } | undefined)?.cache;
			const after = structuredClone(cache?.frontmatter ?? {});
			delete after.position;
			delete before.position;
			this.metadataSnapshots.set(file.path, after);
			const changed_fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
			this.typeKeys ??= collectionSettings(this.plugin.app).then((config) => config?.typeKeys ?? ["type", "types"]);
			const keys = await this.typeKeys;
			const types = (record: Record<string, unknown>): string[] => [...new Set(keys.flatMap((key) => typeof record[key] === "string" ? [record[key]] : Array.isArray(record[key]) ? record[key] as unknown[] : []).filter((value): value is string => typeof value === "string"))];
			data = { path: file.path, before, after, changed_fields, previous_revision: await digest(before), revision: await digest(after), previous_types: types(before), types: types(after) };
			cloudEvent = await localCloudEvent({ trigger: { type: event, data, path: file.path } }, "mdbase.record.modified");
		}
		for (const workflow of this.getWorkflows()) {
			if (!workflow.workflow?.enabled) continue;
			for (const trigger of workflow.workflow.triggers) {
				if (trigger.type !== "obsidian.metadata" || trigger.event !== event) continue;
				if (file && !pathMatchesFilter(file.path, trigger.path)) continue;
				if (!file && trigger.path) continue;
				await this.runAutomatic(workflow, {
					trigger: {
						type: event,
						triggerType: "obsidian.metadata",
						cloudEvent,
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

	private hasMetadataTrigger(event: ObsidianMetadataTrigger["event"]): boolean {
		return this.getWorkflows().some((workflow) => workflow.workflow?.enabled
			&& workflow.workflow.triggers.some((trigger) => trigger.type === "obsidian.metadata" && trigger.event === event));
	}

	private taskNotesTriggerMatches(trigger: TaskNotesEventTrigger, payload: WorkflowTriggerPayload): boolean {
		if (trigger.event !== (payload.event ?? payload.type)) return false;
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

	private async runAutomatic(workflow: LoadedWorkflow, options: WorkflowRunOptions): Promise<void> {
		if (!this.automaticEnabled() || !workflow.workflow?.enabled) return;
		const trigger = workflow.workflow.triggers.find(({ id }) => id === options.trigger.id);
		const key = `${workflow.workflow.id}:${trigger?.id ?? "unknown"}`;
		const execute = async (): Promise<void> => {
			if (!this.automaticEnabled()) return;
			if (trigger?.minimumInterval && !workflow.runtime) {
				const interval = parseDurationMs(trigger.minimumInterval, 0);
				const admitted = await this.state.update((state) => {
					const now = Date.now();
					if (state.lastAdmission[key] !== undefined && now - state.lastAdmission[key] < interval) return false;
					state.lastAdmission[key] = now;
					return true;
				});
				if (!admitted) return;
			}
			await this.runWorkflow(workflow, options);
		};
		const delay = parseDurationMs(trigger?.debounce, 0);
		if (!delay) return execute();
		const previous = this.debounceTimers.get(key);
		if (previous) { window.clearTimeout(previous.timer); previous.resolve(); }
		return new Promise<void>((resolve, reject) => {
			const timer = window.setTimeout(() => {
				this.debounceTimers.delete(key);
				void execute().then(resolve, reject);
			}, delay);
			this.debounceTimers.set(key, { timer, resolve });
		});
	}

	private async shouldRunCron(workflowId: string, triggerId: string, schedule: string, now: Date, timezone?: string, catchUp = true): Promise<boolean> {
		return this.state.update((state) => {
			const key = `cron:${workflowId}:${triggerId}`;
			const minute = Math.floor(now.getTime() / 60_000) * 60_000;
			const last = state.lastFire[key];
			if (last === minute) return false;
			let due = cronMatches(schedule, now, timezone);
			if (!due && catchUp && last !== undefined) {
				for (let instant = last + 60_000; instant < minute; instant += 60_000) {
					if (cronMatches(schedule, new Date(instant), timezone)) { due = true; break; }
				}
			}
			state.lastFire[key] = minute;
			return due;
		});
	}

	private async shouldRunInterval(workflowId: string, triggerId: string, every: string): Promise<boolean> {
		const interval = Math.max(parseDurationMs(every, this.getSettings().minIntervalMs), this.getSettings().minIntervalMs);
		return this.state.update((state) => {
			const key = `interval:${workflowId}:${triggerId}`;
			const now = Date.now();
			if (state.lastFire[key] !== undefined && now - state.lastFire[key] < interval) return false;
			state.lastFire[key] = now;
			return true;
		});
	}

}

function normalizeTaskNotesEventPayload(event: string, rawPayload: unknown): WorkflowTriggerPayload {
	const payload = isRecord(rawPayload) ? rawPayload : {};
	return {
		type: event,
		triggerType: "tasknotes.event",
		event,
		task: asRecord(payload.task),
		before: asRecord(payload.before),
		after: asRecord(payload.after),
		changes: isRecord(payload.changes)
			? (payload.changes as Record<string, { before: unknown; after: unknown }>)
			: undefined,
		source: typeof payload.source === "string" ? payload.source : undefined,
		taskId: typeof payload.taskId === "string" ? payload.taskId : undefined,
		correlationId: typeof payload.correlationId === "string" ? payload.correlationId : undefined,
		path: typeof payload.taskPath === "string" ? payload.taskPath : undefined,
		data: payload,
		actualAt: new Date().toISOString(),
	};
}

function normalizeContractEventPayload(event: CloudEvent): WorkflowTriggerPayload {
	const data = isRecord(event.data) ? event.data : {};
	const path = typeof data.path === "string" ? data.path : typeof data.task_path === "string"
		? data.task_path
		: typeof event.subject === "string"
			? event.subject
			: undefined;
	return {
		type: event.type,
		cloudEvent: event,
		triggerType: "contract.event",
		event: event.type,
		path,
		source: event.mdbaseapplication,
		correlationId: typeof event.correlationid === "string" ? event.correlationid : undefined,
		data: {
			...data,
			eventId: event.id,
			contractVersion: event.mdbasecontractversion,
			contractDigest: event.mdbasecontractdigest,
			causationId: event.causationid,
		},
		actualAt: event.time,
	};
}

function contractTriggerKey(trigger: ContractEventTrigger): string {
	return `${trigger.contract}\u0000${trigger.version}`;
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
