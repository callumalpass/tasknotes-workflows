# Workflow schema

Workflow notes contain mdbase Runtime 0.2 `runtime_workflow` frontmatter and a user-owned Markdown body. New files use CEL and `x-tasknotes.format_version: 2`. The published `@callumalpass/mdbase-runtime@0.2.0` schema validates records.

```yaml
type: runtime_workflow
id: auto-start-time
version: 1.0.0
name: Auto-start time tracking
enabled: false
triggers:
  - id: status-active
    event:
      id: task.status.changed
      version: 1.0.0
    if:
      $expr: 'event.data.after.status == "active"'
    debounce: 500ms
    minimum_interval: 5s
    x-tasknotes:
      type: tasknotes.event
steps:
  - id: start-time
    action:
      id: time.start
      version: 1.0.0
    input:
      taskId:
        $expr: event.data.taskId
run:
  concurrency:
    group:
      $expr: event.data.taskId
    policy: queue
  limits:
    max_items: 25
    timeout: 30s
  on_error: stop
x-tasknotes:
  format_version: 2
```

Required fields are `type`, `id`, `version`, `name`, `enabled`, `triggers`, and `steps`. Trigger and step IDs must each be unique. Unknown fields require an `x-` prefix. In an mdbase 0.3 collection, new and migrated files use the first configured `settings.explicit_type_keys` key instead of `type` (for example `mdbase_type` in a new TaskNotes v5 collection). Omitted settings use `type`; an explicitly empty list requires collection configuration before writing workflows. A missing `runtime_workflow` type produces a hint to install the **mdbase runtime standard** pack; the plugin does not install it.

## Expressions

An object with exactly one `$expr` key evaluates CEL using the mdbase CEL host. Every plain string is literal, including `{{...}}`. Evaluation errors fail execution. Conditions must produce a boolean; only `true` continues.

The activation contains:

| Name | Value |
| --- | --- |
| `event` | CloudEvent; payload is under `event.data` |
| `workflow` | Runtime workflow record |
| `trigger` | Selected runtime trigger record |
| `vars` | Variables evaluated once in dependency order |
| `steps.<id>.output` | Completed output; use brackets for IDs containing hyphens |
| `item` | Current `for_each` item; optional `as` adds an alias |

Use `today()` and `now()` for the captured execution date/instant. `today().addDays(3)` returns a full-date string. Variable cycles fail before dispatch. Variable dependencies use named selections (`vars.name` or `vars["name"]`); dynamic variable keys are rejected. The clock uses the cron timezone when supplied, otherwise the device timezone.

```yaml
vars:
  greeting:
    $expr: '"Review " + workflow.name'
steps:
  - id: notify
    action: { id: notice.show, version: 1.0.0 }
    input:
      message:
        $expr: 'vars.greeting + ": " + string(steps["task-query"].output.count)'
```

## Events and triggers

`tasknotes.event` uses the TaskNotes runtime API, including v5's additive task identity. Its `event.data` is the plain-data TaskNotes API payload:

```text
event, timestamp, taskId, taskPath,
task, before, after, deletedTask,
changes: { <field>: { before, after } },
data, context, source, correlationId, reason, rawEvent
```

Fields absent in the original event remain absent. `before`/`after` are semantic task snapshots, not raw frontmatter. Configured field mappings continue to work. Custom values are under `customProperties`. Write status guards as `event.data.after.status == "active"`, and transitions as `event.data.before.status == "open" && event.data.after.status == "active"`. The older `from`/`to` extension filters remain accepted. Self-generated task events are ignored unless `x-tasknotes.allowSelfTrigger: true`.

`contract.event` is the default when no trigger extension type is given. It uses the exact incoming CloudEvent, preserving its ID, data, contract version and digest. Optional extension `source` selects `mdbaseapplication`; `path.glob`/`path.extension` filter the event subject/path.

```yaml
triggers:
  - id: completed
    event: { id: tasknotes.task.completed, version: ^1.0.0 }
    x-tasknotes:
      type: contract.event
      source: tasknotes
```

Other supported extension types:

```yaml
triggers:
  - id: daily
    event: { id: tasknotes-workflows.schedule.cron, version: 1.0.0 }
    x-tasknotes:
      type: cron
      schedule: "0 9 * * *"
      timezone: Australia/Melbourne # IANA zone, or local
      catchUp: true
  - id: interval
    event: { id: tasknotes-workflows.schedule.interval, version: 1.0.0 }
    x-tasknotes: { type: interval, every: 30m }
  - id: manual
    event: { id: tasknotes-workflows.manual, version: 1.0.0 }
    x-tasknotes: { type: manual }
  - id: metadata
    event: { id: mdbase.record.modified, version: 1.0.0 }
    x-tasknotes:
      type: obsidian.metadata
      event: changed
      path: { glob: "Projects/**/*.md" }
```

Cron and interval state persists under the plugin directory. On restart, missed schedules coalesce into one firing (`fire_once`), not one execution per missed slot. Cron `catchUp: false` disables missed-slot firing. New schedules have no pre-installation backlog. Debounce is trailing-edge and keeps the latest event; pending debounce timers are in memory and disappear on reload. Minimum-interval admission timestamps persist. Schedule state records the fire decision before executing; a crash between that write and dispatch can lose that firing.

