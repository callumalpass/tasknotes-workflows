# Changelog

## Unreleased

## [0.1.2] - 2026-08-07

### Fixed

- (TaskNotes #2076) Run log retention cleanup no longer shows notices when concurrent workflow runs try to delete the same old detail file. Thanks to @yvos for reporting this.
- (#9, PR #10) Disabled workflows no longer react to TaskNotes events or add skipped runs to the log. Concurrent runs now keep each other's history, and retention reliably removes the oldest runs first. Thanks to @mtmclient and @ludon89 for reporting this, @nelsonlove for the fix, and @kjohnsen for helping review it.
- (#5, TaskNotes #2077) Editing the workflow folder setting no longer creates folders for every partial path while typing. Thanks to @chmac and @yvos for reporting this.
- (#6) Workflow, trigger, and step IDs now allow a hyphen to remain while the next part of the ID is typed. Thanks to @chmac for reporting this.
- (#7) Changing a TaskNotes trigger away from a status-change event now removes hidden status filters from the saved workflow. Thanks to @chmac for reporting this.
- (#19) Custom TaskNotes fields are now available to the expression validator under `customProperties`. The workflow guide also explains configured property mappings and nested task folders. Thanks to @Mies4GH for reporting this.

### Added

- Added contract-event subscriptions and contract-action invocation over the mdbase interoperability bridge.
- Added explicit workflow migration analysis with per-file diffs, stale-input checks, configuration-owned backups, rollback on write failure, and no startup-time rewrites.
- Added the versioned `tasknotes.workflow.run` action contract for other granted applications.
- Added Obsidian Bases formula expressions for workflow inputs, guards, and loop item selection.
- Added expression-aware date controls, OBE formula builder integration, and source input details in run history for dry-run review.
- Added a disabled default workflow that schedules subtasks one week before their parent task is due.

### Changed

- New, edited, default, and explicitly migrated workflow files now validate and write the canonical Runtime profile 0.2 `runtime_workflow` shape. TaskNotes-only scheduler and editor state is stored under `x-tasknotes` extensions.
- Legacy `tasknotes-workflow` and `schemaVersion: 1` files remain readable without mutation. Saving one through the editor is an explicit canonical conversion.
- Local TaskNotes steps now execute only in TaskNotes Workflows, while portable actions execute only through the interoperability bridge. The obsolete private runtime-host fallback and uncontracted `runtime.event` trigger were removed.
- (#4) Documented how `task.patch` can update or remove custom frontmatter properties. Thanks to @techy-robot and @chmac for requesting this.

## [0.1.1] - 2026-06-01

### Changed

- Enabled TaskNotes-style CSS linting and removed review-warning CSS patterns.

## [0.1.0] - 2026-06-01

### Added

- Initial TaskNotes Workflows companion plugin release.
- Markdown-defined workflow notes stored in the vault with typed triggers, conditions, steps, and run policy.
- Workflow Base view and editor for creating, editing, opening, running, and dry-running workflows.
- Disabled default workflows for time tracking, status-triggered date cleanup, started timestamps, overdue review, scheduled-date rollover, due-date priority escalation, blocked-task review, folder movement, subtask inheritance, dependency inheritance, and parent-to-subtask mirroring.
- TaskNotes runtime API integration for live task reads and writes, catalog-backed status and priority options, and canonical runtime task queries.
- Obsidian-native file, workspace, frontmatter, navigation, and notice workflow actions.
- Interface translations for French, Russian, Chinese, German, Spanish, Japanese, Portuguese, and Korean.
