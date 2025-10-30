# Task 1: Establish Project Foundation

## Objective

Set up the repository scaffolding and tooling required for a production-quality VS Code extension that meets the Codex prompt standards.

## Scope

- Configure TypeScript project references with `strict: true`, ESLint (including `max-lines` and JSDoc rules), Prettier, and Jest/Vitest for unit tests.
- Create initial package structure under `packages/` for the extension, shared libraries, and CLI utilities with placeholder exports and docstrings.
- Add npm scripts and CI workflow stubs (build, lint, test) plus documentation on how to run them.
- Provide baseline Git hook installer script skeleton.
- Include README updates describing the project structure and development setup.

## Status

- ✅ TypeScript project references are in place with `strict: true` enforced via `tsconfig.base.json`. Workspace builds compile each package through `tsconfig.json`.
- ✅ ESLint is configured in `eslint.config.mjs` with `max-lines`, TypeScript safety rules, and JSDoc validation alongside a shared Prettier profile in `.prettierrc.json`. A fallback static checker mirrors the required rules when external plugins are unavailable.
- ✅ A lightweight Vitest-compatible harness (`packages/vitest` + `scripts/vitest.mjs`) replaces the temporary Node test runner shim while remaining runnable offline.
- ✅ CLI, core library, and extension packages expose documented placeholder APIs under `packages/` with typed exports for future development.
- ✅ Workspace scripts (`lint`, `test`, `build`, `verify`) and the CI workflow (`.github/workflows/ci.yml`) orchestrate linting, testing, and builds. README sections outline how to run each command during development.
- ✅ A pre-commit hook stub (`githooks/pre-commit`) runs `npm run verify` to guard commits. Sample breadcrumb trails live in `.breadcrumbs/examples/` for documentation and UX smoke tests.

## Follow-ups

- Expand ESLint rules to cover React/JSX files once UI components are introduced.
- Add dedicated documentation for contributing guidelines and coding standards as the project matures beyond the initial scaffolding.
- Expose the offline Vitest shim via a workspace alias or publish it under `node_modules` so tests can rely on the bare `vitest` specifier again.

## Required Tests

- `npm run lint`
- `npm run test`
- `npm run build`

## Required Examples

- Add placeholder examples in `.breadcrumbs/examples/` demonstrating note file layout referenced in README.
