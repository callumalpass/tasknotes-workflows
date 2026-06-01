import type { App, EventRef, TFile } from "obsidian";

export interface TaskNotesWorkflowsSettings {
	workflowFolder: string;
	workflowViewPath: string;
	autoCreateDefaultWorkflows: boolean;
	autoCreateWorkflowView: boolean;
	enableScheduledTriggers: boolean;
	enableTaskEventTriggers: boolean;
	enableObsidianTriggers: boolean;
	runLogRoot: string;
	runLogLevel: RunLogLevel;
	maxRunsPerWorkflow: number;
	maxHistoryEntries: number;
	minIntervalMs: number;
	uiLanguage: string;
}

export type RunLogLevel = "summary" | "inputs" | "inputs-and-outputs";

export interface WorkflowFile {
	file: TFile;
	body: string;
	frontmatterText: string;
	frontmatter: unknown;
}

export interface LoadedWorkflow {
	file: TFile;
	body: string;
	source: string;
	workflow: WorkflowDefinition | null;
	diagnostics: WorkflowDiagnostic[];
	lastRun?: RunSummary;
}

export interface WorkflowDiagnostic {
	severity: "error" | "warning";
	path: string;
	message: string;
}

export interface WorkflowDefinition {
	type: "tasknotes-workflow";
	schemaVersion: 1;
	id: string;
	name: string;
	enabled: boolean;
	description?: string;
	triggers: WorkflowTrigger[];
	vars: Record<string, unknown>;
	query?: Record<string, unknown>;
	conditions: WorkflowCondition[];
	steps: WorkflowStep[];
	run: WorkflowRunPolicy;
	debug?: WorkflowDebugSettings;
}

export type WorkflowTrigger =
	| TaskNotesEventTrigger
	| CronTrigger
	| IntervalTrigger
	| ManualTrigger
	| ObsidianVaultTrigger
	| ObsidianMetadataTrigger
	| ObsidianWorkspaceTrigger;

export interface WorkflowTriggerBase {
	id: string;
	type: string;
	debounce?: string;
	minimumInterval?: string;
}

export interface TaskNotesEventTrigger extends WorkflowTriggerBase {
	type: "tasknotes.event";
	event: string;
	from?: unknown;
	to?: unknown;
	path?: PathFilter;
	allowSelfTrigger?: boolean;
}

export interface CronTrigger extends WorkflowTriggerBase {
	type: "cron";
	schedule: string;
	timezone?: string;
	catchUp?: boolean;
}

export interface IntervalTrigger extends WorkflowTriggerBase {
	type: "interval";
	every: string;
}

export interface ManualTrigger extends WorkflowTriggerBase {
	type: "manual";
}

export interface ObsidianVaultTrigger extends WorkflowTriggerBase {
	type: "obsidian.vault";
	event: "create" | "modify" | "delete" | "rename";
	path?: PathFilter;
}

export interface ObsidianMetadataTrigger extends WorkflowTriggerBase {
	type: "obsidian.metadata";
	event: "changed" | "deleted" | "resolve" | "resolved";
	path?: PathFilter;
}

export interface ObsidianWorkspaceTrigger extends WorkflowTriggerBase {
	type: "obsidian.workspace";
	event: "file-open" | "active-leaf-change" | "layout-change";
	path?: PathFilter;
}

export interface PathFilter {
	glob?: string;
	extension?: string;
}

export interface WorkflowCondition {
	id?: string;
	field: string;
	operator: ConditionOperator;
	value?: unknown;
}

export type ConditionOperator =
	| "is"
	| "isNot"
	| "in"
	| "notIn"
	| "exists"
	| "missing"
	| "contains"
	| "startsWith"
	| "before"
	| "after"
	| "onOrBefore"
	| "onOrAfter";

export interface WorkflowStep {
	id: string;
	type: string;
	input?: Record<string, unknown>;
	if?: WorkflowCondition | WorkflowCondition[];
	forEach?: string;
}

