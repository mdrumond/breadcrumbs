# Breadcrumbs Toolkit

Developer tools for exploring breadcrumb trails through a VS Code extension and a CLI.

## Packages

- `@breadcrumbs/core` – Shared models and utilities.
- `@breadcrumbs/cli` – Command line interface for inspecting breadcrumb files.
- `breadcrumbs-extension` – VS Code extension with notebook, panel, and explorer integrations.

## Scripts

- `npm run lint` – Run ESLint (with a built-in fallback checker) plus a Prettier verification that falls back to newline/trailing whitespace and JSON formatting checks when the CLI is unavailable.
- `npm run test` – Execute the lightweight Vitest-compatible harness bundled with the repo.
- `npm run verify` – Run lint, type-check, and tests across the workspace.
- `npm run build` – Compile all packages.
- `npm run clean` – Remove build artifacts.
- `npm run format` – Format the repository using Prettier (requires the Prettier CLI to be installed).

## Development

Install dependencies and verify the workspace:

```bash
npm install
npm run verify
```

Lint, test, or build individual pieces during development:

```bash
npm run lint
npm run test
npm run build
```

The Vitest-compatible runner lives in `scripts/vitest.mjs` and uses the lightweight test utilities
under `packages/vitest` so the workspace can execute in offline environments.

Launch the extension using the **Run Extension** configuration (F5).

### Packaging the VS Code extension

Build the workspace, bundle the extension into a VSIX, and install it for local testing:

```bash
# Compile all packages (or run `npm run build:extension` for just the extension)
npm run build

# Package the extension (install @vscode/vsce globally once if needed)
npx vsce package --no-dependencies --out dist/breadcrumbs-extension.vsix

# Install into your VS Code instance for manual testing
code --install-extension dist/breadcrumbs-extension.vsix
```

Alternatively, use the **Extensions: Install from VSIX...** command inside VS Code and select the generated `dist/breadcrumbs-extension.vsix` file.

### Installing and running the CLI

Build the CLI workspace, then execute the generated binary with `npm exec` or `node`:

```bash
# Compile only the CLI package
npm run build:cli

# Run the CLI with npm exec (recommended)
npm exec --workspace @breadcrumbs/cli breadcrumbs -- --help

# Or invoke the compiled entrypoint directly
node packages/cli/dist/bin.js /path/to/trail.crumb
```

To make the command available globally for local testing, link the workspace package once after building:

```bash
npm link --workspace @breadcrumbs/cli

# breadcrumbs is now on your PATH
breadcrumbs summarize /path/to/trail.crumb
```

### Sample breadcrumb trails

The repository ships with reference notes inside `.breadcrumbs/examples/`. These examples are used
by the extension to populate the explorer and can be copied as a starting point for new trails.

### Git hooks

Enable the provided pre-commit hook to automatically run `npm run verify` before each commit:

```bash
git config core.hooksPath githooks
```
