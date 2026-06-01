# TaskNotes Workflows

TaskNotes Workflows is an optional companion plugin for [TaskNotes](https://github.com/callumalpass/tasknotes). It lets you automate TaskNotes workflows with editable Markdown files in your vault.

Use it for things like:

- starting or stopping time tracking when task status changes
- clearing scheduled dates when work starts
- rolling overdue scheduled tasks forward
- raising priority as due dates approach
- copying parent task metadata into subtasks
- getting a reminder when blocked tasks need review

## Requirements

- Obsidian 1.8.0 or newer
- TaskNotes installed and enabled

## Install

Download `main.js`, `manifest.json`, and `styles.css` from the latest release, place them in `.obsidian/plugins/tasknotes-workflows/`, then enable **TaskNotes Workflows** in Obsidian's Community plugins settings.

## Getting Started

Workflow notes live in `TaskNotes/Workflows/`. Each workflow is a normal Markdown file: the frontmatter defines the automation, and the body explains what it does.

The plugin creates starter workflows disabled by default, so they are safe to inspect before use. Open `TaskNotes/Views/workflows.base` to review, edit, dry-run, and enable them.

Useful commands:

- **Open workflows**
- **New workflow**
- **Reload workflows**
- **Maintain default workflow files**
- `Run: <workflow name>` for enabled workflows that include a manual trigger

## Included Workflows

The default set includes disabled examples for time tracking, status-triggered date cleanup, started timestamps, overdue review, scheduled-date rollover, due-date priority escalation, blocked-task review, folder movement, subtask inheritance, dependency inheritance, and parent-to-subtask mirroring.

Enable only the workflows that match your vault. Most templates are meant to be adjusted first, especially if you use custom status or priority names.

## Example

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

## Editing Workflows

Use the workflow Base as the primary UI. Workflow cards open a modal editor for definition fields, triggers, steps, and run policy. The modal renders typed fields from the step catalog, including TaskNotes catalog-backed status and priority options, a visual builder for canonical TaskNotes runtime task queries, and selected Obsidian file, workspace, and frontmatter actions.

The Markdown note remains the source of truth. Use the card's note action when direct YAML editing is useful.

See [Workflow Schema](docs/workflow-schema.md) and [AI Agent Authoring Script](docs/ai-agent-authoring-script.md) for the full format.

## Development

```bash
npm install
npm run build:test
obsidian vault=test plugin:reload id=tasknotes-workflows
```

`npm run build:test` copies `main.js`, `manifest.json`, and `styles.css` to the local test vault by default.
