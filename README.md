# Breadcrumbs Toolkit

Developer tools for exploring breadcrumb trails through a VS Code extension and a CLI.

## Packages

- `@breadcrumbs/core` – Shared models and utilities.
- `@breadcrumbs/cli` – Command line interface for inspecting breadcrumb files.
- `breadcrumbs-extension` – VS Code extension with notebook, panel, and explorer integrations.

## Scripts

- `npm run verify` – Run lint, type-check, and tests across the workspace.
- `npm run build` – Compile all packages.
- `npm run clean` – Remove build artifacts.

## Development

Install dependencies and verify the workspace:

```bash
npm install
npm run verify
```

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

### Git hooks

Enable the provided pre-commit hook to automatically run `npm run verify` before each commit:

```bash
git config core.hooksPath githooks
```
