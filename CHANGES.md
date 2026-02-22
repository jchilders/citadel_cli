# CHANGES

This file summarizes notable changes for each git version tag in this repository.

## v1.4.0 (2026-02-22)

- Removed TailwindCSS from the project.
- Fixed cursor positioning while entering command arguments.
- Added performance metrics scripts and README documentation for metrics workflows.
- Added ESLint performance checks and addressed related warnings.
- Updated the default `initialHeight` from `40vh` to `50vh`.

## v1.3.0 (2026-02-21)

- Added a typed command DSL and registry adapters.
- Updated README and example commands to use the DSL.
- Improved command input behavior, including two-keystroke expansion and ambiguity handling.
- Added argument help text rendering to help output.
- Improved command history/storage cloning behavior and registry/config stability.
- Expanded test coverage for parser behavior, invalid returns, and multi-instance isolation.
- Improved demo app examples and overall App.tsx presentation.

## v1.2.0 (2026-02-20)

- Added configuration support for custom `fontFamily` and `fontSize`.
- Switched the default demo setup to `basicCommands`.
- Removed unused top-level `examples/` content.
- Fixed end-to-end test issues.

## v1.1.7 (2026-02-20)

- Switched npm publishing to trusted publishing.
- Updated release automation to publish on pushed version tags.
- Added required workflow token permissions (`id-token: write`) for publishing.
- Added UI tests and refactored test harness support for e2e coverage.
- Fixed help command filtering behavior.
- Applied code review fixes, including React anti-pattern cleanup.

## v1.1.6 (2025-10-27)

- Improved command suggestion rendering by sorting and wrapping `AvailableCommands`.

## v1.1.5 (2025-10-25)

- Added inline TTY functionality.
- Reworked example command content.
- Cleaned up Docker support and related tooling.
- Improved auto-publish workflow behavior and trigger scope.
- Fixed skipped test issues.

## v1.1.4 (2025-10-09)

- Patch tag release with no additional notable change commits in this range.

## v1.1.3 (2025-10-09)

- Treated React as an external dependency for packaging.
- Improved GitHub Actions release automation structure.
- Added manual trigger support for auto-publish workflow.
- Fixed version bump automation to correctly push git tags.

## v1.1.2 (2025-10-08)

- Added GitHub Actions automation for npm publishing on version changes.

## v1.1.1 (2025-10-08)

- Established the first public release line and core package/publish setup.
- Added and refined hierarchical command parsing and multi-argument handling.
- Added configurable command timeout support and pending spinner behavior.
- Added configurable panel sizing and resizing behavior, including `maxHeight` and `initialHeight`.
- Added configurable cursor behavior and styling options.
- Added `ImageCommandResult` and improved command result/output handling.
- Refactored configuration/state architecture and command handling internals.
- Added substantial unit test coverage for command registry, parser, and state behavior.
- Improved docs, examples, and Docker demo support.
