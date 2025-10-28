# Codex Prompt: VS Code Breadcrumbs Extension & Markdown Notebook

You are Codex. Build a production‑quality VS Code extension named **`breadcrumbs-notebook`** that lets developers create, browse, and maintain **breadcrumbs**—small, typed annotations tied to *code locations*—and stores them as Markdown notes in a Git‑tracked `.breadcrumbs/` folder at the repo root.

Your deliverable is a full repository with:

* A working VS Code extension (TypeScript) with a polished UX.
* Strong typing everywhere (TypeScript `strict: true`) and lint compliance.
* Complete automated tests (unit + integration) that always run in CI before success.
* A Git hooks toolchain that enforces breadcrumb/code consistency.
* Clear docs and examples.
* **All functions/classes must include docstrings (TSDoc/JSDoc).**
* **No file may exceed ~800 lines**; if it grows, split into modules.

---

## 1) Goals & User Experience

**Use cases**

1. Add a breadcrumb to the current selection (single line or range).
2. Annotate with:

   * Free‑form notes (Markdown).
   * Annotated links to web pages (with labels and optional summary).
   * Annotated links to other notes in the notebook.
   * Annotated links to other code locations.
3. Browse breadcrumbs inline via a custom **Peek‑like overlay** (reuse VS Code Peek or implement a similar readonly editor) showing rich Markdown.
4. Open a **Notebook view** for `.breadcrumbs/` that supports navigation and backlinks.
5. Jump from a note to its target code (and vice‑versa) with a single command.
6. Commit‑time validation: if referenced code changed, the user must update or remove affected notes.

**Non‑goals**

* No telemetry.
* No external services (offline‑first). Only Node + Git + VS Code APIs.

---

## 2) Data Model & File Layout

**Folder**: `.breadcrumbs/` at repo root, tracked by Git.

**Note file format**: Markdown with YAML frontmatter. Each note is a standalone file, plus an index.

```markdown
---
id: bkmk_2025_10_27_T12_34_56_123Z
createdAt: 2025-10-27T12:34:56.123Z
updatedAt: 2025-10-27T12:34:56.123Z
kind: note | link:web | link:note | link:code
labels: ["refactor", "api"]
# Target describes the referenced entity (if any)
target:
  type: "code" | "note" | "web" | null
  path: "src/feature/mod.ts"          # for type=code
  range: { start: { line: 42, character: 4 }, end: { line: 45, character: 18 } }
  commit: "<git-commit-or-blob>"       # anchor for historical reference
  snippetHash: "<sha256 of normalized snippet>"
  noteId: "bkmk_..."                   # for type=note
  url: "https://example.com/..."       # for type=web
---

# Title

Free‑form markdown body, task list, and code blocks.
```

**Index file**: `.breadcrumbs/index.json`

* Maps `id -> filename`
* Stores backlinks and tags cache for fast lookup.

**Backlinks** are computed (or cached) by scanning frontmatter `target.noteId` across notes.

**Design constraints**

* Keep filenames stable: `YYYYMMDD-HHMMSS-id.md`.
* Use safe characters; avoid spaces in filenames.
* Enforce maximum line length and file length via lint rules.

---

## 3) Extension Features (VS Code)

Implement as TypeScript with VS Code API.

**Side Pane (View Container)**

* A dedicated **Breadcrumbs Pane** in the Activity Bar or Explorer contains:

  * **Notes** view: filterable by label, file, chain, and status (fresh/stale/orphaned).
  * **Code Steps** view: chronological sequence of notes tied to the currently open file/folder.
  * **Chains** view: list of chains; selecting a chain shows ordered steps with quick actions (open, jump, reorder, remove).
* Supports drag‑and‑drop to reorder steps within a chain.

**Commands (contribute via `package.json`)**

* `breadcrumbs.addNote` – Create a note for current selection. QuickPick to choose kind: note | link:web | link:note | link:code.
* `breadcrumbs.peekAtCursor` – Show Peek overlay of notes pointing to the current location.
* `breadcrumbs.openNotebook` – Open the Notebook view (tree/webview) of `.breadcrumbs/`.
* `breadcrumbs.openPane` – Toggle the side **Breadcrumbs Pane** for navigating notes and code steps.
* `breadcrumbs.createChain` – Create a new chain; add the current note as the first step.
* `breadcrumbs.addToChain` – Add a selected note to an existing chain (choose position).
* `breadcrumbs.showChain` – Visualize a chain (list + inline code line previews + graph mini‑map) and enable stepwise navigation.
* `breadcrumbs.gotoTarget` – From a note editor, jump to its target (code, note, or web).
* `breadcrumbs.search` – Search notes by text, label, chain, or target path.
* `breadcrumbs.refreshIndex` – Rebuild the index if files changed.
* `breadcrumbs.validate` – Manual validation of references vs current working tree.

