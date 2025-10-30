# Task 2: Implement Notebook Data Layer

## Objective
Provide the core libraries for managing breadcrumb notes, chains, and the index on disk with transactional guarantees.

## Scope
- Implement shared TypeScript modules for note schema validation (using Zod or similar), YAML frontmatter parsing, and Markdown serialization with docstrings.
- Create file system services to create/update/delete notes under `.breadcrumbs/`, ensuring filename stability and atomic writes.
- Build the `index.json` management layer with backlink computation, caching, and integrity checks.
- Implement utilities for snippet hashing, Git commit anchoring, and conflict detection primitives.
- Update README developer docs to describe the data model and APIs.

## Required Tests
- `npm run test -- --runInBand packages/notebook-data`
- `npm run lint packages/notebook-data`
- Add integration-style tests covering round-trip note creation, update, and index refresh.

## Required Examples
- Extend `.breadcrumbs/examples/` with at least one additional note and chain file exercising all supported `kind` values.
