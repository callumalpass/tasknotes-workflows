export const PLUGIN_ID = "tasknotes-workflows";
export const WORKFLOW_BASE_VIEW_TYPE = "tasknotesWorkflows";
export const WORKFLOW_TYPE = "tasknotes-workflow";
export const DEFAULT_WORKFLOW_FOLDER = "TaskNotes/Workflows";
export const DEFAULT_WORKFLOW_VIEW_PATH = "TaskNotes/Views/workflows.base";
export const DEFAULT_SOURCE = "tasknotes-workflows";

export const CORE_CAPABILITIES = [
	"tasknotes-workflows.read",
	"tasknotes-workflows.write",
	"tasknotes-workflows.run",
	"tasknotes-workflows.dryrun",
	"tasknotes-workflows.steps.describe",
	"tasknotes-workflows.events",
	"tasknotes-workflows.logs",
] as const;
