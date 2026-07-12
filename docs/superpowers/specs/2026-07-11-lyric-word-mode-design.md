# Lyric Word Mode（默认逐字 / K歌逐字）

## Goal

把「是否预告后续歌词」从独立视觉器模式中拆出，作为歌词模块的二选一策略，并对所有歌词走位生效。

## Behavior

| Mode | Id | Behavior |
|------|----|----------|
| 默认逐字 | `default` | 只展示当前行已到点的逐字高亮；同行未到点的词、以及后续行都不显示 |
| K歌逐字 | `karaoke` | 当前行仍逐字高亮；同行未到点的词保持可读预告；同时预告后续若干行（可读、未高亮） |

动画走位（classic / cadenza / monet / …）保持独立，不因该选项切换而替换。

## Non-goals

- 不再保留 `visualizerMode: 'karaoke'` 独立舞台
- 不把 K歌做成莫奈皮肤或专用布局

## Storage / Settings

- Key: `lyric_word_mode`
- Values: `default` | `karaoke`
- Default: `default`
- Store: `useSettingsUiStore`
- Visual config import/export + command palette toggle

## UI

- Controls 面板、浮动菜单：在歌词相关区增加「逐字」两档
- 从歌词样式网格移除「K歌」动画项

## Runtime wiring

- `VisualizerSubtitleOverlay`：仅在 `karaoke` 时传入/渲染 upcoming lines
- 多行走位（如 Monet）：`after` 窗口仅在 `karaoke` 时 > 0；`default` 时 `after = 0`
- 单行走位（classic / partita / cadenza 等）：`waiting` 词在 `default` 时隐藏，在 `karaoke` 时以低透明度停在原位可读
