# AI Agent Authoring Script

Use this script when an AI agent writes TaskNotes Workflows Markdown files.

## Role

You write safe TaskNotes workflow definitions as Markdown notes. The YAML frontmatter is executable configuration. The Markdown body explains intent, assumptions, and safe testing steps.

## Rules

1. Write files in `TaskNotes/Workflows/` unless the user specifies another workflow folder.
2. Treat `TaskNotes/Views/workflows.base` as the default human Base view; do not hand-edit it unless the user asks.
3. Use `type: tasknotes-workflow` and `schemaVersion: 1`.
4. Prefer `enabled: false` for new workflows that mutate tasks or vault files. Tell the user to dry-run before enabling.
5. Use `triggers`, not a top-level `on` key.
6. Use `steps` as the canonical pipeline. Only use `actions` when converting very old examples.
7. Never use arbitrary JavaScript, shell commands, or unrestricted HTTP requests.
8. Mutate tasks only through typed step types such as `task.patch`, `task.move`, `time.start`, and `task.complete`.
9. Mutate vault files only through typed Obsidian step types such as `obsidian.createNote`, `obsidian.appendNote`, `obsidian.updateFrontmatter`, and `obsidian.moveFile`.
10. Use relationship read steps such as `task.parents`, `task.subtasks`, and `task.dependencies` instead of reimplementing TaskNotes relationship logic in queries.
11. Use constrained references such as `{{trigger.after.path}}`, `{{trigger.path}}`, `{{steps.query.tasks}}`, `{{steps.parents.tasks[0].path}}`, `{{item.path}}`, `{{today}}`, and `{{now}}`.
12. Give every trigger and step a stable id.
13. Add `run.noOverlap: true` unless the user explicitly needs overlap.
14. For event-triggered workflows, avoid responding to workflow-originated mutations unless `allowSelfTrigger: true` is clearly required.
15. For cron and interval workflows, keep `maxTasks` bounded.
16. Write a short body explaining what to check in dry run and what the workflow will mutate when enabled.
17. Use `type: tasknotes.event` for TaskNotes runtime events.
18. Use the canonical TaskNotes runtime task query DTO in `task.query`; prefer `field`, `op`, and `value` conditions with `all`, `any`, `sort`, `group`, `limit`, and `scope` as needed.
19. Write only the runtime query DTO for `task.query`; no other query object shape is supported.

## Step Catalog

When available, inspect the runtime step catalog before writing inputs:

```js
const tasknotes = app.plugins.getPlugin("tasknotes")?.api;
const workflows = tasknotes?.extensions.get("tasknotes-workflows");
workflows?.listStepDefinitions();
```

Use each step's `inputFields` as the contract for what the frontmatter expects, and `outputFields` as the contract for references like `{{steps.query.tasks}}`.

## Template

```markdown
---
type: tasknotes-workflow
schemaVersion: 1
id: short-lowercase-id
name: Human readable name
enabled: false
description: One sentence.
triggers:
  - id: manual
    type: manual
conditions: []
steps:
  - id: first-step
    type: notice.show
    input:
      message: "Workflow is wired."
run:
  mode: sequential
  noOverlap: true
  source: tasknotes-workflows
  maxTasks: 25
  onError: stop
---

# Human readable name

What it does:

- Explain the trigger.
- Explain each mutation.
- Explain dry-run checks.
```

## Review Checklist

- The YAML parses.
- The workflow is disabled if it writes tasks.
- Every referenced value exists in `workflow`, `trigger`, `vars`, `steps`, `item`, `today`, or `now`.
- Batch workflows use `forEach` and `maxTasks`.
- The body is useful to a human reading the note later.
