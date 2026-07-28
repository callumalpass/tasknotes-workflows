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
  for cross-application contract events and contract actions

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
type: runtime_workflow
id: auto-start-time-tracking
version: 1.0.0
name: Auto-start time tracking
enabled: true

triggers:
  - id: status-active
    event:
      id: task.status.changed
      version: 1.0.0
    x-tasknotes:
      type: tasknotes.event
      to: active

steps:
  - id: start-time
    action:
      id: time.start
      version: 1.0.0
    input:
      task:
        $expr: event.after.path

run:
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

Cross-application triggers always name an event contract and a compatible
version. The optional `source` narrows which application may publish it:

```yaml
triggers:
  - id: canvas-drop
    event:
      id: canvas.drop
      version: ^1.0.0
    x-tasknotes:
      type: contract.event
      source: canvas-bases
```

New files and editor saves validate against the canonical mdbase runtime
`runtime_workflow` schema from Runtime profile 0.2. Files created by TaskNotes Workflows 0.1.x continue to
run through the compatibility reader. The migration command shows a per-file
diff, checks for changes after analysis, and creates a backup before rewriting
legacy frontmatter; it never runs automatically during plugin startup.

## Contract Events And Actions

The mdbase interoperability profile lets workflows connect applications without
giving one application ownership of another's types. A trigger selects an event
contract and compatible version range; a step selects an action contract and
may pin a provider application:

```yaml
triggers:
  - id: task-completed
    event:
      id: tasknotes.task.completed
      version: ^1.0.0
    x-tasknotes:
      type: contract.event

steps:
  - id: add-card
    action:
      id: canvas.card.create
      version: ^1.0.0
    provider:
      application: canvas-bases
    input:
      canvas_path: TaskNotes/Canvases/Completed tasks.canvas
      card:
        kind: file
        file: "{{event.data.task_path}}"
```

The included **Add completed tasks to a canvas** workflow demonstrates this
flow and is disabled by default. Enable **Allow local application
interoperability** in mdbase settings before enabling it.

Contract events use CloudEvents and are multicast. Action execution requires
exactly one compatible provider. Run details preserve the exact contract,
source, provider, request, attempt, and outcome evidence. Compatibility never
acts as authorization; the mdbase host grant remains default-deny.

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
