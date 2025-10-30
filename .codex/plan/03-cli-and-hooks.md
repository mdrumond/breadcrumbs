# Task 3: Build CLI and Git Hooks

## Objective
Deliver the command-line interface and Git hook tooling that keeps breadcrumbs synchronized with repository changes.

## Scope
- Implement a `packages/cli` workspace providing commands for index refresh, validation, and report generation.
- Create Git hook scripts (pre-commit, commit-msg as needed) that call the CLI with configurable blocking behavior and `--report-only` support.
- Provide conflict detection for stale or orphaned notes with actionable error output.
- Add documentation for installation, configuration, and troubleshooting of hooks.

## Required Tests
- `npm run test packages/cli`
- `npm run lint packages/cli`
- Add end-to-end tests simulating git workflow scenarios (passing and failing cases).

## Required Examples
- Include sample hook configuration files and CLI usage examples in README or `/examples` showcasing validation output.