export interface WorkflowRunPolicy {
	mode: "sequential";
	noOverlap: boolean;
	source: string;
	maxTasks: number;
	onError: "stop" | "continue";
	timeout?: string;
}

export interface WorkflowDebugSettings {
	logToVault?: boolean;
	folder?: string;
}

export interface WorkflowTriggerPayload {
	type: string;
	id?: string;
	event?: string;
	task?: Record<string, unknown>;
	before?: Record<string, unknown>;
	after?: Record<string, unknown>;
	changes?: Record<string, { before: unknown; after: unknown }>;
	source?: string;
	correlationId?: string;
	path?: string;
	file?: { path: string; name: string; extension: string };
	scheduledAt?: string;
	actualAt?: string;
	manual?: boolean;
	data?: unknown;
}

export interface WorkflowRunOptions {
	trigger: WorkflowTriggerPayload;
	dryRun?: boolean;
	manual?: boolean;
	sampleTaskPath?: string;
}

export interface WorkflowRunContext {
	workflow: {
		id: string;
		name: string;
		filePath: string;
	};
	trigger: WorkflowTriggerPayload;
	vars: Record<string, unknown>;
	steps: Record<string, unknown>;
	now: string;
	today: string;
	item?: unknown;
}

export interface WorkflowRunDetail {
	runId: string;
	workflowId: string;
	workflowName: string;
	workflowPath: string;
	dryRun: boolean;
	startedAt: string;
	endedAt?: string;
	durationMs?: number;
	status: WorkflowRunStatus;
	trigger: WorkflowTriggerPayload;
	steps: StepRunDetail[];
	error?: string;
}

export type WorkflowRunStatus = "success" | "failed" | "skipped" | "stopped";

export interface StepRunDetail {
	id: string;
	type: string;
	status: WorkflowRunStatus;
	startedAt: string;
	endedAt?: string;
	durationMs?: number;
	input?: unknown;
	output?: unknown;
	error?: string;
	errorCode?: string;
	errorStatus?: number;
	errorDetails?: unknown;
	itemIndex?: number;
}

export interface RunSummary {
	ts: string;
	runId: string;
	workflowId: string;
	workflowName: string;
	status: WorkflowRunStatus;
	trigger: string;
	durationMs: number;
	steps: number;
	dryRun: boolean;
	error?: string;
}

export interface StepDefinition {
	type: string;
	label: string;
	description: string;
	category: string;
	inputFields: WorkflowInputField[];
	outputFields: WorkflowOutputField[];
	examples: WorkflowStepExample[];
	mutatesTasks: boolean;
	writesVault?: boolean;
	supportsDryRun: boolean;
	supportsForEach: boolean;
	run(input: unknown, context: StepExecutionContext): Promise<unknown>;
}

export type WorkflowInputFieldType =
	| "text"
	| "textarea"
	| "number"
	| "boolean"
	| "date"
	| "select"
	| "taskPath"
	| "folder"
	| "taskQuery"
	| "json";

export interface WorkflowFieldOption {
	value: string;
	label: string;
}

export type WorkflowDynamicFieldOptions =
	| "task-statuses"
	| "task-priorities"
	| "task-fields"
	| "task-writable-fields"
	| "task-filter-properties"
	| "task-filter-operators"
	| "task-dependency-rel-types";

export interface WorkflowInputField {
	key: string;
	label: string;
	type: WorkflowInputFieldType;
	required?: boolean;
	description?: string;
	placeholder?: string;
	defaultValue?: unknown;
	options?: WorkflowFieldOption[];
	optionsFrom?: WorkflowDynamicFieldOptions;
	wide?: boolean;
}

export interface WorkflowOutputField {
	key: string;
	label: string;
	type: string;
	description?: string;
}

export interface WorkflowStepExample {
	label: string;
	input: Record<string, unknown>;
}

