# 野火动态歌词模式（dazibao / Wildfire）

## Goal

新增专用歌词走位「野火」：浓烈红 + 书法笔锋，剪映式单行英雄砸脸；其它走位保持克制。

模式内部 id 仍为 `dazibao`（兼容已有配置），用户可见名称为「野火 / Wildfire」。

## Locked decisions

| Item | Choice |
|------|--------|
| Delivery | Dedicated visualizer mode `dazibao` |
| Display name | 野火 / Wildfire |
| Style | Layout punch only; colors/fonts/effects from independent layers |
| Signature ink | Removed as forced defaults; `yehuoInk` kept as optional helper |
| Layout | Single centered hero line only |
| Word policy | Reuse `lyricWordMode` |
| Tuning | No mode-specific store; use global intensity/scale; font prefers 野火笔锋 |

## Behavior

1. Only the active line is on stage (no upcoming/previous rail).
2. Line enter: scale `0.72 → 1` with overshoot.
3. Per-word punch: on timing, scale `1.4 → 1` + dual-layer echo/face + stroke + intense glow.
4. Waiting words: hidden in `default`, dim readable in `karaoke`.
5. Chorus (`line.isChorus`): hotter red + extra scale.
6. Translation under the hero line, small white/hint opacity.
7. Motion via Framer Motion / CSS; no per-frame React time state.

## Integration

- Registry: `src/components/visualizer/dazibao/entry.tsx` (auto-discovered)
- Ink: `src/components/visualizer/dazibao/yehuoInk.ts`
- Labels: `ui.visualizerDazibao` → 野火 / Wildfire
- Command palette: switch to `dazibao` (keywords: 野火, yehuo, wildfire, 大字报 alias)
- Shared settings: `visualEffectIntensity`, `lyricsFontScale`; color preset `dazibao-red` labeled 野火红

## Non-goals (v1)

- Multi-template packs (neon / glitch / cinematic switcher)
- Beat particles / WebGL text
- Backporting punch effects into classic / monet
