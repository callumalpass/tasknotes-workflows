import { DEFAULT_WORKFLOW_FOLDER, DEFAULT_WORKFLOW_VIEW_PATH } from "./constants";
import type { TaskNotesWorkflowsSettings } from "./types";

export const DEFAULT_SETTINGS: TaskNotesWorkflowsSettings = {
	workflowFolder: DEFAULT_WORKFLOW_FOLDER,
	workflowViewPath: DEFAULT_WORKFLOW_VIEW_PATH,
	autoCreateDefaultWorkflows: true,
	autoCreateWorkflowView: true,
	enableScheduledTriggers: true,
	enableTaskEventTriggers: true,
	enableObsidianTriggers: false,
	runLogRoot: "",
	runLogLevel: "inputs-and-outputs",
	maxRunsPerWorkflow: 100,
	maxHistoryEntries: 1000,
	minIntervalMs: 60_000,
};

export function normalizeSettings(input: Partial<TaskNotesWorkflowsSettings>): TaskNotesWorkflowsSettings {
	return {
		...DEFAULT_SETTINGS,
		...input,
		workflowFolder: input.workflowFolder?.trim() || DEFAULT_SETTINGS.workflowFolder,
		workflowViewPath: input.workflowViewPath?.trim() || DEFAULT_SETTINGS.workflowViewPath,
		runLogRoot: input.runLogRoot?.trim() || DEFAULT_SETTINGS.runLogRoot,
		maxRunsPerWorkflow: Math.max(10, input.maxRunsPerWorkflow ?? DEFAULT_SETTINGS.maxRunsPerWorkflow),
		maxHistoryEntries: Math.max(50, input.maxHistoryEntries ?? DEFAULT_SETTINGS.maxHistoryEntries),
		minIntervalMs: Math.max(30_000, input.minIntervalMs ?? DEFAULT_SETTINGS.minIntervalMs),
	};
}