export interface StepExecutionContext {
	runId: string;
	dryRun: boolean;
	tasknotes: TaskNotesRuntimeApi | null;
	obsidian: WorkflowObsidianContext | null;
	notice(message: string): void;
	resolve(value: unknown, context: WorkflowRunContext): unknown;
	mutationContext(reason: string): TaskNotesMutationContext;
}

export interface WorkflowObsidianContext {
	app: App;
}

export interface TaskNotesMutationContext {
	source?: string;
	correlationId?: string;
	reason?: string;
}

export interface TaskNotesRuntimeApi {
	apiVersion: number;
	capabilities: readonly string[];
	hasCapability(capability: string): boolean;
	catalog?: {
		statuses(): readonly TaskNotesRuntimeCatalogOption[];
		priorities(): readonly TaskNotesRuntimeCatalogOption[];
		fields(): readonly TaskNotesRuntimeFieldDefinition[];
		writableFields(): readonly TaskNotesRuntimeFieldDefinition[];
		filterProperties(): readonly TaskNotesRuntimeFilterPropertyDefinition[];
		filterOperators(): readonly TaskNotesRuntimeFilterOperatorDefinition[];
		dependencyRelTypes(): readonly TaskNotesRuntimeCatalogOption[];
		events?(): readonly TaskNotesRuntimeEventDefinition[];
	};
	query?: {
		tasks(query?: TaskNotesRuntimeTaskQuery): Promise<TaskNotesRuntimeTaskQueryResult>;
		validate(query: unknown): TaskNotesRuntimeQueryValidationResult;
		normalize(query: unknown): TaskNotesRuntimeNormalizedTaskQuery;
		explain(query: unknown): Promise<TaskNotesRuntimeQueryExplainResult>;
		filterOptions(): Promise<unknown>;
	};
	tasks: {
		get(path: string): Promise<Record<string, unknown> | null>;
		list(query?: TaskNotesRuntimeTaskQuery): Promise<Record<string, unknown>[]>;
		create(input: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		update(path: string, patch: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		patch(path: string, patch: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		delete(path: string, context?: TaskNotesMutationContext): Promise<void>;
		complete(path: string, options?: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		uncomplete(path: string, options?: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		setStatus(path: string, status: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		setPriority(path: string, priority: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		setDue(path: string, date: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		clearDue(path: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		setScheduled(path: string, date: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		clearScheduled(path: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		reschedule(path: string, date: string | null, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		archive(path: string, archived: boolean, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		move(path: string, targetFolder: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		addTag(path: string, tag: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		removeTag(path: string, tag: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		addProject(path: string, project: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		removeProject(path: string, project: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		addContext(path: string, contextName: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		removeContext(path: string, contextName: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		addDependency(path: string, dependency: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		removeDependency(path: string, uid: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
	};
	relationships: {
		parents(path: string): Promise<Record<string, unknown>[]>;
		subtasks(path: string): Promise<Record<string, unknown>[]>;
		dependencies(path: string): Promise<ResolvedTaskDependency[]>;
		blocking(path: string): Promise<Record<string, unknown>[]>;
		all(path: string): Promise<TaskRelationshipSummary>;
	};
	time: {
		start(path: string, options?: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		stop(path: string, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		append(path: string, entry: Record<string, unknown>, context?: TaskNotesMutationContext): Promise<Record<string, unknown>>;
		active(): Promise<unknown[]>;
	};
	settings?: {
		snapshot(): Record<string, unknown>;
	};
	lifecycle?: {
		ready?(): Promise<void>;
		isReady?(): boolean;
		on(event: string, handler: (payload: unknown) => void): EventRef;
		off(ref: EventRef): void;
		list?(): readonly TaskNotesRuntimeLifecycleEventDefinition[];
	};
	errors?: {
		isApiError?(error: unknown): boolean;
		normalize(error: unknown): TaskNotesApiErrorPayload;
		toResult?<T>(operation: () => Promise<T> | T): Promise<TaskNotesApiResult<T>>;
	};
	events: {
		on(event: string, handler: (payload: WorkflowTriggerPayload) => void): EventRef;
		off(ref: EventRef): void;
		list?(): readonly TaskNotesRuntimeEventDefinition[];
	};
	extensions?: {
		register<TApi>(extension: {
			id: string;
			namespace: string;
			displayName?: string;
			version?: string;
			capabilities?: readonly string[];
			api: TApi;
		}): { unregister(): void };
	};
}

export interface TaskNotesRuntimeCatalogOption {
	id?: string;
	value?: string;
	label?: string;
	name?: string;
	displayName?: string;
}

export interface TaskNotesRuntimeFieldDefinition {
	id: string;
	label: string;
	valueType: TaskNotesRuntimeFieldValueType;
	source: TaskNotesRuntimeFieldSource;
	writable: boolean;
	queryable?: boolean;
	sortable?: boolean;
	groupable?: boolean;
	supportedOperators?: readonly TaskNotesRuntimeOperator[];
	frontmatterKey?: string;
	description?: string;
}

export type TaskNotesRuntimeFieldSource = "model" | "computed" | "file" | "user";

export type TaskNotesRuntimeFieldValueType =
	| "string"
	| "number"
	| "boolean"
	| "date"
	| "datetime"
	| "string[]"
	| "timeEntry[]"
	| "dependency[]"
	| "reminder[]"
	| "unknown";

export type TaskNotesRuntimeOperator =
	| "eq"
	| "ne"
	| "contains"
	| "notContains"
	| "in"
	| "notIn"
	| "exists"
	| "missing"
	| "lt"
	| "lte"
	| "gt"
	| "gte"
	| "isTrue"
	| "isFalse";

export interface TaskNotesRuntimeFilterOperatorDefinition {
	id: TaskNotesRuntimeOperator;
	label: string;
	valueRequired: boolean;
	appliesTo: readonly TaskNotesRuntimeFieldValueType[];
	aliases?: readonly string[];
}

export interface TaskNotesRuntimeFilterPropertyDefinition {
	id: string;
	label: string;
	category: string;
	valueType: TaskNotesRuntimeFieldValueType;
	source: TaskNotesRuntimeFieldSource;
	queryable: boolean;
	sortable: boolean;
	groupable: boolean;
	supportedOperators: readonly TaskNotesRuntimeOperator[];
	aliases?: readonly string[];
	frontmatterKey?: string;
	valueInputType: string;
}

export interface TaskNotesRuntimeTaskQuery {
	where?: TaskNotesRuntimePredicate;
	sort?: TaskNotesRuntimeSort[];
	limit?: number;
	offset?: number;
	group?: TaskNotesRuntimeGroup[];
	scope?: TaskNotesRuntimeQueryScope;
}

export type TaskNotesRuntimePredicate =
	| { all: TaskNotesRuntimePredicate[] }
	| { any: TaskNotesRuntimePredicate[] }
	| { not: TaskNotesRuntimePredicate }
	| TaskNotesRuntimeCondition;

export interface TaskNotesRuntimeCondition {
	field: string;
	op: TaskNotesRuntimeOperator | (string & {});
	value?: TaskNotesRuntimeValue;
}

export type TaskNotesRuntimeValue =
	| string
	| number
	| boolean
	| null
	| TaskNotesRuntimeValue[]
	| { fn: "today" | "now" }
	| { fn: "date"; value: string }
	| { fn: "dateAdd"; value: TaskNotesRuntimeValue; amount: number; unit: "day" | "week" | "month" };

export interface TaskNotesRuntimeSort {
	field: string;
	direction?: "asc" | "desc";
}

export interface TaskNotesRuntimeGroup {
	field: string;
}

export interface TaskNotesRuntimeQueryScope {
	includeArchived?: boolean;
	folders?: string[];
	excludeFolders?: string[];
}

export interface TaskNotesRuntimeNormalizedTaskQuery {
	where?: TaskNotesRuntimeNormalizedPredicate;
	sort: TaskNotesRuntimeSort[];
	limit?: number;
	offset: number;
	group: TaskNotesRuntimeGroup[];
	scope: Required<Pick<TaskNotesRuntimeQueryScope, "includeArchived">> &
		Omit<TaskNotesRuntimeQueryScope, "includeArchived">;
}

export type TaskNotesRuntimeNormalizedPredicate =
	| { all: TaskNotesRuntimeNormalizedPredicate[] }
	| { any: TaskNotesRuntimeNormalizedPredicate[] }
	| { not: TaskNotesRuntimeNormalizedPredicate }
	| TaskNotesRuntimeNormalizedCondition;

export interface TaskNotesRuntimeNormalizedCondition {
	field: string;
	op: TaskNotesRuntimeOperator;
	value?: TaskNotesRuntimeValue;
}

export interface TaskNotesRuntimeQueryIssue {
	path: string;
	code: string;
	message: string;
}

export interface TaskNotesRuntimeQueryWarning {
	path: string;
	code: string;
	message: string;
}

export interface TaskNotesRuntimeQueryValidationResult {
	valid: boolean;
	issues: TaskNotesRuntimeQueryIssue[];
	warnings: TaskNotesRuntimeQueryWarning[];
	normalized?: TaskNotesRuntimeNormalizedTaskQuery;
}

export interface TaskNotesRuntimeQueryGroup {
	key: string;
	label: string;
	taskPaths: string[];
}

export interface TaskNotesRuntimeQueryExplainResult {
	valid: boolean;
	query?: TaskNotesRuntimeNormalizedTaskQuery;
	issues: TaskNotesRuntimeQueryIssue[];
	warnings: TaskNotesRuntimeQueryWarning[];
	total?: number;
	matched?: number;
	returned?: number;
	groups?: TaskNotesRuntimeQueryGroup[];
	appliedSort?: TaskNotesRuntimeSort[];
	appliedLimit?: number;
	appliedOffset?: number;
	notes: string[];
}

export interface TaskNotesRuntimeTaskQueryResult {
	tasks: Record<string, unknown>[];
	total: number;
	matched: number;
	returned: number;
	groups?: TaskNotesRuntimeQueryGroup[];
	query: TaskNotesRuntimeNormalizedTaskQuery;
	warnings?: TaskNotesRuntimeQueryWarning[];
}

export interface TaskNotesRuntimeLifecycleEventDefinition {
	name: string;
	label: string;
	description?: string;
	category?: string;
}

export interface TaskNotesApiErrorPayload {
	name: "TaskNotesApiError";
	code: string;
	message: string;
	status: number;
	details?: unknown;
}

export type TaskNotesApiResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: TaskNotesApiErrorPayload };

export interface ResolvedTaskDependency {
	dependency: Record<string, unknown>;
	task: Record<string, unknown> | null;
	path: string | null;
}

export interface TaskRelationshipSummary {
	task: Record<string, unknown>;
	parents: Record<string, unknown>[];
	subtasks: Record<string, unknown>[];
	dependencies: ResolvedTaskDependency[];
	blocking: Record<string, unknown>[];
}

export interface TaskNotesRuntimeEventDefinition {
	name: string;
	label: string;
	description?: string;
	category?: string;
}

export interface WorkflowsRuntimeApi {
	listWorkflows(): LoadedWorkflow[];
	listStepDefinitions(): WorkflowStepDefinitionSummary[];
	runWorkflow(workflowId: string, input?: Partial<WorkflowRunOptions>): Promise<WorkflowRunDetail>;
	dryRunWorkflow(workflowId: string, input?: Partial<WorkflowRunOptions>): Promise<WorkflowRunDetail>;
	reloadWorkflows(): Promise<void>;
	validateWorkflows(): Promise<LoadedWorkflow[]>;
	recentRuns(workflowId?: string): Promise<RunSummary[]>;
}

export type WorkflowStepDefinitionSummary = Omit<StepDefinition, "run">;
