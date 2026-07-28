# Workflow mdbase Type

TaskNotes Workflows uses the canonical Runtime profile 0.2
`mdbase.runtime.workflow` type and does not define an application-specific
replacement. Collections that need to index these records should install the
`mdbase-runtime` standard pack. The pack owns the type, its JSON Schema, and its
contract identity.

The record discriminator is `type: runtime_workflow`. Event and action fields
are contract requirements with an ID and SemVer range. Runtime admission
resolves each requirement to an exact contract digest and declared source or
provider.

## TaskNotes Extensions

TaskNotes-only scheduling, editor, and compatibility state belongs beneath
schema-permitted `x-tasknotes` keys:

```yaml
type: runtime_workflow
id: morning-review
version: 1.0.0
name: Morning review
enabled: false
triggers:
  - id: morning
    event:
      id: tasknotes-workflows.schedule.cron
      version: 1.0.0
    x-tasknotes:
      type: cron
      schedule: "0 9 * * *"
      timezone: local
steps:
  - id: show
    action:
      id: notice.show
      version: 1.0.0
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
materialized as Runtime profile 0.2 workflows until explicitly migrated.

The plugin migration command converts recognized legacy syntax into the
canonical core shape, preserves TaskNotes-only semantics under extensions,
validates the result against the runtime schema, and backs up the original.
