import type { App, EventRef, Plugin } from "obsidian";
import type {
	ActionOutcome,
	BridgeDescription,
	CloudEvent,
	ContractRequirement,
	Disposable,
	InteropClient,
	InvokeActionInput,
	ActionProviderRegistration,
	RegisterActionProviderInput,
} from "@callumalpass/mdbase-interop";
import { CORE_CAPABILITIES, PLUGIN_ID } from "./constants";
import type {
	TaskNotesRuntimeApi,
	TaskNotesRuntimeCatalogOption,
	TaskNotesRuntimeEventDefinition,
	TaskNotesRuntimeFieldDefinition,
	TaskNotesRuntimeFilterOperatorDefinition,
	TaskNotesRuntimeFilterPropertyDefinition,
	TaskNotesRuntimeQueryExplainResult,
	TaskNotesRuntimeQueryValidationResult,
	WorkflowDynamicFieldOptions,
	WorkflowFieldOption,
	WorkflowsRuntimeApi,
} from "./types";

interface PluginWithApi {
	api?: TaskNotesRuntimeApi;
}

interface MdbasePluginWithApi {
	api?: {
		apiVersion: number;
		interop?: {
			connect(plugin: Plugin): InteropClient;
			describe(): BridgeDescription;
		};
		getInteropStatus?(): { enabled: boolean };
	};
}

export class TaskNotesBridge {
	private extensionHandle: { unregister(): void } | null = null;
	private actionProviderHandle: ActionProviderRegistration | null = null;
	private providerRegistration: Promise<void> | null = null;
	private interopClient: InteropClient | null = null;

	constructor(
		private readonly app: App,
		private readonly plugin?: Plugin,
	) {}

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

	get interopAvailable(): boolean {
		const mdbase = this.mdbasePlugin();
		return Boolean(
			this.plugin
			&& mdbase?.api?.interop
			&& mdbase.api.getInteropStatus?.().enabled !== false
		);
	}

	connectInterop(): InteropClient | null {
		if (this.interopClient) return this.interopClient;
		if (!this.interopAvailable || !this.plugin) return null;
		const mdbase = this.mdbasePlugin();
		if (!mdbase?.api?.interop) return null;
		this.interopClient = mdbase.api.interop.connect(this.plugin);
		return this.interopClient;
	}

	interopDescription(): BridgeDescription | null {
		return this.mdbasePlugin()?.api?.interop?.describe() ?? null;
	}

	async onContractEvent(
		contract: ContractRequirement,
		handler: (event: CloudEvent) => void | Promise<void>,
	): Promise<Disposable | null> {
		return await this.connectInterop()?.subscribeEvents({ contract }, handler) ?? null;
	}

	async invokeContractAction(
		input: InvokeActionInput,
	): Promise<ActionOutcome> {
		const client = this.connectInterop();
		if (!client) throw new Error("The mdbase interoperability bridge is unavailable or not granted.");
		return await client.invokeAction(input);
	}

	async disposeInterop(): Promise<void> {
		await this.unregisterActionProvider();
		await this.interopClient?.dispose();
		this.interopClient = null;
	}

	get missingReason(): string | null {
		if (this.available) return null;
		return "TaskNotes is not loaded or does not expose the runtime API.";
	}

	registerExtension(runtimeApi: WorkflowsRuntimeApi, version: string, displayName = "TaskNotes Workflows"): void {
		const api = this.api;
		if (!api?.extensions?.register || this.extensionHandle) return;

		this.extensionHandle = api.extensions.register({
			id: PLUGIN_ID,
			namespace: PLUGIN_ID,
			displayName,
			version,
			capabilities: CORE_CAPABILITIES,
			api: runtimeApi,
		});
	}

	unregisterExtension(): void {
		this.extensionHandle?.unregister();
		this.extensionHandle = null;
	}

	registerActionProvider(provider: RegisterActionProviderInput): void {
		const client = this.connectInterop();
		if (!client || this.actionProviderHandle || this.providerRegistration) return;
		this.providerRegistration = client.registerActionProvider(provider)
			.then((handle) => {
				this.actionProviderHandle = handle;
			})
			.catch((error: unknown) => {
				console.error("TaskNotes Workflows action provider registration failed", error);
			})
			.finally(() => {
				this.providerRegistration = null;
			});
	}

	async replaceActionProvider(provider: RegisterActionProviderInput): Promise<void> {
		if (!this.interopAvailable) return;
		await this.unregisterActionProvider();
		this.registerActionProvider(provider);
		await this.providerRegistration;
	}

