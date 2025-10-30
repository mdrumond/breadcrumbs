# Task 5: Deliver Breadcrumbs Pane and Chain Workflows

## Objective
Complete the side-pane experience for navigating notes, chains, and file-scoped timelines with full drag-and-drop interactions.

## Scope
- Implement custom TreeDataProviders for Notes, Code Steps, and Chains views within a dedicated activity bar container.
- Add filtering, search, and status indicators (fresh/stale/orphaned) driven by the index cache.
- Enable drag-and-drop reordering of chain steps and corresponding persistence updates.
- Implement `breadcrumbs.createChain`, `breadcrumbs.addToChain`, and `breadcrumbs.showChain` commands with graphical mini-map or step viewer.
- Provide contextual menus for pane items and ensure they trigger the appropriate commands.

## Required Tests
- `npm run test packages/extension -- --grep "Chain"`
- `npm run lint packages/extension`
- Extend integration tests to cover chain creation, reordering, and navigation via the pane.

## Required Examples
- Add a richer demo chain in `.breadcrumbs/examples/` and include screenshots of the pane interactions in documentation.
