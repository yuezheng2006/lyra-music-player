# Lyric Effect Packs Implementation Plan

> **For agentic workers:** Execute task-by-task. User asked for fast execution + visual verification.

**Goal:** Ship `lyricEffectPackId` packs (`none|yehuo|neon|glitch`), unbind 野火 layout from forced ink/font/echo, wire packs on `dazibao` first.

**Spec:** `docs/superpowers/specs/2026-07-12-lyric-effect-packs-design.md`

## Tasks

1. Pack module + unit tests (`src/utils/lyricEffectPacks.ts`)
2. Store + i18n + command palette + appearance import/export
3. Unbind dazibao forced YEHUO; apply pack-driven echo/neon/glitch
4. UI selector in floating menu / controls
5. Verify unit tests + typecheck
