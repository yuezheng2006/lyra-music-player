# Folia 远端增量对照（2026-09-19）

- Date: 2026-09-19
- Source: `chthollyphile/folia-major` `origin/main` **`52081f79`**（仍是 **v0.7.7**，相对 2026-09-13 文档无新合并）
- 本批价值在 **未合入的 open PR**，不是新 tag

## 结论表

| 优先级 | 能力 | Folia | Lyra | 建议 |
|---|---|---|---|---|
| P0 | 播放页控制栏隐藏时藏指针 | #378 | **本批已移植** | 完成。CSS 保持 unlayered；只罩歌词舞台，不罩 dock/弹窗 |
| P0 | macOS 红绿灯进原生全屏 | #389 | **本批已移植** | 完成。Win/Linux 仍最大化 |
| P0 | 歌词匹配「跟随当前平台」 | #389 `auto` | **本批已移植** | 完成。缺 key 默认 `auto`；显式 netease/qq/kugou/amll 保留 |
| P1 | 欢迎弹窗嵌套滚动 | #387 | 未做 | 可选下一刀；Lyra 引导结构不同，勿整页抄 |
| P2 | 酷狗取消收藏 / 心形状态 | #383 | 未做 | 确认 Lyra kugou 收藏路径后再 cherry |
| P2 | 自定义 OpenAI 兼容接口 | #374 | 未做 | 有自建 AI 端点时再看 |
| — | 壁纸多显示器 | #388 | — | **不做** |
| — | collection open morph | #386 | — | **不做**（体量大、非四条硬筛优先） |
| — | Apple Music / Spotify | #357 / #175 | — | **不做** |
| — | 酷狗 playInfo | 已合入 v0.7.7 | 适配器已回落到 `playInfo` | 无需再搬 |
| — | 降低动态效果 | 已合入 v0.7.7 | 09-13 已移植 | 不进外观导入 |

## 本批落地

- `autoHideCursorWithPlayerChrome`（默认开）+ 命令面板 + 外观短码 `ahc`
- Mac 绿灯 `toggleFullscreenWindow`；全屏态走 `onWindowFullscreenChanged`
- `LyricMatchPriority` 含 `auto`；`resolveLyricMatchPreferredSourceForSong` 接到在线/本地/Navidrome 匹配调用

## 建议下一刀

1. #387 欢迎弹窗滚动（对照 Lyra `UserGuideModal` 再决定）
2. Mineradio 账号 stale
3. #374 OpenAI 兼容（仅当自建端点会踩）
