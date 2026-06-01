import type { App, EventRef } from "obsidian";
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
