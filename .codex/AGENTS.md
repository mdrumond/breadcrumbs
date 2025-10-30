# Contributor Guidelines for .codex

## Plan Maintenance
- Every pull request that introduces changes to this repository **must** update the appropriate files in `.codex/plan/` to reflect what has been implemented and what remains outstanding.
- When updating a plan file, be explicit about completion status, follow-up tasks, and any assumptions that influenced the implementation.

## Code Quality Expectations
- Prefer clear, maintainable solutions over clever but opaque implementations.
- Document decisions that have project-wide impact directly in the plan or accompanying documentation.
- Ensure added or modified code paths include automated tests whenever practical and provide usage examples when applicable.
- Keep the codebase consistent with existing style conventions and run relevant linters or formatters before submitting a PR.