	async unregisterActionProvider(): Promise<void> {
		await this.providerRegistration;
		const handle = this.actionProviderHandle;
		this.actionProviderHandle = null;
		await handle?.dispose();
	}

	onTaskEvent(event: string, handler: (payload: unknown) => void): EventRef | null {
		const api = this.api;
		if (!api?.events?.on) return null;
		return api.events.on(event, handler);
	}

	onLifecycle(event: string, handler: (payload: unknown) => void): EventRef | null {
		const api = this.api;
		if (!api?.lifecycle?.on) return null;
		return api.lifecycle.on(event, handler);
	}

	listEvents(): TaskNotesRuntimeEventDefinition[] {
		const api = this.api;
		const events = api?.catalog?.events?.() ?? api?.events?.list?.();
		if (!events) return [];
		return events
			.filter((event) => typeof event.name === "string" && event.name.length > 0)
			.map((event) => ({ ...event }));
	}

	dynamicOptions(source: WorkflowDynamicFieldOptions | undefined): WorkflowFieldOption[] {
		if (!source) return [];
		const api = this.api;
		const catalog = api?.catalog;
		if (catalog) {
			if (source === "task-statuses") return namedCatalogOptions(catalog.statuses());
			if (source === "task-priorities") return namedCatalogOptions(catalog.priorities());
			if (source === "task-fields") return fieldCatalogOptions(catalog.fields());
			if (source === "task-writable-fields") return fieldCatalogOptions(catalog.writableFields());
			if (source === "task-filter-properties") return filterPropertyOptions(catalog.filterProperties());
			if (source === "task-filter-operators") return filterOperatorOptions(catalog.filterOperators());
			if (source === "task-dependency-rel-types") return namedCatalogOptions(catalog.dependencyRelTypes());
		}
		return [];
	}

	filterProperties(): TaskNotesRuntimeFilterPropertyDefinition[] {
		const properties = this.api?.catalog?.filterProperties?.() ?? [];
		return properties
			.filter((property) => property.queryable !== false)
			.map((property) => ({
				...property,
				supportedOperators: [...property.supportedOperators],
			}));
	}

	filterOperators(): TaskNotesRuntimeFilterOperatorDefinition[] {
		return [...(this.api?.catalog?.filterOperators?.() ?? [])];
	}

	validateTaskQuery(query: unknown): TaskNotesRuntimeQueryValidationResult | null {
		return this.api?.query?.validate(query) ?? null;
	}

	async explainTaskQuery(query: unknown): Promise<TaskNotesRuntimeQueryExplainResult | null> {
		if (!this.api?.query?.explain) return null;
		return await this.api.query.explain(query);
	}

	private mdbasePlugin(): MdbasePluginWithApi | null {
		const app = this.app as App & {
			plugins?: { getPlugin(id: string): unknown };
		};
		return app.plugins?.getPlugin("mdbase-obsidian") as MdbasePluginWithApi | null;
	}
}

function namedCatalogOptions(items: readonly unknown[]): WorkflowFieldOption[] {
	return items
		.map((item): WorkflowFieldOption | null => {
			if (!isRecord(item)) return null;
			const option = item as TaskNotesRuntimeCatalogOption;
			const value = stringOptionValue(option.value ?? option.id ?? option.name);
			if (!value) return null;
			return {
				value,
				label: stringOptionValue(option.label ?? option.displayName ?? option.name) ?? value,
			};
		})
		.filter((item): item is WorkflowFieldOption => item !== null);
}

function fieldCatalogOptions(items: readonly TaskNotesRuntimeFieldDefinition[]): WorkflowFieldOption[] {
	return items
		.map((field): WorkflowFieldOption | null => {
			const value = stringOptionValue(field.id);
			if (!value) return null;
			const label = field.frontmatterKey
				? `${field.label} (${field.frontmatterKey})`
				: field.label;
			return { value, label };
		})
		.filter((item): item is WorkflowFieldOption => item !== null);
}

function filterPropertyOptions(
	items: readonly TaskNotesRuntimeFilterPropertyDefinition[]
): WorkflowFieldOption[] {
	return items
		.map((property): WorkflowFieldOption | null => {
			const value = stringOptionValue(property.id);
			if (!value) return null;
			return { value, label: property.label || value };
		})
		.filter((item): item is WorkflowFieldOption => item !== null);
}

function filterOperatorOptions(
	items: readonly TaskNotesRuntimeFilterOperatorDefinition[]
): WorkflowFieldOption[] {
	return items.map((operator) => ({ value: operator.id, label: operator.label }));
}

function stringOptionValue(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
