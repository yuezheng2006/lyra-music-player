---
name: add-or-integrate-music-provider
description: Workflow command scaffold for add-or-integrate-music-provider in lyra-music-player.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-integrate-music-provider

Use this workflow when working on **add-or-integrate-music-provider** in `lyra-music-player`.

## Goal

Integrates a new music provider, including adapter scripts, service registration, UI badges, and search/playlist logic.

## Common Files

- `scripts/music-provider-adapters/*`
- `src/services/musicProviders/*`
- `src/assets/providers/*`
- `src/components/*`
- `src/hooks/*`
- `src/stores/*`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update provider adapter scripts in scripts/music-provider-adapters/
- Update provider registry and client in src/services/musicProviders/
- Add provider icons/assets in src/assets/providers/
- Update UI components to show provider badges and filters in src/components/
- Update hooks and stores for provider data in src/hooks/ and src/stores/

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.