**Context menus**

* Editor selection: “Add Breadcrumb…”
* Note editor: “Go to Target”, “Copy Deep Link”, “Reveal in Explorer”.
* Pane items: “Add to Chain…”, “Remove from Chain”, “Reorder Step…”.

**Peek‑like overlay**

* Use `TextDocumentContentProvider` or an equivalent to render an ephemeral document with Markdown preview for notes applicable to the cursor’s location.
* Each entry shows: title, labels, target summary, and excerpt. Provide buttons: **Open**, **Jump**, **Edit**, **Delete**.

**Notebook visualization**

* Provide a **Custom Editor / Webview** showing a left tree (by file path, labels, chains, and backlinks) and a right pane rendering the Markdown.
* Keyboard navigation between note list and preview.
* Back/forward navigation history.
* **Chain view**: render ordered steps with the referenced **code lines/ranges** and inline annotations; allow playthrough (prev/next), collapse/expand steps, and quick jump to code.

**Navigation**

* From code: peek + list of relevant notes.
* From note: command to jump to `target` (code location, another note, or open web URL in external browser).
* From pane: select items to focus the editor on the target range.

**Deep links**

* Scheme `breadcrumbs://note/<id>` and `breadcrumbs://code/<path>#Lstart-Lend` for internal navigation.

**Performance**

* Watcher on `.breadcrumbs/` and workspace files to keep index hot.
* Debounce heavy scans; perform incremental updates.

## 4) Robust Code Anchoring

**Anchors** combine multiple signals to detect drift:**

* *Path + range* (line/character) of initial selection.
* *Blob/commit hash* of the file when note was created (for historical lookup).
* *Snippet hash* (normalize whitespace, strip comments optionally, configurable per language).

**Drift detection algorithm**

1. Confirm file exists; if not, mark as **orphaned**.
2. If file changed since `commit`, attempt to locate snippet by:

   * Searching for the exact snippet text.
   * If not found, fuzzy match via token sequence or AST anchor (for supported languages via `@typescript-eslint/typescript-estree` or Tree‑sitter via WASM).
3. If a best match is found above a threshold, update `range` and `snippetHash` (record `relocatedFrom`).
4. If confidence < threshold, mark note **stale** and require user action on commit.

**Language support**

* Baseline: plain‑text diff + fuzzy matching for any language.
* Enhanced anchors for TS/JS, Python, Go (pluggable strategy interface).

---

## 5) Git Hook Enforcement

**Objective**: Prevent committing when notes reference code that changed without being reconciled, and provide a **rich conflict‑style resolution UI** to fix inconsistencies efficiently.

**Implementation**

* Provide a Node CLI `breadcrumbs-hook` installed via `npm run setup-hooks`.
* Generates scripts for `.git/hooks/pre-commit` and `.git/hooks/pre-push` that call `node ./scripts/check-breadcrumbs.mjs`.
* On **pre-commit**:

  * Determine changed files (`git diff --cached --name-only`).
  * For notes that target any changed file, run **drift detection** against the *staged* version.
  * Validate **chains**: if any step is stale/orphaned, mark entire chain **stale** and fail with a chain‑centric message (identifies broken step numbers).
  * If any inconsistency exists, fail and (when inside VS Code) **open the Breadcrumb Conflict Resolver**.

**Breadcrumb Conflict Resolver (UI)**

* Opens a custom editor similar to VS Code merge conflicts with **inline conflict blocks** for each stale note.
* For each conflict block show:

  * **Left pane**: *Referenced snippet* at time of note (from commit/blob) with highlights.
  * **Right pane**: *Current staged code* lines for the target range + best fuzzy match.
  * **Middle actions**: `Accept Current`, `Accept Referenced`, `Relocate to Suggested`, `Edit Range…`, `Mark Stale`, `Remove Link`, `Open Diff`, `Preview Render`.
  * **Metadata**: confidence score, file path, chain step (if any).
