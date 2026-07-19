import { normalizePath, type App } from "obsidian";
import { DEFAULT_WORKFLOW_FOLDER, DEFAULT_WORKFLOW_VIEW_PATH, WORKFLOW_BASE_VIEW_TYPE } from "./constants";
import { parseMarkdownFrontmatter, replaceMarkdownFrontmatter } from "./frontmatter";
import { parseWorkflowDefinition, workflowToFrontmatter } from "./workflowParser";
import type { TaskNotesWorkflowsSettings } from "./types";

interface DefaultWorkflow {
	path: string;
	content: string;
}

export class DefaultWorkflowsService {
	constructor(
		private readonly app: App,
		private readonly getSettings: () => TaskNotesWorkflowsSettings
	) {}

	async ensureDefaultFiles(): Promise<{ workflows: string[]; view: string | null }> {
		const workflows = await this.ensureDefaultWorkflows();
		const view = await this.ensureWorkflowViewFile();
		return { workflows, view };
	}

	async ensureDefaultWorkflows(): Promise<string[]> {
		const folder = normalizePath(this.getSettings().workflowFolder || DEFAULT_WORKFLOW_FOLDER);
		await this.ensureFolder(folder);
		const written: string[] = [];
		for (const workflow of defaultWorkflows(folder)) {
			if (await this.app.vault.adapter.exists(workflow.path)) continue;
			await this.app.vault.create(workflow.path, canonicalWorkflowMarkdown(workflow.content));
			written.push(workflow.path);
		}
		return written;
	}

	async ensureWorkflowViewFile(): Promise<string | null> {
		const path = normalizePath(this.getSettings().workflowViewPath || DEFAULT_WORKFLOW_VIEW_PATH);
		if (await this.app.vault.adapter.exists(path)) return null;

		const lastSlashIndex = path.lastIndexOf("/");
		if (lastSlashIndex > 0) await this.ensureFolder(path.slice(0, lastSlashIndex));
		await this.app.vault.create(path, workflowViewFile(this.getSettings().workflowFolder));
		return path;
	}

	private async ensureFolder(folder: string): Promise<void> {
		const segments = folder.split("/").filter(Boolean);
		let current = "";
		for (const segment of segments) {
			current = current ? `${current}/${segment}` : segment;
			if (!(await this.app.vault.adapter.exists(current))) {
				await this.app.vault.createFolder(current);
			}
		}
	}
}

function canonicalWorkflowMarkdown(markdown: string): string {
	const parsed = parseMarkdownFrontmatter(markdown);
	if (parsed.error) throw new Error(parsed.error);
	const result = parseWorkflowDefinition(parsed.data, markdown);
	if (!result.workflow) {
		throw new Error(result.diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join("; "));
	}
	return replaceMarkdownFrontmatter(markdown, workflowToFrontmatter(result.workflow));
}

function workflowViewFile(workflowFolder: string): string {
	const folder = normalizePath(workflowFolder || DEFAULT_WORKFLOW_FOLDER);
	return `filters:
  and:
    - note["type"] == "workflow" || note["type"] == "tasknotes-workflow"
    - file.inFolder("${escapeBasesString(folder)}")

views:
  - type: ${WORKFLOW_BASE_VIEW_TYPE}
    name: Workflows
    order:
      - file.name
      - note["enabled"]
      - note["description"]
`;
}

function escapeBasesString(value: string): string {
	return value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"');
}

