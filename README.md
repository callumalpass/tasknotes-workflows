# TaskNotes Workflows

TaskNotes Workflows is an Obsidian companion plugin for Markdown-defined automation over TaskNotes tasks.

Workflow definitions live as ordinary Markdown notes in `TaskNotes/Workflows/`. The YAML frontmatter is the machine-readable workflow definition; the note body is for human explanation.

The runtime uses Obsidian APIs only. Node is only used by the development, build, and copy scripts, so workflow files and the plugin runtime can operate on Obsidian mobile while the app is open.

On first load, the plugin can also create `TaskNotes/Views/workflows.base`. That Base uses the custom `tasknotesWorkflows` view type and renders workflow cards for creating, editing, opening, running, and dry-running workflows.

Default workflow files are created disabled. They include starter examples for time tracking, status-triggered date cleanup, started timestamps, overdue review, scheduled-date rollover, due-date priority escalation, folder movement, subtask inheritance, dependency inheritance, parent-to-subtask mirroring, and blocked-task warnings.

## Status

This plugin expects TaskNotes to expose its JavaScript runtime API. Without TaskNotes, the Base view can still load and validate workflow files, but task-mutating steps cannot run.

## Workflow Shape

```yaml
---
type: tasknotes-workflow
schemaVersion: 1
id: auto-start-time-tracking
name: Auto-start time tracking
enabled: true

triggers:
  - id: status-active
    type: tasknotes.event
    event: task.status.changed
    to: active

steps:
  - id: start-time
    type: time.start
    input:
      task: "{{trigger.after.path}}"

run:
  mode: sequential
  noOverlap: true
  source: tasknotes-workflows
  onError: stop
---
```

See [Workflow Schema](docs/workflow-schema.md) and [AI Agent Authoring Script](docs/ai-agent-authoring-script.md).

## Commands

- Open workflows
- New workflow
- Reload workflows
- Maintain default workflow files
- `Run: <workflow name>` commands for enabled workflows that include a `manual` trigger

## Editing

Use the workflow Base as the primary UI. Workflow cards open a modal editor for definition fields, triggers, steps, and run policy. The modal renders typed fields from the step catalog, including TaskNotes status and priority options when the TaskNotes runtime API is available, plus selected Obsidian file, workspace, and frontmatter actions.

The underlying note remains the source of truth. Use the card's note action when direct YAML editing is useful. Workflow notes also show a compact workflow card in reading mode.

## Development

```bash
npm install
npm run build:test
obsidian vault=test plugin:reload id=tasknotes-workflows
```

`npm run build:test` copies `main.js`, `manifest.json`, and `styles.css` to the local test vault by default.
