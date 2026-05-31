import type { App, EventRef } from "obsidian";
import { CORE_CAPABILITIES, PLUGIN_ID } from "./constants";
import type { TaskNotesRuntimeApi, TaskNotesRuntimeEventDefinition, WorkflowsRuntimeApi } from "./types";

interface PluginWithApi {
	api?: TaskNotesRuntimeApi;
}

export class TaskNotesBridge {
	private extensionHandle: { unregister(): void } | null = null;

	constructor(private readonly app: App) {}

	get api(): TaskNotesRuntimeApi | null {
		const app = this.app as App & {
			plugins?: { getPlugin(id: string): unknown };
		};
		const plugin = app.plugins?.getPlugin("tasknotes") as PluginWithApi | null;
		const api = plugin?.api;
		if (!api || typeof api.apiVersion !== "number") return null;
		return api;
	}

	get available(): boolean {
		return this.api !== null;
	}

	get missingReason(): string | null {
		if (this.available) return null;
		return "TaskNotes is not loaded or does not expose the runtime API.";
	}

	registerExtension(runtimeApi: WorkflowsRuntimeApi, version: string): void {
		const api = this.api;
		if (!api?.extensions?.register || this.extensionHandle) return;

		this.extensionHandle = api.extensions.register({
			id: PLUGIN_ID,
			namespace: PLUGIN_ID,
			displayName: "TaskNotes Workflows",
			version,
			capabilities: CORE_CAPABILITIES,
			api: runtimeApi,
		});
	}

	unregisterExtension(): void {
		this.extensionHandle?.unregister();
		this.extensionHandle = null;
	}

	onTaskEvent(event: string, handler: (payload: unknown) => void): EventRef | null {
		const api = this.api;
		if (!api?.events?.on) return null;
		return api.events.on(event, handler);
	}

	listEvents(): TaskNotesRuntimeEventDefinition[] {
		const events = this.api?.events?.list?.();
		if (!events) return [];
		return events
			.filter((event) => typeof event.name === "string" && event.name.length > 0)
			.map((event) => ({ ...event }));
	}
}
