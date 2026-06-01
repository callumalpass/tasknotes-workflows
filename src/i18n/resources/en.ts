import type { TranslationTree } from "../types";

export const en: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "Cancel",
		clear: "Clear",
		continue: "Continue",
		disabled: "Disabled",
		enabled: "Enabled",
		inputs: "Inputs",
		maintain: "Maintain",
		output: "Output",
		outputs: "Outputs",
		save: "Save",
		saved: "Saved",
		stop: "Stop",
		summary: "Summary",
		systemDefault: "System default",
		unsavedChanges: "Unsaved changes",
		runStatus: {
			success: "success",
			failed: "failed",
			skipped: "skipped",
			stopped: "stopped",
		},
		workflowStatus: {
			enabled: "enabled",
			disabled: "disabled",
			invalid: "invalid",
		},
		languages: {
			en: "English",
		},
	},
	commands: {
		openWorkflows: "Open workflows",
		newWorkflow: "New workflow",
		reloadWorkflows: "Reload workflows",
		maintainDefaultWorkflows: "Maintain default workflow files",
		runWorkflow: "Run: {name}",
	},
	notices: {
		languageChanged: "Language changed to {language}.",
		workflowsReloaded: "Workflows reloaded.",
		defaultFilesCreated: "Created {count} default {fileLabel}.",
		defaultFilesAlreadyPresent: "Default workflow files are already present.",
		workflowCommandUnavailable: "Workflow command is no longer available.",
		workflowRunCompleted: "Run {status}: {name}",
		workflowDryRunCompleted: "Dry run {status}: {name}",
		workflowBaseNotFound: "Workflow base not found: {path}",
		runHistoryCleared: "Workflow run history cleared.",
		workflowSaved: "Saved workflow: {name}",
		discardChanges: "Unsaved changes. Press Cancel again to discard.",
		discardAndOpenNote: "Unsaved changes. Press Open note again to discard and open the note.",
	},
	settings: {
		workflowFiles: {
			heading: "Workflow files",
			folder: {
				name: "Workflow folder",
				description: "Vault folder containing Markdown workflow definitions.",
			},
			base: {
				name: "Workflow base",
				description: "Vault path for the generated bases workflow view.",
			},
			createDefaults: {
				name: "Create workflow defaults",
				description: "Write example workflow notes when the plugin loads or when defaults are maintained.",
			},
			createBase: {
				name: "Create workflow base",
				description: "Write the generated bases workflow view when the plugin loads or when defaults are maintained.",
			},
			maintainDefaults: {
				name: "Maintain defaults",
				description: "Create missing workflow notes and the workflow base without overwriting existing files.",
			},
		},
		triggers: {
			heading: "Triggers",
			tasknotesEvents: {
				name: "TaskNotes event triggers",
				description: "Run workflows from TaskNotes runtime API events such as task.status.changed.",
			},
			scheduled: {
				name: "Scheduled triggers",
				description: "Run cron and interval workflows while Obsidian is open.",
			},
			obsidian: {
				name: "Advanced Obsidian triggers",
				description: "Allow Obsidian vault and workspace triggers. Keep path filters narrow.",
			},
			minInterval: {
				name: "Minimum interval",
				description: "Lowest allowed interval trigger frequency in milliseconds.",
			},
		},
		runLogs: {
			heading: "Run logs",
			folder: {
				name: "Run log folder",
				description: "Optional vault path for run summaries and detail files. Leave blank to use this plugin's config folder.",
			},
			level: {
				name: "Run log level",
				description: "Controls how much detail is kept in run records.",
				options: {
					summary: "Summary",
					inputs: "Inputs",
					inputsAndOutputs: "Inputs and outputs",
				},
			},
			retention: {
				name: "Runs retained per workflow",
				description: "Old detail files are deleted after this limit.",
			},
			clear: {
				name: "Clear run history",
				description: "Delete plugin-local workflow run logs.",
			},
		},
		language: {
			heading: "Interface language",
			description: "Change the language of TaskNotes Workflows commands, settings, notices, and views.",
			name: "UI language",
			dropdownDescription: "Select the language used for TaskNotes Workflows interface text.",
		},
	},
	baseView: {
		title: "Workflows",
		tasknotesAvailable: "TaskNotes runtime API is available.",
		tasknotesUnavailable: "TaskNotes runtime API is unavailable; task-writing steps cannot run.",
		empty: "No workflows found",
		newWorkflow: "New workflow",
	},
	workflowCard: {
		labels: {
			triggers: "Triggers",
			steps: "Steps",
			lastRun: "Last run",
			noOverlap: "no overlap",
		},
		tooltips: {
			edit: "Edit workflow",
			dryRun: "Dry run workflow",
			run: "Run workflow",
			history: "Run history",
			openNote: "Open workflow note",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: " -> {value}",
			cron: "cron {schedule}",
			interval: "every {every}",
			vault: "vault {event}",
			metadata: "metadata {event}",
			workspace: "workspace {event}",
			manual: "manual",
		},
	},
	runHistory: {
		title: "Run history",
		runs: "Runs",
		latest: "Latest",
		trigger: "Trigger",
		duration: "Duration",
		runId: "Run ID",
		dryRun: "dry run",
		stepCount: {
			one: "{count} step",
			other: "{count} steps",
		},
		input: "Input",
		output: "Output",
		empty: {
			diagnostics: "Workflow diagnostics must be fixed before runs can be shown.",
			loading: "Loading run history...",
			noRuns: "No runs recorded yet.",
			missingDetail: "Run detail was not found.",
		},
	},
	engine: {
		workflowInvalid: "Workflow is invalid: {path}",
		workflowAlreadyRunning: "Workflow is already running.",
		workflowDisabled: "Workflow is disabled.",
		conditionsDidNotMatch: "Workflow conditions did not match.",
		stepFailed: "Step failed.",
		unknownStepType: "Unknown step type: {type}",
		forEachNonArray: "forEach resolved to a non-array value.",
		forEachTooManyItems: "forEach selected {count} items, above run.maxTasks {max}.",
	},
	editor: {
		title: {
			edit: "Edit workflow",
			new: "New workflow",
		},
		untitledWorkflow: "Untitled workflow",
		workflowEditor: "Workflow editor",
		sections: {
			definition: {
				label: "Definition",
				description: "Name and identity",
				title: "Definition",
				body: "Name this workflow and keep its stable identity.",
			},
			triggers: {
				label: "Triggers",
				description: "Start events",
				title: "Triggers",
				body: "Run the workflow manually, on a schedule, from TaskNotes events, or from selected Obsidian events.",
			},
			steps: {
				label: "Steps",
				description: "Actions",
				title: "Steps",
				body: "Steps run from top to bottom. Outputs from earlier steps can be referenced by later steps.",
			},
			run: {
				label: "Run policy",
				description: "Limits and errors",
				title: "Run policy",
				body: "Choose the default failure behavior. The safety limits can stay on their defaults for most workflows.",
			},
		},
		summary: {
			triggerCount: {
				one: "{count} trigger",
				other: "{count} triggers",
			},
			stepCount: {
				one: "{count} step",
				other: "{count} steps",
			},
			noOverlap: "No overlap",
			overlapAllowed: "Overlap allowed",
			enabledDescription: "Manual, scheduled, and event triggers can run.",
			disabledDescription: "Manual, scheduled, and event triggers will not run.",
		},
		definition: {
			name: "Name",
			description: "Description",
			descriptionPlaceholder: "Optional note for why this workflow exists.",
			id: "ID",
			advancedTitle: "Advanced identity",
			advancedDescription: "Stable ids are used for commands, saved runs, and references from other workflows.",
		},
		triggers: {
			addTitle: "Add trigger",
			addDescription: "Additional triggers start the same workflow.",
			addButton: "Add trigger",
			type: "Trigger type",
			id: "ID",
			typeLabel: "Type",
			tasknotesEvent: "TaskNotes event",
			fromStatus: "From status",
			toStatus: "To status",
			pathGlob: "Path glob",
			allowSelfTrigger: "Allow self-trigger",
			schedule: "Schedule",
			timezone: "Timezone",
			catchUp: "Catch up",
			every: "Every",
			event: "Event",
			manualHelp: "Manual runs appear in the command palette when the workflow is enabled.",
			valuesAvailable: "Trigger values available to steps ({count})",
			advancedTitle: "Advanced trigger options",
			advancedDescription: "Limit matching, preserve a stable id, and control replay behavior.",
			needsAttention: "Needs attention",
			tooltips: {
				moveUp: "Move up",
				moveDown: "Move down",
				delete: "Delete trigger",
			},
			types: {
				manual: {
					label: "Manual",
					description: "Runs only when explicitly started.",
				},
				tasknotesEvent: {
					label: "TaskNotes event",
					description: "Runs when TaskNotes emits the selected runtime event.",
				},
				cron: {
					label: "Cron schedule",
					description: "Runs when the five-part cron schedule matches the current minute.",
				},
				interval: {
					label: "Interval",
					description: "Runs repeatedly while Obsidian is open.",
				},
				obsidianVault: {
					label: "Vault file event",
					description: "Runs when Obsidian creates, modifies, deletes, or renames a file.",
				},
				obsidianMetadata: {
					label: "Metadata event",
					description: "Runs when Obsidian metadata changes or resolves.",
				},
				obsidianWorkspace: {
					label: "Workspace event",
					description: "Runs when selected workspace activity occurs, such as opening a file or changing the active leaf.",
				},
			},
			events: {
				create: "Create",
				modify: "Modify",
				delete: "Delete",
				rename: "Rename",
				changed: "Changed",
				deleted: "Deleted",
				resolve: "Resolve",
				resolved: "Resolved",
				fileOpen: "File open",
				activeLeafChange: "Active leaf changed",
				layoutChange: "Layout changed",
			},
			tasknotesEvents: {
				task: {
					created: "Task created",
					updated: "Task updated",
					deleted: "Task deleted",
					moved: "Task moved",
					status: {
						changed: "Task status changed",
					},
					completed: "Task completed",
					uncompleted: "Task uncompleted",
					archived: "Task archived",
					unarchived: "Task unarchived",
					scheduled: {
						changed: "Task scheduled date changed",
					},
					due: {
						changed: "Task due date changed",
					},
					priority: {
						changed: "Task priority changed",
					},
					tags: {
						changed: "Task tags changed",
					},
					contexts: {
						changed: "Task contexts changed",
					},
					projects: {
						changed: "Task projects changed",
					},
					reminders: {
						changed: "Task reminders changed",
					},
					dependencies: {
						changed: "Task dependencies changed",
					},
					recurrence: {
						changed: "Task recurrence changed",
					},
				},
				time: {
					started: "Time tracking started",
					stopped: "Time tracking stopped",
				},
				pomodoro: {
					started: "Pomodoro started",
					completed: "Pomodoro completed",
					interrupted: "Pomodoro interrupted",
				},
				recurring: {
					instance: {
						completed: "Recurring instance completed",
						skipped: "Recurring instance skipped",
					},
				},
			},
			summary: {
				statusFromTo: "Status changes from {from} to {to}",
				statusTo: "Status changes to {to}",
				statusFrom: "Status changes from {from}",
				schedule: "Schedule {schedule}",
				every: "Every {every}",
				vaultFile: "Vault file {event}",
				metadata: "Metadata {event}",
				workspace: "Workspace {event}",
				manual: "Manual run",
			},
			outputs: {
				type: {
					label: "Type",
					description: "The trigger kind.",
				},
				id: {
					label: "ID",
					description: "The trigger ID from this workflow.",
				},
				event: {
					label: "Event",
					description: "The event name that started the run.",
				},
				actualAt: {
					label: "Actual time",
					description: "When the workflow run started.",
				},
				after: {
					path: {
						label: "Task path",
						description: "The task path after the event.",
					},
					title: {
						label: "Task title",
						description: "The task title after the event.",
					},
					status: {
						label: "Current status",
						description: "The task status after the event.",
					},
				},
				before: {
					status: {
						label: "Previous status",
						description: "The task status before the event.",
					},
				},
				changes: {
					label: "Changes",
					description: "Changed fields keyed by property name.",
				},
				source: {
					label: "Source",
					description: "The mutation source, when provided.",
				},
				correlationId: {
					label: "Correlation ID",
					description: "The mutation correlation ID, when provided.",
				},
				scheduledAt: {
					label: "Scheduled time",
					description: "The schedule tick time.",
				},
				path: {
					label: "Path",
					description: "The matching vault file path.",
				},
				file: {
					path: {
						label: "File path",
						description: "The matching file path.",
					},
					name: {
						label: "File name",
						description: "The matching file name.",
					},
					extension: {
						label: "Extension",
						description: "The matching file extension.",
					},
				},
				data: {
					label: "Data",
					description: "Extra event data, when provided.",
				},
				manual: {
					label: "Manual",
					description: "True for a manual run.",
				},
			},
		},
		steps: {
			addTitle: "Add next step",
			addDescription: "The new step will run after the steps above.",
			addButton: "Add step",
			type: "Step type",
			id: "ID",
			advancedTitle: "Advanced step options",
			advancedDescription: "Stable ids create references for later steps. Batch runs use the optional for each value.",
			forEach: "For each",
			forEachHelp: "Optional array reference for batch steps.",
			inputJson: "Input JSON",
			writes: "writes",
			needsAttention: "Needs attention",
			outputsAvailable: "Outputs available to later steps ({count})",
			tooltips: {
				moveUp: "Move up",
				moveDown: "Move down",
				delete: "Delete step",
			},
			unknownCategory: "Other",
			summary: {
				forEach: "for each {value}",
			},
		},
		runPolicy: {
			noOverlap: "No overlap",
			onError: "On error",
			advancedTitle: "Advanced run limits",
			advancedDescription: "These values keep automated runs identifiable and bounded.",
			maxTasks: "Max tasks",
			source: "Source",
		},
		footer: {
			openNote: "Open note",
		},
		templateSuggestions: {
			workflowId: "Workflow id",
			workflowName: "Workflow name",
			today: "Today",
			now: "Now",
			itemPath: "Current item path",
			triggerValue: "Trigger {label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "Name is required.",
			invalidWorkflowId: "Use lowercase letters, numbers, dots, underscores, or dashes. Start with a letter.",
			duplicateWorkflowId: "Already used by {path}.",
			triggerRequired: "Add at least one trigger.",
			invalidTriggerId: "Trigger id must start with a letter and use id-safe characters.",
			duplicateTriggerId: "Trigger ids must be unique.",
			tasknotesEventRequired: "Choose a TaskNotes event.",
			cronScheduleRequired: "Add a cron schedule.",
			intervalRequired: "Add an interval.",
			stepRequired: "Add at least one step.",
			invalidStepId: "Step id must start with a letter and use id-safe characters.",
			duplicateStepId: "Step ids must be unique.",
			unknownStepType: "Unknown step type: {type}",
			fieldRequired: "{field} is required.",
			positiveNumber: "Use a positive number.",
			jsonObject: "Step input must be a JSON object.",
		},
		query: {
			preview: "Preview",
			previewUnavailable: "TaskNotes query preview is unavailable.",
			previewResult: "Query matches {matched} of {total} tasks and returns {returned}.",
			runtimeUnavailable: "Load TaskNotes to edit query fields from the runtime catalog.",
			advancedOnly: "This query uses nesting or negation. Edit the JSON directly.",
			valid: "TaskNotes accepts this query.",
			invalid: "TaskNotes query is invalid.",
			match: "Match",
			matchAll: "All conditions",
			matchAny: "Any condition",
			addCondition: "Add condition",
			removeCondition: "Remove condition",
			noConditions: "No conditions. The query will match all tasks in scope.",
			field: "Field",
			operator: "Operator",
			value: "Value",
			noValue: "No value",
			true: "True",
			false: "False",
			options: "Sort, group, and scope",
			optionsDescription: "Optional result controls for this task query.",
			sortField: "Sort by",
			sortDirection: "Direction",
			ascending: "Ascending",
			descending: "Descending",
			groupField: "Group by",
			limit: "Limit",
			includeArchived: "Include archived tasks",
			none: "None",
			jsonTitle: "Advanced JSON",
			jsonDescription: "Use this for nested groups, negation, date math, folders, offsets, or exact API input.",
			jsonLabel: "Runtime query JSON",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "Task relationships",
			timeTracking: "Time tracking",
			obsidian: "Obsidian",
			controlFlow: "Control flow",
		},
		common: {
			task: {
				label: "Task",
				description: "Vault path to a TaskNotes task. Triggered task workflows usually use {{trigger.after.path}}.",
			},
			path: {
				label: "Path",
				description: "Vault path to a Markdown file.",
			},
			outputTask: {
				label: "Task",
				description: "Updated TaskNotes task data.",
			},
			outputPath: {
				label: "Path",
				description: "Vault path of the task after the step completes.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "Get task",
					description: "Reads one task by path.",
					examples: {
						0: {
							label: "Read the triggering task",
						},
					},
				},
				query: {
					label: "Query tasks",
					description: "Selects tasks with the TaskNotes runtime query API.",
					input: {
						query: {
							label: "Query",
							description: "Runtime task query using TaskNotes fields, operators, sort, grouping, and limit.",
						},
					},
					output: {
						tasks: {
							label: "Tasks",
							description: "The matching TaskNotes tasks.",
						},
						count: {
							label: "Count",
							description: "Number of returned tasks.",
						},
						total: {
							label: "Total",
							description: "Total tasks before filtering.",
						},
						matched: {
							label: "Matched",
							description: "Tasks matching the query before offset and limit.",
						},
						returned: {
							label: "Returned",
							description: "Tasks returned after offset and limit.",
						},
						groups: {
							label: "Groups",
							description: "TaskNotes query group details.",
						},
						groupPaths: {
							label: "Group paths",
							description: "Task paths keyed by group key.",
						},
						query: {
							label: "Query",
							description: "The normalized TaskNotes runtime query.",
						},
						warnings: {
							label: "Warnings",
							description: "Non-fatal TaskNotes query warnings.",
						},
					},
					examples: {
						0: {
							label: "Open tasks",
						},
					},
				},
				parents: {
					label: "Get parent tasks",
					description: "Reads parent tasks linked from the task's projects.",
				},
				subtasks: {
					label: "Get subtasks",
					description: "Reads tasks that reference this task as a project.",
				},
				blocking: {
					label: "Get blocking tasks",
					description: "Reads tasks that are blocked by this task.",
				},
				dependencies: {
					label: "Get dependencies",
					description: "Reads the tasks that block this task.",
					output: {
						dependencies: {
							label: "Dependencies",
							description: "Dependency objects with resolved TaskNotes task data when available.",
						},
						tasks: {
							label: "Tasks",
							description: "Resolved dependency tasks.",
						},
						count: {
							label: "Count",
							description: "Number of dependencies.",
						},
					},
					examples: {
						0: {
							label: "Read triggering task dependencies",
						},
					},
				},
				relationships: {
					label: "Get relationships",
					description: "Reads parents, subtasks, dependencies, and blocking tasks for one task.",
					output: {
						task: {
							label: "Task",
							description: "The task.",
						},
						parents: {
							label: "Parents",
							description: "Parent tasks.",
						},
						subtasks: {
							label: "Subtasks",
							description: "Subtasks.",
						},
						dependencies: {
							label: "Dependencies",
							description: "Tasks that block this task.",
						},
						blocking: {
							label: "Blocking",
							description: "Tasks blocked by this task.",
						},
					},
					examples: {
						0: {
							label: "Read all relationships",
						},
					},
				},
				create: {
					label: "Create task",
					description: "Creates a new TaskNotes task.",
					input: {
						title: {
							label: "Title",
						},
						status: {
							label: "Status",
						},
						priority: {
							label: "Priority",
						},
						due: {
							label: "Due",
						},
						scheduled: {
							label: "Scheduled",
						},
						details: {
							label: "Details",
						},
					},
					examples: {
						0: {
							label: "Create an inbox task",
						},
					},
				},
				patch: {
					label: "Patch task",
					description: "Updates task fields.",
					input: {
						patch: {
							label: "Patch",
							description: "Task fields to update, such as status, priority, due, scheduled, tags, projects, or contexts.",
						},
					},
					examples: {
						0: {
							label: "Mark active",
						},
					},
				},
				set: {
					label: "Set task fields",
					description: "Alias for task.patch.",
					input: {
						patch: {
							label: "Fields",
							description: "Task fields to set.",
						},
					},
				},
				move: {
					label: "Move task",
					description: "Moves a task note.",
					input: {
						targetFolder: {
							label: "Target folder",
						},
					},
					examples: {
						0: {
							label: "Move triggering task",
						},
					},
				},
				archive: {
					label: "Archive task",
					description: "Archives a task.",
				},
				unarchive: {
					label: "Unarchive task",
					description: "Unarchives a task.",
				},
				complete: {
					label: "Complete task",
					description: "Marks a task complete.",
					input: {
						options: {
							status: {
								label: "Completed status",
							},
						},
					},
				},
				uncomplete: {
					label: "Uncomplete task",
					description: "Reopens a completed task.",
					input: {
						options: {
							status: {
								label: "Reopened status",
							},
						},
					},
				},
				reschedule: {
					label: "Reschedule task",
					description: "Sets or clears scheduled date.",
					input: {
						date: {
							label: "Scheduled date",
						},
					},
				},
				setDue: {
					label: "Set due date",
					description: "Set due date",
					input: {
						date: {
							label: "Due date",
						},
					},
				},
				clearDue: {
					label: "Clear due date",
					description: "Clear due date",
				},
				setScheduled: {
					label: "Set scheduled date",
					description: "Set scheduled date",
					input: {
						date: {
							label: "Scheduled date",
						},
					},
				},
				clearScheduled: {
					label: "Clear scheduled date",
					description: "Clear scheduled date",
				},
				addTag: {
					label: "Add tag",
					description: "Add tag",
					input: {
						tag: {
							label: "Tag",
						},
					},
				},
				removeTag: {
					label: "Remove tag",
					description: "Remove tag",
					input: {
						tag: {
							label: "Tag",
						},
					},
				},
				addProject: {
					label: "Add project",
					description: "Add project",
					input: {
						project: {
							label: "Project",
						},
					},
				},
				removeProject: {
					label: "Remove project",
					description: "Remove project",
					input: {
						project: {
							label: "Project",
						},
					},
				},
				addContext: {
					label: "Add context",
					description: "Add context",
					input: {
						context: {
							label: "Context",
						},
					},
				},
				removeContext: {
					label: "Remove context",
					description: "Remove context",
					input: {
						context: {
							label: "Context",
						},
					},
				},
				addDependency: {
					label: "Add dependency",
					description: "Adds a blocking dependency.",
					input: {
						dependency: {
							label: "Dependency",
						},
					},
				},
				removeDependency: {
					label: "Remove dependency",
					description: "Removes a dependency.",
					input: {
						uid: {
							label: "Dependency ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "Start timer",
					description: "Starts time tracking.",
					input: {
						options: {
							description: {
								label: "Description",
							},
						},
					},
					output: {
						startedAt: {
							label: "Started at",
							description: "ISO timestamp recorded by the workflow run.",
						},
					},
				},
				stop: {
					label: "Stop timer",
					description: "Stops time tracking.",
					output: {
						stoppedAt: {
							label: "Stopped at",
							description: "ISO timestamp recorded by the workflow run.",
						},
					},
				},
				appendEntry: {
					label: "Append time entry",
					description: "Adds a time entry.",
					input: {
						entry: {
							label: "Entry",
						},
					},
				},
			},
			notice: {
				show: {
					label: "Show notice",
					description: "Shows an Obsidian notice.",
					input: {
						message: {
							label: "Message",
						},
					},
					output: {
						message: {
							label: "Message",
						},
					},
					examples: {
						0: {
							label: "Show task title",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "Open file",
					description: "Opens a vault file in the workspace.",
					input: {
						newLeaf: {
							label: "Open in",
							options: {
								current: "Current leaf",
								tab: "New tab",
								split: "Split",
								window: "Popout window",
							},
						},
					},
					output: {
						opened: {
							label: "Opened",
						},
						newLeaf: {
							label: "Open target",
						},
					},
					examples: {
						0: {
							label: "Open triggering file",
						},
					},
				},
				createNote: {
					label: "Create note",
					description: "Creates a Markdown note in the vault.",
					input: {
						content: {
							label: "Content",
						},
					},
					output: {
						created: {
							label: "Created",
						},
					},
					examples: {
						0: {
							label: "Create a dated note",
						},
					},
				},
				appendNote: {
					label: "Append to note",
					description: "Appends text to an existing Markdown note.",
					input: {
						text: {
							label: "Text",
						},
					},
					output: {
						appended: {
							label: "Appended",
						},
						length: {
							label: "Length",
						},
					},
					examples: {
						0: {
							label: "Append to triggering file",
						},
					},
				},
				updateFrontmatter: {
					label: "Update frontmatter",
					description: "Applies a top-level frontmatter patch to a Markdown note.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Top-level keys to set. Use null to delete a key.",
						},
					},
					output: {
						updated: {
							label: "Updated",
						},
						keys: {
							label: "Keys",
						},
					},
					examples: {
						0: {
							label: "Mark triggering file reviewed",
						},
					},
				},
				moveFile: {
					label: "Move file",
					description: "Moves or renames a vault file.",
					input: {
						targetPath: {
							label: "Target path",
						},
						updateLinks: {
							label: "Update links",
							description: "Use Obsidian's file manager so links are updated according to vault settings.",
						},
					},
					output: {
						moved: {
							label: "Moved",
						},
						oldPath: {
							label: "Old path",
						},
					},
					examples: {
						0: {
							label: "Archive triggering file",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "Stop workflow",
					description: "Stops the current workflow run.",
					input: {
						reason: {
							label: "Reason",
						},
					},
					output: {
						stopped: {
							label: "Stopped",
						},
						reason: {
							label: "Reason",
						},
					},
					examples: {
						0: {
							label: "Stop with reason",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "TaskNotes runtime API is unavailable.",
			obsidianUnavailable: "Obsidian app context is unavailable.",
			requiredText: "Step input requires non-empty text: {field}",
		},
	},
};
