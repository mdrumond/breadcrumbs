# Task 2: Implement Notebook Data Layer

## Objective
Provide the core libraries for managing breadcrumb notes, chains, and the index on disk with transactional guarantees.

## Scope
- Implement shared TypeScript modules for note schema validation (using Zod or similar), YAML frontmatter parsing, and Markdown serialization with docstrings.
- Create file system services to create/update/delete notes under `.breadcrumbs/`, ensuring filename stability and atomic writes.
- Build the `index.json` management layer with backlink computation, caching, and integrity checks.
- Implement utilities for snippet hashing, Git commit anchoring, and conflict detection primitives.
- Update README developer docs to describe the data model and APIs.

## Status
- ✅ Introduced the `@breadcrumbs/notebook-data` package with dedicated note and chain schema validators, YAML frontmatter parsing, and docstring-aware Markdown serialization layered on top of the core types. 【F:packages/notebook-data/src/index.ts†L1-L8】【F:packages/notebook-data/src/note.ts†L1-L119】【F:packages/notebook-data/src/chain.ts†L1-L49】
- ✅ Added filesystem services for deterministic `.breadcrumbs/notes` and `.breadcrumbs/chains` CRUD operations with atomic write semantics, plus summaries for index hydration. 【F:packages/notebook-data/src/store.ts†L1-L120】【F:packages/notebook-data/src/fs.ts†L1-L70】
- ✅ Implemented an index manager that rebuilds `index.json`, tracks file signatures for caching, computes backlinks, and stamps a checksum for integrity verification. 【F:packages/notebook-data/src/indexManager.ts†L1-L161】
- ✅ Delivered snippet hashing, Git commit anchoring, and conflict detection helpers used by higher-level workflows. 【F:packages/notebook-data/src/hash.ts†L1-L4】【F:packages/notebook-data/src/conflicts.ts†L1-L33】
- ✅ Documented the data layer in the README and expanded examples to cover every supported node kind. 【F:README.md†L11-L55】【F:.breadcrumbs/examples/all-node-kinds.crumbnb†L1-L39】
- ✅ Updated workspace packaging to depend on the published core version range so CI environments without `workspace:` protocol support can install successfully. 【F:packages/notebook-data/package.json†L1-L22】

## Follow-ups
- Wire the CLI and extension flows to the new `@breadcrumbs/notebook-data` APIs so user actions persist notes and chains through the shared layer.
- Design higher-level integration tests that exercise CLI commands against the filesystem-backed store and index manager.
- Provide developer docs illustrating how to seed repositories with starter notes and chains alongside the new APIs.

## Required Tests
- `npm run test -- --runInBand packages/notebook-data`
- `npm run lint packages/notebook-data`
- Add integration-style tests covering round-trip note creation, update, and index refresh.
- _Status_: ✅ Added dedicated Vitest suites for note parsing, store CRUD, and index refresh caching.

## Required Examples
- Extend `.breadcrumbs/examples/` with at least one additional note and chain file exercising all supported `kind` values.
- _Status_: ✅ Added `all-node-kinds` sample covering observation, analysis, decision, task, and reference nodes alongside the updated triage example.
