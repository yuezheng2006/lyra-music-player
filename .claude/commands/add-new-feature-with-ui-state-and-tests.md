---
name: add-new-feature-with-ui-state-and-tests
description: Workflow command scaffold for add-new-feature-with-ui-state-and-tests in lyra-music-player.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-new-feature-with-ui-state-and-tests

Use this workflow when working on **add-new-feature-with-ui-state-and-tests** in `lyra-music-player`.

## Goal

Implements a new user-facing feature, including UI components, supporting hooks, state stores, types, and unit tests.

## Common Files

- `src/components/*`
- `src/hooks/*`
- `src/stores/*`
- `src/types/*`
- `src/types.ts`
- `src/services/*`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update UI components in src/components/
- Add or update supporting hooks in src/hooks/
- Add or update state stores in src/stores/
- Add or update types in src/types/ or src/types.ts
- Update or add service logic in src/services/ or scripts/

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.