* Supports multi‑conflict navigation (`Next`, `Previous`), quick fixes, and bulk actions.
* Persists user choice by updating note frontmatter (`range`, `snippetHash`, `relocatedFrom`) or status flags; updates `index.json` and revalidates live.

**On pre-push**:

* Revalidate entire notebook (fast path; use cache).
* Optionally require zero stale notes/chains to push (configurable).

**Developer escape hatches**

* Config file `.breadcrumbsrc.json` (committed) with flags:

  * `enforceOnPreCommit: true` (default), `enforceOnPrePush: true`.
  * `languages: { ts: { normalizeComments: true } }`.
  * `ignore: ["**/generated/**"]`.
  * `chains: { blockOnBroken: true }`.
  * `resolver: { openOnFail: true, showConfidence: true }`.
* CLI flags: `--no-enforce`, `--report-only` (CI may run report but not block).

## 6) Testing & Tooling Requirements

**General**

* **All features thoroughly tested**. Include happy paths and edge cases.
* **Always run tests and linting** locally and in CI. CI must fail on any error.
* 100% type‑checked with `strict: true`; no `any` or `@ts-ignore` (except commented justifications which are lint‑enforced).

**Unit tests**

* Use `vitest` or `jest` for logic (parsers, drift matching, indexing).
* Snapshot tests for Markdown rendering and Peek provider content.

**Integration tests**

* Use `@vscode/test-electron` to test extension activation, commands, and workspace interactions.
* Git hook tests: simulate repos in temp dirs, mutate files, assert the hook blocks or allows commits as expected.

**Static analysis & linting**

* `eslint` with TypeScript plugin, `@typescript-eslint` rules, Prettier for formatting.
* Enforce docstrings via ESLint rule (`jsdoc/require-jsdoc` or custom).
* Enforce max file length < 800 lines via ESLint (`max-lines`).

**CI**

* GitHub Actions workflow that runs: `npm ci`, `npm run build`, `npm run lint`, `npm test`, integration suite on Linux + macOS.

---

## 7) Repository Structure

```
.breadcrumbs/                 # example sample data for e2e tests
  chains/                     # chain definition JSONs
  examples/                   # demo notes + chains used in README and tests
    20251027-123456-bkmk_a.md
    20251027-123507-bkmk_b.md
    chains/
      chain_refactor_dal.json
.vscode/
  settings.json               # enable recommended extensions and format on save
.github/
  workflows/ci.yml
scripts/
  check-breadcrumbs.mjs       # hook entry
  install-git-hooks.mjs       # writes .git/hooks/*
src/
  extension.ts                # activation, command registration
  commands/
    addNote.ts
    peekAtCursor.ts
    openNotebook.ts
    openPane.ts
    createChain.ts
    addToChain.ts
    showChain.ts
    resolveConflicts.ts       # opens Breadcrumb Conflict Resolver
    gotoTarget.ts
    search.ts
    refreshIndex.ts
    validate.ts
  notebook/
    NotebookPanel.ts          # webview + message protocol
    NotebookIndex.ts          # caching/indexing/backlinks
  pane/
    BreadcrumbsView.ts        # TreeView provider for Notes/Code Steps/Chains
  conflict/
    ResolverPanel.ts          # conflict-style resolution custom editor/webview
    DiffRenderer.ts           # utility for side-by-side code+snippet views
  model/
    Note.ts
    Chain.ts
    Index.ts
    Anchors.ts                # drift detection strategies
    Types.ts                  # shared types; strict typings
  providers/
    PeekProvider.ts
    ContentProvider.ts
  utils/
    fs.ts
    git.ts
    hashing.ts
    logging.ts
  cli/
    main.ts                   # `breadcrumbs` CLI for validate/search/fix
test/
  unit/
  integration/
  fixtures/
package.json
tsconfig.json
.eslintrc.cjs
.prettierrc
.breadcrumbsrc.json           # default config template
README.md
agents.md                    # (see below)
CHANGELOG.md
```

