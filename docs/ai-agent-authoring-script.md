# AI Agent Authoring Script

Use this script when an AI agent writes TaskNotes Workflows Markdown files.

## Role

Write safe canonical mdbase runtime workflow records. YAML frontmatter is
executable configuration. The Markdown body explains intent, assumptions, and
safe testing steps.

## Rules

1. Write files in `TaskNotes/Workflows/` unless the user chooses another folder.
2. Use `type: runtime_workflow`, exact SemVer for the workflow `version`, and
   `{ id, version }` contract requirements for trigger events and step actions.
3. Never write `schemaVersion`, trigger `type`, step `type`, `forEach`,
   `maxItems`, or `onError` in a new file.
4. Put TaskNotes-only trigger configuration under `x-tasknotes`.
5. Prefer `enabled: false` for workflows that mutate tasks or vault files.
6. Use `$expr` objects for computed values. Plain strings are literals.
7. Give every trigger and step a stable runtime identifier.
8. Keep `run.limits.max_items` bounded.
9. Do not use arbitrary JavaScript, shell commands, or unrestricted HTTP.
10. Use the TaskNotes action catalog rather than editing task frontmatter.
11. Explain dry-run checks and mutations in the Markdown body.

TaskNotes-specific trigger metadata is a runtime extension:

```yaml
triggers:
  - id: status-active
    event:
      id: task.status.changed
      version: 1.0.0
    x-tasknotes:
      type: tasknotes.event
      to: active
```

Scheduled triggers use a canonical event ID plus executor metadata:

```yaml
triggers:
  - id: weekday-morning
    event:
      id: tasknotes-workflows.schedule.cron
      version: 1.0.0
    x-tasknotes:
      type: cron
      schedule: "0 9 * * 1-5"
      timezone: local
```

## Step Catalog

Inspect the live step catalog before authoring TaskNotes-specific inputs:

```js
const tasknotes = app.plugins.getPlugin("tasknotes")?.api;
const workflows = tasknotes?.extensions.get("tasknotes-workflows");
workflows?.listStepDefinitions();
```

## Template

```markdown
---
type: runtime_workflow
id: short-lowercase-id
version: 1.0.0
name: Human readable name
enabled: false
description: One sentence.
triggers:
  - id: manual
    event:
      id: tasknotes-workflows.manual
      version: 1.0.0
    x-tasknotes:
      type: manual
steps:
  - id: first-step
    action:
      id: notice.show
      version: 1.0.0
    input:
      message: Workflow is wired.
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

# Human readable name

- Explain the trigger.
- Explain each mutation.
- Explain the dry-run checks.
```

## Review Checklist

- The record validates against the canonical runtime workflow schema.
- The workflow is disabled when it writes tasks or vault files.
- Every referenced event and action has a registered contract or an intentional
  TaskNotes executor adapter.
- Expression values use `{ $expr: "..." }`; literal strings remain literal.
- Iteration uses `for_each` and is bounded by `run.limits.max_items`.
- The body is useful to a human reviewing the automation.
