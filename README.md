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
- `mdbase-obsidian` is optional for local TaskNotes-only workflows and required
  for shared runtime provider discovery, policy enforcement, and external events

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
- **Migrate workflow files to the mdbase runtime format**
- `Run: <workflow name>` for enabled workflows that include a manual trigger

## Included Workflows

The default set includes disabled examples for time tracking, status-triggered date cleanup, started timestamps, overdue review, scheduled-date rollover, due-date priority escalation, blocked-task review, folder movement, subtask inheritance, dependency inheritance, and parent-to-subtask mirroring.

Enable only the workflows that match your vault. Most templates are meant to be adjusted first, especially if you use custom status or priority names.

## Example

```yaml
---
type: workflow
id: auto-start-time-tracking
version: 1
name: Auto-start time tracking
enabled: true

triggers:
  - id: status-active
    event: task.status.changed
    if:
      $expr: 'event.after.status == "active"'
    x-tasknotes:
      type: tasknotes.event
      to: active

steps:
  - id: start-time
    action: time.start
    input:
      task:
        $expr: event.after.path

run:
  execution:
    mode: single_executor
  concurrency:
    group: workflow
    policy: skip
  limits:
    max_items: 25
  on_error: stop
x-tasknotes:
  format_version: 1
  source: tasknotes-workflows
---
```

Workflows can also subscribe to events from registered mdbase runtime providers
and require a compatible provider version before they run:

```yaml
requires:
  providers:
    - id: canvas-bases
      version: ">=0.1.0 <1.0.0"

triggers:
  - id: canvas-drop
    event: canvas.drop
```

New files and editor saves validate against the canonical mdbase runtime
`workflow/0.1` schema. Files created by TaskNotes Workflows 0.1.x continue to
run through the compatibility reader. The migration command shows a per-file
diff, checks for changes after analysis, and creates a backup before rewriting
legacy frontmatter; it never runs automatically during plugin startup.

## Editing Workflows

Use the workflow Base as the primary UI. Workflow cards open a modal editor for definition fields, triggers, steps, and run policy. The modal renders typed fields from the step catalog, including TaskNotes catalog-backed status and priority options, a visual builder for canonical TaskNotes runtime task queries, and selected Obsidian file, workspace, and frontmatter actions.

The Markdown note remains the source of truth. Use the card's note action when direct YAML editing is useful.

Workflows are typed YAML pipelines. Advanced guards and computed input values use Obsidian Bases formulas via the same expression engine as Bases. Date fields in the editor include fixed, workflow value, relative date, and formula modes, and run history shows both the source input and resolved input for dry-run review.

See [Workflow Schema](docs/workflow-schema.md) and [AI Agent Authoring Script](docs/ai-agent-authoring-script.md) for the full format.

## Development

```bash
npm install
npm run build:test
obsidian vault=test plugin:reload id=tasknotes-workflows
```

`npm run build:test` copies `main.js`, `manifest.json`, and `styles.css` to the local test vault by default.
