---
name: add-or-update-feature-with-documentation-and-tests
description: Workflow command scaffold for add-or-update-feature-with-documentation-and-tests in lyra-music-player.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-feature-with-documentation-and-tests

Use this workflow when working on **add-or-update-feature-with-documentation-and-tests** in `lyra-music-player`.

## Goal

Implements or updates a feature and documents it with ADRs, technical docs, and README files, along with unit/UI tests.

## Common Files

- `docs/adr/*`
- `docs/technical.md`
- `src/components/*/README.md`
- `src/services/*/README.md`
- `src/components/*`
- `src/services/*`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update ADRs in docs/adr/
- Update or add technical documentation in docs/ or docs/technical.md
- Add or update README files in relevant component/service directories
- Implement or update feature in src/components/, src/services/, etc.
- Write or update unit and UI tests in test/unit/ and test/ui/

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.