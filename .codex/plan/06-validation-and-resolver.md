# Task 6: Implement Validation Engine and Conflict Resolver UI

## Objective
Ensure breadcrumb references stay accurate by validating code anchors and providing rich conflict resolution workflows inside VS Code.

## Scope
- Integrate Git-aware diffing to detect when referenced code snippets move or diverge, updating index status accordingly.
- Implement `breadcrumbs.validate` command and expose stale/orphaned status via diagnostics and pane badges.
- Build the conflict resolver webview that presents original vs current snippets with relocation options, including bulk resolve.
- Wire validation results into the CLI and extension commands for consistent messaging and blocking behavior.

## Required Tests
- `npm run test packages/extension -- --grep "validate"`
- `npm run test packages/cli -- --grep "validate"`
- `npm run lint`
- Add integration tests simulating code edits that trigger conflicts and verify resolver actions update notes.

## Required Examples
- Provide walkthrough examples (screenshots or GIF) of conflict detection and resolution under `docs/` and expand `.breadcrumbs/examples/` with conflict scenarios.
