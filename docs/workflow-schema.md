# Workflow Schema

TaskNotes Workflows persists canonical mdbase runtime `workflow/0.1` records.
The normative JSON Schema is shipped by `@callumalpass/mdbase-runtime`; the
plugin validates every newly created, edited, or migrated record before writing
it.

Workflow notes live in `TaskNotes/Workflows/` by default. The Markdown body is
user-owned documentation and is preserved when frontmatter is edited or
migrated.

## Core Record

```yaml
type: workflow
id: auto-start-time
version: 1
name: Auto-start time tracking
description: Start a timer when a task becomes active.
enabled: false

requires:
  providers:
    - id: tasknotes
      version: ">=4.0.0 <5.0.0"
  capabilities:
    - time.write

triggers:
  - id: status-active
    event: task.status.changed
    if:
      $expr: 'event.after.status == "active" && has(event.after.path)'
    x-tasknotes:
      type: tasknotes.event
      to: active

steps:
  - id: start-time
    action: time.start
    input:
      path:
        $expr: event.after.path

run:
  execution:
    mode: single_executor
  concurrency:
    group:
      $expr: event.after.path
    policy: skip
  limits:
    max_items: 1
    timeout: 30s
  on_error: stop

x-tasknotes:
  format_version: 1
  source: tasknotes-workflows
```

Required core fields are `type`, `id`, `version`, `name`, `enabled`,
`triggers`, and `steps`. Unknown core fields are invalid unless their name
starts with `x-`.

## Triggers

Every trigger has a unique `id` and references a runtime `event` contract.
Generic provider events need no TaskNotes extension:

```yaml
triggers:
  - id: canvas-drop
    event: canvas.drop
    if:
      $expr: 'has(event.payload.record.path)'
```

TaskNotes Workflows stores executor-specific scheduling and filters under
`x-tasknotes` while retaining a canonical event ID:

```yaml
triggers:
  - id: every-morning
    event: tasknotes-workflows.schedule.cron
    x-tasknotes:
      type: cron
      schedule: "0 9 * * *"
      timezone: local

  - id: every-half-hour
    event: tasknotes-workflows.schedule.interval
    x-tasknotes:
      type: interval
      every: 30m

  - id: manual
    event: tasknotes-workflows.manual
    x-tasknotes:
      type: manual

  - id: note-modified
    event: obsidian.vault.modify
    x-tasknotes:
      type: obsidian.vault
      event: modify
      path:
        glob: "Projects/**/*.md"
```

Supported TaskNotes executor trigger types are `tasknotes.event`,
`contract.event`, `runtime.event`, `cron`, `interval`, `manual`, `obsidian.vault`,
`obsidian.metadata`, and `obsidian.workspace`.

Contract event triggers select a portable event contract by ID and semantic
version range. `source` optionally narrows the publishing application:

```yaml
triggers:
  - id: completed
    event: tasknotes.task.completed
    x-tasknotes:
      type: contract.event
      version: ^1.0.0
      source: tasknotes
```

## Steps

Every step has a unique `id` and references an `action` contract. Input values
are literals unless represented by an expression object.

```yaml
steps:
  - id: schedule-task
    action: task.setScheduled
    input:
      task:
        $expr: event.after.path
      date:
        $expr: 'date(event.after.due) - duration("7d")'
```

TaskNotes Workflows provides its typed local action catalog and dispatches a
registered action through the shared mdbase host when that action is available.
A host policy denial is terminal and is never bypassed through the local
compatibility adapter.

Portable action steps put contract and provider selection in the TaskNotes
extension while retaining the action contract ID in the canonical `action`
field:

```yaml
steps:
  - id: add-card
    action: canvas.card.create
    input:
      canvas_path: TaskNotes/Canvases/Completed tasks.canvas
      card:
        kind: file
        file:
          $expr: event.data.task_path
    x-tasknotes:
      contract:
        version: ^1.0.0
      provider:
        application: canvas-bases
```

The bridge admits the request only when exactly one compatible provider is
selected. Run logs preserve the exact resolved contract digest and provider
identity.

The current TaskNotes action catalog includes task reads and mutations, task
relationships, time tracking, notices, selected Obsidian file operations, and
workflow control. Inspect the exact installed catalog through the TaskNotes
extension API:

```js
const workflows = app.plugins.getPlugin("tasknotes")?.api.extensions.get("tasknotes-workflows");
workflows?.listStepDefinitions();
```

## Expressions

Only `{ $expr: "..." }` objects are evaluated. Plain strings are literals.
Expressions receive `workflow`, `trigger`, `event`, `vars`, `steps`, `item`,
`today`, and `now`.

```yaml
input:
  path:
    $expr: event.after.path
  message:
    $expr: '"Review " + workflow.name'
```

Step results use the canonical wrapper:

```text
steps.query.status
steps.query.output.tasks
steps.query.error
```

## Conditions

Workflow, trigger, and step guards use the canonical `if` expression:

```yaml
if:
  $expr: 'event.after.due != null && event.after.status != "done"'
```

The visual editor may retain its structured condition representation under
`x-tasknotes.conditions`. It also writes the equivalent canonical `if` field,
so generic tools can inspect the guard.

## Iteration

Use canonical `for_each` for bounded batch work:

```yaml
steps:
  - id: patch-each
    action: task.patch
    for_each:
      items:
        $expr: steps.query.output.tasks
      as: task
    input:
      task:
        $expr: task.path
      patch:
        status: open
```

`for_each.items` must resolve to an array. TaskNotes Workflows stops the step
when the item count exceeds `run.limits.max_items`.

## Run Policy

```yaml
run:
  execution:
    mode: single_executor
  idempotency:
    key:
      $expr: 'workflow.id + ":" + event.id + ":" + trigger.id'
  concurrency:
    group: workflow
    policy: skip
  limits:
    max_items: 50
    timeout: 5m
  on_error: stop
```

Side-effecting workflows should use `single_executor`. Executor selection is
deployment policy and does not belong in the workflow record.

## Compatibility And Migration

TaskNotes Workflows 0.1.x used an incompatible product format with fields such
as:

```yaml
type: tasknotes-workflow
schemaVersion: 1
steps:
  - id: notify
    type: notice.show
run:
  noOverlap: true
  maxTasks: 25
  onError: stop
```

The compatibility parser continues to execute these files and the later
noncanonical `type: workflow` plus `schemaVersion: 1` variant. Loading a legacy
file never rewrites it.

Use **Migrate workflow files to the mdbase runtime format** to produce a
non-mutating analysis. The review modal shows every changed block and every
invalid file. Applying the report:

1. verifies that no candidate changed after analysis
2. writes originals and a manifest under `.obsidian/tasknotes-workflows/workflow-migrations/`
3. replaces only analyzed frontmatter while preserving Markdown bodies
4. restores already changed files if a later write fails

Saving an individual legacy workflow through the visual editor also writes the
canonical format, because that save is already an explicit user action.