function defaultWorkflows(folder: string): DefaultWorkflow[] {
	return [
		{
			path: `${folder}/auto-start-time-tracking.md`,
			content: `---
type: workflow
schemaVersion: 1
id: auto-start-time-tracking
name: Auto-start time tracking
enabled: false
description: Start a timer when a task status changes to active.
triggers:
  - id: status-active
    type: tasknotes.event
    event: task.status.changed
    to: active
conditions:
  - field: event.after.path
    operator: exists
steps:
  - id: start-time
    type: time.start
    input:
      task: "{{event.after.path}}"
      options:
        description: "Started by {{workflow.name}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 1
  onError: stop
  source: tasknotes-workflows
---

# Auto-start time tracking

Enable this workflow to start time tracking when a TaskNotes task moves to \`active\`.
`,
		},
		{
			path: `${folder}/clear-scheduled-when-started.md`,
			content: `---
type: workflow
schemaVersion: 1
id: clear-scheduled-when-started
name: Clear scheduled when started
enabled: false
description: Clear a task's scheduled date when its status changes to active or in-progress.
triggers:
  - id: status-active
    type: tasknotes.event
    event: task.status.changed
    to: active
  - id: status-in-progress
    type: tasknotes.event
    event: task.status.changed
    to: in-progress
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.scheduled
    operator: exists
steps:
  - id: clear-scheduled
    type: task.clearScheduled
    input:
      task: "{{event.after.path}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 1
  onError: stop
  source: tasknotes-workflows
---

# Clear scheduled when started

Enable this workflow if moving a task into active work means it should no longer appear on its scheduled day.
Adjust the status trigger values to match your TaskNotes status names before enabling it.
`,
		},
		{
			path: `${folder}/stamp-started-at.md`,
			content: `---
type: workflow
schemaVersion: 1
id: stamp-started-at
name: Stamp started timestamp
enabled: false
description: Set a startedAt field the first time a task status changes to active or in-progress.
triggers:
  - id: status-active
    type: tasknotes.event
    event: task.status.changed
    to: active
  - id: status-in-progress
    type: tasknotes.event
    event: task.status.changed
    to: in-progress
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.startedAt
    operator: missing
steps:
  - id: stamp-started
    type: task.patch
    input:
      task: "{{event.after.path}}"
      patch:
        startedAt: "{{now}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 1
  onError: stop
  source: tasknotes-workflows
---

# Stamp started timestamp

Enable this workflow if you want a custom \`startedAt\` field recorded when work begins.
Rename the field or remove the missing-field condition if your workflow should update the timestamp every time the task restarts.
`,
		},
		{
			path: `${folder}/morning-overdue-review.md`,
			content: `---
type: workflow
schemaVersion: 1
id: morning-overdue-review
name: Morning overdue review
enabled: false
description: Find overdue open tasks every morning and mark them high priority.
triggers:
  - id: every-morning
    type: cron
    schedule: "0 9 * * *"
    timezone: local
steps:
  - id: overdue
    type: task.query
    input:
      query:
        where:
          all:
            - field: task.due
              op: lt
              value:
                fn: today
            - field: task.status
              op: notIn
              value:
                - done
                - cancelled
        sort:
          - field: task.due
            direction: asc
        limit: 50
        scope:
          includeArchived: false
  - id: mark-high
    type: task.patch
    forEach:
      items:
        "$expr": 'steps.overdue.output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      patch:
        priority: high
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Morning overdue review

Runs while Obsidian is open. Use dry run first, then enable it when the query matches the right tasks.
`,
		},
		{
			path: `${folder}/rollover-overdue-scheduled-tasks.md`,
			content: `---
type: workflow
schemaVersion: 1
id: rollover-overdue-scheduled-tasks
name: Rollover overdue scheduled tasks
enabled: false
description: Move incomplete tasks with past scheduled dates to today.
triggers:
  - id: every-morning
    type: cron
    schedule: "0 8 * * *"
    timezone: local
steps:
  - id: overdue-scheduled
    type: task.query
    input:
      query:
        where:
          all:
            - field: task.scheduled
              op: lt
              value:
                fn: today
            - field: task.status
              op: notIn
              value:
                - done
                - cancelled
        sort:
          - field: task.scheduled
            direction: asc
        limit: 50
        scope:
          includeArchived: false
  - id: reschedule-to-today
    type: task.reschedule
    forEach:
      items:
        "$expr": 'steps["overdue-scheduled"].output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      date: "{{today}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Rollover overdue scheduled tasks

Runs while Obsidian is open. Use dry run first to confirm the selected tasks before enabling automatic date changes.
`,
		},
		{
			path: `${folder}/escalate-upcoming-due-tasks.md`,
			content: `---
type: workflow
schemaVersion: 1
id: escalate-upcoming-due-tasks
name: Escalate upcoming due tasks
enabled: false
description: Mark incomplete tasks due within the next three days as high priority.
triggers:
  - id: every-morning
    type: cron
    schedule: "0 8 * * *"
    timezone: local
steps:
  - id: due-now
    type: task.query
    input:
      query:
        where:
          all:
            - field: task.due
              op: lte
              value:
                "$expr": 'today() + duration("3d")'
            - field: task.status
              op: notIn
              value:
                - done
                - cancelled
            - field: task.priority
              op: notIn
              value:
                - high
                - highest
        sort:
          - field: task.due
            direction: asc
        limit: 50
        scope:
          includeArchived: false
  - id: mark-high
    type: task.patch
    forEach:
      items:
        "$expr": 'steps["due-now"].output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      patch:
        priority: high
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Escalate upcoming due tasks

Enable this workflow if tasks due in the next few days should be promoted to high priority each morning.
Adjust the priority value first if your vault uses custom priority names.
`,
		},
		{
			path: `${folder}/blocked-task-review.md`,
			content: `---
type: workflow
schemaVersion: 1
id: blocked-task-review
name: Blocked task review
enabled: false
description: Show a weekday count of incomplete tasks that are currently blocked.
triggers:
  - id: weekday-morning
    type: cron
    schedule: "0 9 * * 1-5"
    timezone: local
steps:
  - id: blocked-tasks
    type: task.query
    input:
      query:
        where:
          all:
            - field: task.isBlocked
              op: isTrue
            - field: task.status
              op: notIn
              value:
                - done
                - cancelled
        sort:
          - field: task.due
            direction: asc
        limit: 25
        scope:
          includeArchived: false
  - id: show-count
    type: notice.show
    input:
      message: "You have {{steps.blocked-tasks.output.count}} blocked task(s) to review."
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 25
  onError: stop
  source: tasknotes-workflows
---

# Blocked task review

Enable this workflow if you want a weekday reminder when incomplete tasks are still blocked by dependencies.
`,
		},
		{
			path: `${folder}/move-done-to-review-folder.md`,
			content: `---
type: workflow
schemaVersion: 1
id: move-done-to-review-folder
name: Move completed tasks to review
enabled: false
description: Move completed tasks into a review folder for later archiving.
triggers:
  - id: completed
    type: tasknotes.event
    event: task.completed
conditions:
  - field: event.after.path
    operator: exists
steps:
  - id: move
    type: task.move
    input:
      task: "{{event.after.path}}"
      targetFolder: "TaskNotes/Review"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 1
  onError: stop
  source: tasknotes-workflows
---

# Move completed tasks to review

This is intentionally disabled by default. Change \`targetFolder\`, dry-run it, then enable it.
`,
		},
		{
			path: `${folder}/stop-time-tracking-on-complete.md`,
			content: `---
type: workflow
schemaVersion: 1
id: stop-time-tracking-on-complete
name: Stop time tracking on complete
enabled: false
description: Stop the active timer when a task is completed.
triggers:
  - id: completed
    type: tasknotes.event
    event: task.completed
conditions:
  - field: event.after.path
    operator: exists
steps:
  - id: stop-time
    type: time.stop
    input:
      task: "{{event.after.path}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 1
  onError: stop
  source: tasknotes-workflows
---

# Stop time tracking on complete

Enable this workflow if completed tasks should automatically stop any active timer.
`,
		},
		{
			path: `${folder}/inherit-subtask-contexts-and-tags.md`,
			content: `---
type: workflow
schemaVersion: 1
id: inherit-subtask-contexts-and-tags
name: Inherit subtask contexts and tags
enabled: false
description: Copy contexts and tags from the first parent task when a task becomes a subtask.
triggers:
  - id: projects-changed
    type: tasknotes.event
    event: task.projects.changed
  - id: task-created
    type: tasknotes.event
    event: task.created
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.projects
    operator: exists
steps:
  - id: parents
    type: task.parents
    input:
      task: "{{event.after.path}}"
  - id: inherit-contexts-tags
    type: task.patch
    if:
      - field: steps.parents.output.tasks[0].path
        operator: exists
    input:
      task: "{{event.after.path}}"
      patch:
        contexts: "{{steps.parents.output.tasks[0].contexts}}"
        tags: "{{steps.parents.output.tasks[0].tags}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 5
  onError: stop
  source: tasknotes-workflows
---

# Inherit subtask contexts and tags

Enable this workflow if new subtasks should start with the same contexts and tags as their first parent task.
`,
		},
		{
			path: `${folder}/inherit-subtask-priority.md`,
			content: `---
type: workflow
schemaVersion: 1
id: inherit-subtask-priority
name: Inherit subtask priority
enabled: false
description: Copy priority from the first parent task when a task becomes a subtask.
triggers:
  - id: projects-changed
    type: tasknotes.event
    event: task.projects.changed
  - id: task-created
    type: tasknotes.event
    event: task.created
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.projects
    operator: exists
steps:
  - id: parents
    type: task.parents
    input:
      task: "{{event.after.path}}"
  - id: inherit-priority
    type: task.patch
    if:
      - field: steps.parents.output.tasks[0].priority
        operator: exists
    input:
      task: "{{event.after.path}}"
      patch:
        priority: "{{steps.parents.output.tasks[0].priority}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 5
  onError: stop
  source: tasknotes-workflows
---

# Inherit subtask priority

Enable this workflow if subtasks should take their initial priority from their first parent task.
`,
		},
		{
			path: `${folder}/inherit-subtask-planning-dates.md`,
			content: `---
type: workflow
schemaVersion: 1
id: inherit-subtask-planning-dates
name: Inherit subtask planning dates
enabled: false
description: Copy scheduled and due dates from the first parent task when a task becomes a subtask.
triggers:
  - id: projects-changed
    type: tasknotes.event
    event: task.projects.changed
  - id: task-created
    type: tasknotes.event
    event: task.created
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.projects
    operator: exists
steps:
  - id: parents
    type: task.parents
    input:
      task: "{{event.after.path}}"
  - id: inherit-dates
    type: task.patch
    if:
      - field: steps.parents.output.tasks[0].path
        operator: exists
    input:
      task: "{{event.after.path}}"
      patch:
        scheduled: "{{steps.parents.output.tasks[0].scheduled}}"
        due: "{{steps.parents.output.tasks[0].due}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 5
  onError: stop
  source: tasknotes-workflows
---

# Inherit subtask planning dates

Enable this workflow if subtasks should inherit their first parent task's scheduled and due dates.
`,
		},
		{
			path: `${folder}/inherit-subtask-dependencies.md`,
			content: `---
type: workflow
schemaVersion: 1
id: inherit-subtask-dependencies
name: Inherit subtask dependencies
enabled: false
description: Add the first parent task's blocking dependencies to new subtasks.
triggers:
  - id: projects-changed
    type: tasknotes.event
    event: task.projects.changed
  - id: task-created
    type: tasknotes.event
    event: task.created
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.projects
    operator: exists
steps:
  - id: parents
    type: task.parents
    input:
      task: "{{event.after.path}}"
  - id: parent-dependencies
    type: task.dependencies
    if:
      - field: steps.parents.output.tasks[0].path
        operator: exists
    input:
      task: "{{steps.parents.output.tasks[0].path}}"
  - id: add-dependency
    type: task.addDependency
    if:
      - field: steps.parent-dependencies.output.dependencies
        operator: exists
    forEach:
      items:
        "$expr": 'steps["parent-dependencies"].output.dependencies'
      as: task
    input:
      task: "{{event.after.path}}"
      dependency: "{{task.dependency}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 25
  onError: stop
  source: tasknotes-workflows
---

# Inherit subtask dependencies

Enable this workflow if new subtasks should also be blocked by anything that blocks their first parent task.
`,
		},
		{
			path: `${folder}/mirror-parent-priority-to-subtasks.md`,
			content: `---
type: workflow
schemaVersion: 1
id: mirror-parent-priority-to-subtasks
name: Mirror parent priority to subtasks
enabled: false
description: Update existing subtasks when a parent task's priority changes.
triggers:
  - id: priority-changed
    type: tasknotes.event
    event: task.priority.changed
conditions:
  - field: event.after.path
    operator: exists
steps:
  - id: subtasks
    type: task.subtasks
    input:
      task: "{{event.after.path}}"
  - id: mirror-priority
    type: task.patch
    forEach:
      items:
        "$expr": 'steps.subtasks.output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      patch:
        priority: "{{event.after.priority}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Mirror parent priority to subtasks

Enable this workflow if existing subtasks should keep the same priority as their parent task.
`,
		},
		{
			path: `${folder}/mirror-parent-planning-dates-to-subtasks.md`,
			content: `---
type: workflow
schemaVersion: 1
id: mirror-parent-planning-dates-to-subtasks
name: Mirror parent planning dates to subtasks
enabled: false
description: Update existing subtasks when a parent task's scheduled or due date changes.
triggers:
  - id: scheduled-changed
    type: tasknotes.event
    event: task.scheduled.changed
  - id: due-changed
    type: tasknotes.event
    event: task.due.changed
conditions:
  - field: event.after.path
    operator: exists
steps:
  - id: subtasks
    type: task.subtasks
    input:
      task: "{{event.after.path}}"
  - id: mirror-dates
    type: task.patch
    forEach:
      items:
        "$expr": 'steps.subtasks.output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      patch:
        scheduled: "{{event.after.scheduled}}"
        due: "{{event.after.due}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Mirror parent planning dates to subtasks

Enable this workflow if subtasks should move with their parent task's scheduled and due dates.
`,
		},
		{
			path: `${folder}/schedule-subtasks-before-parent-due.md`,
			content: `---
type: workflow
schemaVersion: 1
id: schedule-subtasks-before-parent-due
name: Schedule subtasks before parent due date
enabled: false
description: Schedule existing subtasks one week before their parent task is due.
triggers:
  - id: due-changed
    type: tasknotes.event
    event: task.due.changed
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.due
    operator: exists
steps:
  - id: subtasks
    type: task.subtasks
    input:
      task: "{{event.after.path}}"
  - id: schedule-subtasks
    type: task.setScheduled
    forEach:
      items:
        "$expr": 'steps.subtasks.output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      date:
        "$expr": 'date(event.after.due) - duration("1w")'
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Schedule subtasks before parent due date

Enable this workflow if subtasks should be scheduled one week before their parent task is due.
Adjust the amount and unit in the relative date expression if your planning cadence is different.
`,
		},
		{
			path: `${folder}/mirror-parent-dependencies-to-subtasks.md`,
			content: `---
type: workflow
schemaVersion: 1
id: mirror-parent-dependencies-to-subtasks
name: Mirror parent dependencies to subtasks
enabled: false
description: Replace each subtask's dependencies with the parent task's current dependencies.
triggers:
  - id: dependencies-changed
    type: tasknotes.event
    event: task.dependencies.changed
conditions:
  - field: event.after.path
    operator: exists
steps:
  - id: subtasks
    type: task.subtasks
    input:
      task: "{{event.after.path}}"
  - id: mirror-dependencies
    type: task.patch
    forEach:
      items:
        "$expr": 'steps.subtasks.output.tasks'
      as: task
    input:
      task: "{{task.path}}"
      patch:
        blockedBy: "{{event.after.blockedBy}}"
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 50
  onError: continue
  source: tasknotes-workflows
---

# Mirror parent dependencies to subtasks

Enable this workflow if subtasks should always have the same blocking dependencies as their parent task.
`,
		},
		{
			path: `${folder}/warn-when-starting-blocked-task.md`,
			content: `---
type: workflow
schemaVersion: 1
id: warn-when-starting-blocked-task
name: Warn when starting a blocked task
enabled: false
description: Show a notice when a task is moved to active while dependencies are incomplete.
triggers:
  - id: status-active
    type: tasknotes.event
    event: task.status.changed
    to: active
conditions:
  - field: event.after.path
    operator: exists
  - field: event.after.isBlocked
    operator: is
    value: true
steps:
  - id: dependencies
    type: task.dependencies
    input:
      task: "{{event.after.path}}"
  - id: warn
    type: notice.show
    input:
      message: "{{event.after.title}} is still blocked by {{steps.dependencies.output.count}} task(s)."
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 10
  onError: stop
  source: tasknotes-workflows
---

# Warn when starting a blocked task

Enable this workflow if you want an Obsidian notice before working on a task that still has incomplete dependencies.
`,
		},
		{
			path: `${folder}/daily-active-task-review.md`,
			content: `---
type: workflow
schemaVersion: 1
id: daily-active-task-review
name: Daily active task review
enabled: false
description: Show a daily count of tasks still marked active.
triggers:
  - id: weekday-evening
    type: cron
    schedule: "0 17 * * 1-5"
    timezone: local
steps:
  - id: active-tasks
    type: task.query
    input:
      query:
        where:
          field: task.status
          op: eq
          value: active
        scope:
          includeArchived: false
  - id: show-count
    type: notice.show
    input:
      message: "You have {{steps.active-tasks.output.count}} active task(s) to review."
run:
  mode: sequential
  concurrency:
    group: workflow
    policy: skip
  limits:
    maxItems: 25
  onError: stop
  source: tasknotes-workflows
---

# Daily active task review

Enable this workflow if you want a weekday reminder to close out tasks still marked active.
`,
		},
	];
}
