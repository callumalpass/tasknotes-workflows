# Workflow mdbase Type

TaskNotes Workflows uses the canonical mdbase runtime workflow record. It does
not define a second schema with the same `type: workflow` discriminator.

An mdbase v0.3 collection can match workflow notes with this type wrapper:

```markdown
---
kind: mdbase.type
name: workflow
version: 1
description: Runtime workflow record.
match:
  fields_present:
    - type
    - id
    - version
  where:
    $expr: 'record.type == "workflow"'
schema:
  dialect: json-schema-2020-12
  ref: ../schemas/v0.3/runtime/workflow.schema.json
---

# Workflow

A workflow maps registered events to registered actions.
```

The relative `schema.ref` depends on the collection layout. Consumers may use
an equivalent inline copy of the canonical schema, but the schema content and
runtime profile version must remain exact.

## TaskNotes Extensions

TaskNotes-only scheduling, editor, and compatibility state belongs beneath
schema-permitted `x-tasknotes` keys:

```yaml
type: workflow
id: morning-review
version: 1
name: Morning review
enabled: false
triggers:
  - id: morning
    event: tasknotes-workflows.schedule.cron
    x-tasknotes:
      type: cron
      schedule: "0 9 * * *"
      timezone: local
steps:
  - id: show
    action: notice.show
    input:
      message: Review active tasks.
x-tasknotes:
  format_version: 1
  source: tasknotes-workflows
```

Generic runtimes validate the core workflow and may ignore the extension.
TaskNotes Workflows interprets the extension when it is the selected executor.

## Legacy Records

`type: tasknotes-workflow` and `type: workflow` records using
`schemaVersion: 1` are compatibility inputs, not mdbase runtime workflows. They
remain readable by TaskNotes Workflows but must not be published or
materialized as `workflow/0.1` contracts until explicitly migrated.

The plugin migration command converts recognized legacy syntax into the
canonical core shape, preserves TaskNotes-only semantics under extensions,
validates the result against the runtime schema, and backs up the original.
