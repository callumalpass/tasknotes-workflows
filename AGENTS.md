# TaskNotes Workflows - Agent Development Guide

This is an Obsidian companion plugin for TaskNotes. The plugin ID is `tasknotes-workflows`.

TaskNotes Workflows stores workflow definitions as Markdown files with YAML frontmatter. The default workflow folder is `TaskNotes/Workflows/`, and the default Base view is `TaskNotes/Views/workflows.base`.

## Build & Test

```bash
# Build the plugin and copy files to the test vault plugin directories
npm run build:test

# After building, reload the plugin in the running Obsidian instance
obsidian vault=test plugin:reload id=tasknotes-workflows
```

Always run both commands after making code or CSS changes. Obsidian must be running for the CLI reload to work.

If your change depends on sibling TaskNotes runtime API changes in `/home/calluma/projects/tasknotes`, build and reload TaskNotes first:

```bash
cd /home/calluma/projects/tasknotes
npm run build:test
obsidian vault=test plugin:reload id=tasknotes
```

## Useful Obsidian CLI Commands

```bash
# Check for JavaScript errors after reload
obsidian vault=test dev:errors

# View console output
obsidian vault=test dev:console

# Run JavaScript in the Obsidian context
obsidian vault=test eval code="app.plugins.getPlugin('tasknotes-workflows')?.workflows.length"

# Query the generated workflow Base
obsidian vault=test base:query path=TaskNotes/Views/workflows.base view=Workflows format=json

# Take a screenshot to verify UI changes
obsidian vault=test dev:screenshot path=screenshot.png

# Open developer tools
obsidian vault=test devtools
```

## Other Build Commands

```bash
npm test              # Run unit tests (Vitest)
npm run lint          # Lint source files with Obsidian-aware ESLint rules
npm run typecheck     # TypeScript type checking only
npm run build         # Production build without copying to vault
```

Ensure all code changes pass linting checks. Do not weaken linting rules to get changes to pass.

## Runtime Constraints

- Keep the runtime mobile-compatible. Do not use Node runtime APIs in plugin source loaded by Obsidian.
- Node APIs are fine in build, copy, and development scripts.
- Use Obsidian APIs for vault reads, writes, events, commands, and UI.
- Use the TaskNotes JavaScript runtime API for live task reads and writes. Do not bypass TaskNotes by editing task frontmatter directly from workflow steps.
- Keep default workflow files disabled unless there is a clear product reason otherwise.
- Do not overwrite user workflow files when maintaining defaults.
- Workflow notes are user-owned Markdown files. Preserve their body content and avoid unnecessary rewrites.

## Changelog

When you make user-facing changes, update `CHANGELOG.md`. Do not update `CHANGELOG.md` for tests only.

Use the `Unreleased` section for ongoing work. If changes are related to a GitHub issue or PR, include acknowledgement of the person who opened the issue or submitted the PR, and any relevant commenters. Do not thank `callumalpass`.

You may update `.ops/` files locally as you work on items, but do not commit `.ops/` files. `.ops/` is local-only working state.

## Investigating Issues

When investigating issues, try to reproduce them first. Use the Obsidian CLI to reload the plugin, inspect commands, query Bases, open workflow files, and check captured errors.

If a feature request sounds like a custom list or dashboard, first consider whether it can be handled through the generated workflow Base or normal Obsidian Bases behavior.

For UI changes, verify with screenshots when practical. Check that controls are theme-native, compact, accessible, and usable in both reading mode and live preview when note decorations are involved.

## Prepare for a Release

When asked to prepare for a release:

1. Make sure all `npm test` tests are passing.
2. Make sure there are no linting errors.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Check that `main.js`, `manifest.json`, and `styles.css` exist and are non-empty.
6. Make sure all `CHANGELOG.md` entries are user-facing, clear, and appropriately acknowledge issue or PR contributors. Do not include marketing copy.
7. Move `Unreleased` changelog items into a new section for the release version, leaving an empty `Unreleased` section at the top.
8. Update `manifest.json`, `package.json`, `package-lock.json`, and `versions.json`.
9. Commit changes as `release <VERSION NUMBER>`.
10. Tag the commit with the version number only. Do not use a `v` prefix.