`obsidian.metadata` `changed` observes metadata cache snapshots and emits local `mdbase.record.modified@1.0.0` data: `path`, `before`, `after`, `changed_fields`, `previous_revision`, `revision`, `previous_types`, `types`. Revisions hash metadata snapshots, not full mdbase record revisions. Type lists read configured explicit type keys; they do not include automatic type matches. Other metadata events (`deleted`, `resolve`, `resolved`) retain their original payload. `obsidian.vault` (`create`, `modify`, `delete`, `rename`) and `obsidian.workspace` (`file-open`, `active-leaf-change`, `layout-change`) keep their existing local payloads under `event.data`.

## Actions and iteration

Steps execute in document order. Local actions use the TaskNotes runtime API for task reads and writes; Obsidian actions use Obsidian APIs. `task.get` accepts `taskId` through v5 `tasks.getById`, or `task` as a path through `getByPath`/the v4-compatible `get`. Mutations accept `taskId`, resolve its current path immediately before calling the path-based TaskNotes mutation, and otherwise accept `task` paths. `time.appendEntry.entry` uses TaskNotes `TimeEntry` fields (`startTime`, optional `endTime` and `description`).

```yaml
steps:
  - id: patch-each
    action: { id: task.patch, version: 1.0.0 }
    for_each:
      items:
        $expr: steps.query.output.tasks
    if:
      $expr: 'item.status != "done"'
    input:
      taskId:
        $expr: item.id
      patch:
        customFrontmatter:
          reviewed: true
```

`for_each.items` must be a list and may not exceed `run.limits.max_items` (default 25). Items execute in order and step output is an ordered list. A step `if` is evaluated for each item. Arbitrary task properties belong in `patch.customFrontmatter`; `null` removes a custom property. TaskNotes semantic fields such as `projects` and `scheduled` use TaskNotes' configured field mappings.

Unknown local action IDs, or steps with an explicit `provider`, use the mdbase bridge. The executor resolves exactly one provider, pins its contract and declaration, and rechecks that binding before dispatch. Contract requirements accept SemVer ranges. Enabling **Allow plugin integrations** in **mdbase** (`mdbase-sync`, API v1/profile 0.1) is required. The bridge applies its own authorization and schema validation.

## Run policy and history

- `run.idempotency.key` is a literal or CEL expression producing a string. Default: `workflow.id + ":" + event.id + ":" + trigger.id`. Reservations persist for seven days before any actions; clearing history does not clear them. Dry runs do not reserve keys.
- `run.concurrency.group` is a literal or expression producing a string; default is the workflow ID. `skip` records a cancelled admission, `queue` waits in order, `replace` requests cooperative cancellation and waits for active work to settle, and `allow` runs concurrently. Queue positions and active execution are device-memory state.
- `run.limits.timeout` prevents new dispatch after the deadline. An in-flight local action must settle; interop receives deadline/cancellation requests. Completed effects are retained.
- `run.on_error: stop|continue` controls later dispatch. A run with any failed action remains failed even with `continue`.

The history UI remains available. New details store `runtime_run` with `queued|running|waiting|succeeded|failed|cancelled|indeterminate` status and nested `runtime_action_attempt` records with `admitted|dispatching|succeeded|rejected|failed|cancelled|indeterminate`. UI summaries live in `x-tasknotes`; old history is read-only compatible. Intent and outcome snapshots are written before/after dispatch under the configured run-log directory. Local bindings identify this plugin's local handlers. The ephemeral bridge supplies invocation/attempt identities only with its outcome, so intent identities are provisional until then. Unknown interop outcomes become `indeterminate` and are not replayed.

This client executor does not claim full durable Runtime 0.2 conformance: it has no distributed lease, transactional event journal, durable queue/checkpoint recovery, or exactly-once external effects. Reservations suppress repeat events across restarts, but interrupted work is not resumed. On startup, incomplete queued history becomes cancelled and in-flight history becomes indeterminate. Run this plugin on one device per vault for automatic automation.

**Run workflows on this device** is stored through Obsidian local storage, defaults on for desktop and off for mobile, and gates all automatic trigger kinds. Manual runs remain available. The setting is excluded from synced `data.json`.

## Migration and editing

Format v1 and older `workflow`/`tasknotes-workflow` records continue to use the original Bases evaluator until migrated. One startup notice offers the migration command. CEL records open their YAML note for editing; the existing visual formula builder remains available for v1 workflows.

**Migrate workflow files to the mdbase runtime format** analyzes without modifying files, displays diffs and conversion warnings, then checks source hashes, backs up originals under `.obsidian/tasknotes-workflows/workflow-migrations/`, applies only reviewed frontmatter, and rolls back earlier writes on failure. Markdown bodies are preserved.

Migration converts clear Bases expressions, `{{reference}}` strings, scalar string interpolation, and `x-tasknotes.conditions` into CEL. Unsupported functions, ambiguous field `contains` semantics, and unsupported date arithmetic disable that workflow and add `x-tasknotes.comment` explaining required manual work. Original source remains in the backup and review diff. Migration never runs automatically. Editing v1 files retains v1 evaluation until the migration is applied.
