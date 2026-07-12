# Lyric Word Mode Implementation Plan

> **For agentic workers:** implement task-by-task; keep karaoke as a lyric policy, not a visualizer mode.

**Goal:** Persist `lyricWordMode` (`default` | `karaoke`), apply upcoming-lyric visibility across all visualizer layouts, replace the standalone karaoke visualizer with a lyrics-module toggle.

**Architecture:** settings store owns the policy; visualizers/overlays read it and gate upcoming lines only.

### Task 1: Store + types + i18n
- Add `LyricWordMode` type and store field/setter/persistence
- Wire appearance import/export + command palette
- Add en/zh strings

### Task 2: Runtime policy helper
- Add `shouldShowUpcomingLyrics(mode)` / upcoming count helper
- Unit test both modes

### Task 3: Wire visualizers + subtitle overlay
- Gate `VisualizerSubtitleOverlay` nextLines
- Gate Monet (and similar multi-line) `after` window

### Task 4: UI
- Controls + floating menu: default/karaoke toggle
- Remove karaoke from visualizer mode grids

### Task 5: Cleanup
- Delete `visualizer/karaoke/*`
- Remove `'karaoke'` from BuiltinVisualizerMode / registry / commands
- Fix tests

### Task 6: Verify
- `npm run lint` + focused unit tests
