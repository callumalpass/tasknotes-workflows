# Changelog

## Unreleased

### Fixed

- (#2076) Run log retention cleanup no longer shows ENOENT notices when concurrent workflow runs try to delete the same old detail file. Thanks to @yvos for reporting this.
- (#2077) Editing the workflow folder setting no longer creates folders for every partial path while typing. Thanks to @yvos for reporting this.

### Added

- Added mdbase runtime provider integration, including versioned provider requirements, preflight checks, provider-authorized workflow dispatch, and `runtime.event` triggers such as `canvas.drop`.
- Added explicit workflow migration analysis with per-file diffs, stale-input checks, configuration-owned backups, rollback on write failure, and no startup-time rewrites.
- Added canonical workflow contract registration with the shared mdbase host.
- Added Obsidian Bases formula expressions for workflow inputs, guards, and loop item selection.
- Added expression-aware date controls, OBE formula builder integration, and source input details in run history for dry-run review.
- Added a disabled default workflow that schedules subtasks one week before their parent task is due.

### Changed

- New, edited, default, and explicitly migrated workflow files now validate and write the canonical mdbase runtime `workflow/0.1` shape. TaskNotes-only scheduler and editor state is stored under `x-tasknotes` extensions.
- Legacy `tasknotes-workflow` and `schemaVersion: 1` files remain readable without mutation. Saving one through the editor is an explicit canonical conversion.
- Registered runtime actions are dispatched through the shared host and policy denials no longer fall back to the local TaskNotes adapter.

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