.breadcrumbs/                 # example sample data for e2e tests
.vscode/
settings.json               # enable recommended extensions and format on save
.github/
workflows/ci.yml
scripts/
check-breadcrumbs.mjs       # hook entry
install-git-hooks.mjs       # writes .git/hooks/*
src/
extension.ts                # activation, command registration
commands/
addNote.ts
peekAtCursor.ts
openNotebook.ts
gotoTarget.ts
search.ts
refreshIndex.ts
validate.ts
notebook/
NotebookPanel.ts          # webview + message protocol
NotebookIndex.ts          # caching/indexing/backlinks
model/
Note.ts
Index.ts
Anchors.ts                # drift detection strategies
Types.ts                  # shared types; strict typings
providers/
PeekProvider.ts
ContentProvider.ts
utils/
fs.ts
git.ts
hashing.ts
logging.ts
cli/
main.ts                   # `breadcrumbs` CLI for validate/search/fix
test/
unit/
integration/
fixtures/
package.json
tsconfig.json
.eslintrc.cjs
.prettierrc
.breadcrumbsrc.json           # default config template
README.md
agents.md                    # (see below)
CHANGELOG.md

````

---

## 8) agents.md (Process & Quality Gates)

Create `agents.md` with the following guidance to govern your behavior while generating code and tests:

### Mission
Build a maintainable, well‑tested VS Code extension and CLI that implement breadcrumbs‑to‑markdown with strong typing and robust drift detection. Prioritize developer ergonomics and reliability.

### Global Rules
1. **Type hints everywhere**: TypeScript `strict: true`; no implicit `any`. Define precise domain types in `Types.ts`.
2. **Lint compliance everywhere**: ESLint must pass. Do not use `// eslint-disable` without a clear, documented justification.
3. **Docstrings required**: Every public function, class, and file must include TSDoc‑style comments describing purpose, parameters, returns, and errors.
4. **Tests first**: Before implementing a feature, add or update tests (TDD where reasonable). **Always run tests and linting** locally while coding.
5. **No long files**: If a file approaches **800 lines**, split into modules. Prefer small, cohesive files.
6. **Error handling**: Fail fast with explicit errors. Never swallow exceptions.
7. **Determinism**: Pure functions for hashing/normalization; seed or isolate non‑deterministic behavior in utilities.
8. **Configurable**: Respect `.breadcrumbsrc.json` for thresholds and language options.
9. **Performance**: Avoid blocking VS Code UI; offload heavy work; debounce watchers.
10. **Security**: Sanitize Markdown; avoid script injection in webviews.

### Required Pipelines
- `npm run lint` – Lints and type‑checks.
- `npm test` – Runs unit and integration tests.
- `npm run verify` – Runs build, lint, test. CI uses this.

### Definition of Done
- All new code has docstrings and passing tests.
- Lint and type checks pass with zero warnings.
- User journeys (add note, peek, navigate, validate, hook enforcement) have green integration tests.
- README updated.

---

## 9) Implementation Notes

**Markdown rendering**
- Use VS Code `MarkdownString` with `isTrusted` gated by config. Render labels as badges.

**Web links**
- Store `url` plus optional `annotation` in the body. Provide a command to open in external browser.

**Linking to notes**
- QuickPick of existing notes by title/labels. Backlinks computed in index.

**Linking to code**
- Store `path` (workspace‑relative) + `range`, plus snippet and hashes.

**Normalization & hashing**
- Implement `normalizeSnippet(text: string, lang: string): string`.
- `sha256(normalized)`: crypto subtle or Node `crypto`.

**Relocation UI**
- When drift detected, show choice: **Update Range**, **Mark As Stale**, **Open Diff**, **Remove Link**.

**Workspace multi‑root**
- Support multi‑root by placing `.breadcrumbs/` in each root; select active root by active editor.

**Internationalization**
- Keep strings centralized for future i18n.

**Logging**
- Provide a dedicated Output channel: `Breadcrumbs`.

---

## 10) README Requirements

- What it does; screenshots of Peek overlay and Notebook view.
- Getting started (install, commands, keyboard shortcuts).
- How to set up Git hooks enforcement.
- Configuration options.
- Limitations and roadmap.

---

## 11) Example Test Matrix (non‑exhaustive)

- Model
  - Create note (all kinds) → file persisted → index updated.
  - Backlinks computed correctly.
  - Normalize + hash stable across trivial whitespace changes.
  - **Chain** create/add/remove/reorder; serialization and index updates.
- Anchors
  - Exact match → 100% confidence; range updated after insertions above.
  - Fuzzy match for moved function; verify threshold gating.
  - AST anchor (TS): match by function name + signature.
