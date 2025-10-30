# Task 4: Implement Core VS Code Extension Features

## Objective
Ship the initial `breadcrumbs-notebook` VS Code extension with activation, note creation commands, and notebook browsing foundations.

## Scope
- Scaffold extension activation, contribution points, and command registrations per `package.json` spec.
- Implement `breadcrumbs.addNote`, `breadcrumbs.openNotebook`, and `breadcrumbs.gotoTarget` commands using the data layer APIs.
- Create the Peek-style overlay for browsing notes associated with the current selection (read-only view with Markdown rendering).
- Build the notebook tree/webview shell displaying notes from `.breadcrumbs/` with navigation to code targets.
- Integrate telemetry-free configuration and persistent state storage as needed.

## Required Tests
- `npm run test packages/extension`
- `npm run lint packages/extension`
- Add VS Code extension integration tests (using `vscode-test` harness) covering activation, add note, peek overlay, and notebook navigation flows.

## Required Examples
- Provide animated GIF or screenshots demonstrating add-note and notebook navigation in README `docs/`.
