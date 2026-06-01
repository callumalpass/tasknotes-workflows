# Workflow Schema

Workflow files are Markdown notes with YAML frontmatter.

The default workflow folder is `TaskNotes/Workflows/`. The default workflow Base file is `TaskNotes/Views/workflows.base` and uses the custom Bases view type `tasknotesWorkflows`.

## Required Fields

| Field | Type | Notes |
| --- | --- | --- |
| `type` | string | Must be `tasknotes-workflow`. |
| `schemaVersion` | number | Must be `1`. |
| `id` | string | Stable lowercase id. Use letters, numbers, dots, underscores, and dashes. |
| `name` | string | Human-readable name shown in the Base view. |
| `enabled` | boolean | Disabled workflows can be edited and dry-run but do not run automatically. |
| `triggers` | array | One or more trigger definitions. |
| `steps` | array | Linear typed step pipeline. |
| `run` | object | Run policy. |

## Triggers

```yaml
triggers:
  - id: status-active
    type: tasknotes.event
    event: task.status.changed
    from: open
    to: active

  - id: every-morning
    type: cron
    schedule: "0 9 * * *"
    timezone: local

  - id: every-half-hour
    type: interval
    every: 30m

  - id: manual
    type: manual
```

Enabled workflows with a `manual` trigger are also registered as Obsidian commands named `Run: <workflow name>`, so they can be launched from the command palette or assigned a hotkey. The generated command id is based on the workflow `id`; changing the workflow id creates a different command.

Advanced Obsidian triggers are opt-in in settings:

```yaml
triggers:
  - id: project-note-opened
    type: obsidian.workspace
    event: file-open
    path:
      glob: "Projects/**/*.md"

  - id: active-note-changed
    type: obsidian.workspace
    event: active-leaf-change
    path:
      glob: "Projects/**/*.md"

  - id: metadata-indexed
    type: obsidian.metadata
    event: changed
    path:
      glob: "Projects/**/*.md"
```

## Conditions

Conditions can appear at workflow level or step level.

```yaml
conditions:
  - field: trigger.after.status
    operator: is
    value: active
```

Operators:

- `is`
- `isNot`
- `in`
- `notIn`
- `exists`
- `missing`
- `contains`
- `startsWith`
- `before`
- `after`
- `onOrBefore`
- `onOrAfter`

## References

References use constrained template expressions. Arbitrary JavaScript is not evaluated.

```text
{{workflow.id}}
{{trigger.after.path}}
{{steps.query.tasks}}
{{item.path}}
{{today}}
{{now}}
```

If a string is exactly one reference, the underlying value is preserved. If the reference is embedded in other text, the value is stringified.

## Steps

Initial step types:

- `task.query`
- `task.get`
- `task.parents`
- `task.subtasks`
- `task.dependencies`
- `task.blocking`
- `task.relationships`
- `task.create`
- `task.patch`
- `task.set`
- `task.move`
- `task.archive`
- `task.unarchive`
- `task.complete`
- `task.uncomplete`
- `task.reschedule`
- `task.setDue`
- `task.clearDue`
- `task.setScheduled`
- `task.clearScheduled`
- `task.addTag`
- `task.removeTag`
- `task.addProject`
- `task.removeProject`
- `task.addContext`
- `task.removeContext`
- `task.addDependency`
- `task.removeDependency`
- `time.start`
- `time.stop`
- `time.appendEntry`
- `notice.show`
- `obsidian.openFile`
- `obsidian.createNote`
- `obsidian.appendNote`
- `obsidian.updateFrontmatter`
- `obsidian.moveFile`
- `workflow.stop`

Use `forEach` for batch steps:

```yaml
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
        scope:
          includeArchived: false

  - id: mark-high
    type: task.patch
    forEach: "{{steps.overdue.tasks}}"
    input:
      task: "{{item.path}}"
      patch:
        priority: high
```

`task.query` accepts the canonical TaskNotes runtime task query DTO and delegates to `api.query.tasks()`. The workflow editor provides a visual builder for simple `all`/`any` condition lists, sort, group, limit, and archived scope; use the advanced JSON field for nested predicates, negation, date math, folder scopes, and offsets.

```yaml
steps:
  - id: active
    type: task.query
    input:
      query:
        where:
          field: task.status
          op: eq
          value: active
        group:
          - field: task.status
        limit: 25
```

The output is available as `tasks`, `count`, `total`, `matched`, `returned`, `groups`, `groupPaths`, `query`, and `warnings`.

Runtime task queries use this shape:

```yaml
query:
  where:
    all:
      - field: task.status
        op: ne
        value: done
      - any:
          - field: task.due
            op: lte
            value:
              fn: today
          - field: task.priority
            op: eq
            value: high
  sort:
    - field: task.due
      direction: asc
  group:
    - field: task.status
  limit: 25
  offset: 0
  scope:
    includeArchived: false
    folders:
      - Tasks
```

`where` can be a condition (`field`, `op`, optional `value`) or a nested `all`, `any`, or `not` predicate. Operators are `eq`, `ne`, `contains`, `notContains`, `in`, `notIn`, `exists`, `missing`, `lt`, `lte`, `gt`, `gte`, `isTrue`, and `isFalse`. Common fields include `task.status`, `task.priority`, `task.due`, `task.scheduled`, `task.projects`, `task.contexts`, `task.tags`, `task.isBlocked`, and `file.path`. Date values can use `{ fn: today }`, `{ fn: now }`, `{ fn: date, value: "2026-06-01" }`, or `{ fn: dateAdd, value: { fn: today }, amount: 1, unit: day }`.

## Run Policy

```yaml
run:
  mode: sequential
  noOverlap: true
  source: tasknotes-workflows
  maxTasks: 50
  onError: stop
```

Run logs are stored under the plugin's Obsidian config folder by default. Workflow notes are not modified when workflows run.

When TaskNotes exposes typed runtime API errors, failed task steps store the API error code, status, and details in the run detail alongside the readable error message.

## Step Catalog

The plugin keeps a typed catalog for all built-in steps. Each catalog entry includes:

- `type`, `label`, `category`, and `description`
- `inputFields` with field keys, field types, required flags, defaults, and optional dynamic TaskNotes option sources
- `outputFields` describing values available under `{{steps.stepId.*}}`
- examples for generated scaffolding

The workflow editor uses this catalog instead of forcing raw JSON for common step inputs. Companion plugins can read the same catalog from the TaskNotes runtime extension:

```ts
const workflows = app.plugins.getPlugin("tasknotes")?.api.extensions.get("tasknotes-workflows");
const stepDefinitions = workflows?.listStepDefinitions();
```