- CLI & Hooks
  - Modified targeted file: hook blocks commit with message.
  - Non‑targeted changes: hook passes.
  - `--report-only` produces JSON report but non‑zero exit not thrown.
  - **Broken chain step** blocks commit when `chains.blockOnBroken` is true.
- Extension
  - `addNote` registers; creates files.
  - `peekAtCursor` shows relevant notes for selection.
  - `openPane` creates side pane and filters work.
  - `createChain`/`addToChain`/`showChain` work end‑to‑end.
  - `resolveConflicts` opens resolver and applies user action to update notes.
  - `gotoTarget` opens correct editor and range.
  - Notebook tree filters by label and chain.
- Conflict Resolver UI
  - Renders left (referenced) vs right (current) panes with actions.
  - Applying `Relocate to Suggested` updates range/hash and clears conflict.
  - Bulk resolve applies to multiple conflicts and writes updates.

## 12) Acceptance Checklist (auto‑verifiable via tests where possible) (auto‑verifiable via tests where possible)

- [ ] VS Code extension activates on `onStartupFinished` and on relevant commands.
- [ ] `.breadcrumbs/` folder and `index.json` are created lazily and updated transactionally.
- [ ] Notes round‑trip (edit → save → index) correctly.
- [ ] Peek overlay renders Markdown with code excerpts and actions.
- [ ] Git hooks installation script writes portable shell/PowerShell scripts.
- [ ] Pre‑commit blocks when stale/orphaned notes exist; message suggests fix.
- [ ] CI runs build, lint, unit + integration tests across platforms.
- [ ] No file exceeds ~800 LOC; ESLint `max-lines` enforced.
- [ ] All functions/classes include TSDoc docstrings.

---

## 13) Coding Standards Snippets

- Enable `"strict": true` in `tsconfig.json`.
- ESLint rules: `@typescript-eslint/consistent-type-definitions`, `no-explicit-any`, `max-lines: ["error", 800]`, `jsdoc/require-jsdoc`.
- Use `zod` or a lightweight schema guard for frontmatter parsing.
- Prefer async FS APIs; wrap Git calls with timeouts and clear errors.

---

## 14) Deliverables

- Complete repo with the structure above.
- Green CI.
- Demo workspace with sample notes.
- Screenshots (or GIFs) referenced by README.

> **Remember:** keep files small; split modules proactively. Run lint and tests continuously. Type everything. Docstrings on all public APIs.

---

## 15) Sample Data (Ship with repo)

Place the following demo files under `.breadcrumbs/examples/` and reference them in README screenshots/tests.

**`examples/20251027-123456-bkmk_a.md`**
```markdown
---
id: bkmk_a
createdAt: 2025-10-27T12:34:56.000Z
updatedAt: 2025-10-27T12:34:56.000Z
kind: link:code
labels: ["tutorial", "dal"]
target:
  type: "code"
  path: "src/dal/repository.ts"
  range: { start: { line: 18, character: 0 }, end: { line: 36, character: 0 } }
  commit: "DEMO123"
  snippetHash: "abc123"
chain:
  id: "chain_refactor_dal"
  step: 1
---

# Replace direct SQL with QueryBuilder

Rationale for moving to a typed query builder; see step 2 for pagination.
````

**`examples/20251027-123507-bkmk_b.md`**

```markdown
---
id: bkmk_b
createdAt: 2025-10-27T12:35:07.000Z
updatedAt: 2025-10-27T12:35:07.000Z
kind: link:code
labels: ["tutorial", "dal"]
target:
  type: "code"
  path: "src/dal/repository.ts"
  range: { start: { line: 60, character: 0 }, end: { line: 84, character: 0 } }
  commit: "DEMO123"
  snippetHash: "def456"
chain:
  id: "chain_refactor_dal"
  step: 2
---

# Add Cursor-based Pagination

Notes on API contract and tests impacting `Repository.list`.
```

**`examples/chains/chain_refactor_dal.json`**

```json
{
  "id": "chain_refactor_dal",
  "title": "Refactor data access layer",
  "createdAt": "2025-10-27T12:40:00.000Z",
  "description": "Walkthrough of DAL refactor with annotations",
  "noteIds": ["bkmk_a", "bkmk_b"]
}
```

> The demo assumes a toy file `src/dal/repository.ts` and will be used by integration tests to verify navigation, chain visualization, and conflict resolution flows.
