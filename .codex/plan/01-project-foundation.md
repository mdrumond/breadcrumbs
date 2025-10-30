# Task 1: Establish Project Foundation

## Objective
Set up the repository scaffolding and tooling required for a production-quality VS Code extension that meets the Codex prompt standards.

## Scope
- Configure TypeScript project references with `strict: true`, ESLint (including `max-lines` and JSDoc rules), Prettier, and Jest/Vitest for unit tests.
- Create initial package structure under `packages/` for the extension, shared libraries, and CLI utilities with placeholder exports and docstrings.
- Add npm scripts and CI workflow stubs (build, lint, test) plus documentation on how to run them.
- Provide baseline Git hook installer script skeleton.
- Include README updates describing the project structure and development setup.

## Required Tests
- `npm run lint`
- `npm run test`
- `npm run build`

## Required Examples
- Add placeholder examples in `.breadcrumbs/examples/` demonstrating note file layout referenced in README.
