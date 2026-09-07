# musicDownload 参考调研

- Date: 2026-08-16
- Scope: [MrsEWE44/musicDownload](https://github.com/MrsEWE44/musicDownload) 能力对照、可借鉴 UX、对 Lyra 的落地边界
- Method: 公开 README / 依赖声明 + 对照 happy-player 现有下载与搜索路径

## Executive summary

musicDownload 是基于 [musicdl](https://github.com/CharlesPikachu/musicdl) 的独立 PyQt 下载器，卖点是多平台搜索、批量/歌单下载、无损。对 Lyra 有吸引力的是 **「搜索 → 勾选 → 批量保存」** 这条交互，而不是其扒站实现。

**Lyra 立场：** 桌面端可保存当前会话已可播放的音频到本机下载目录；**不**集成 musicDownload / musicdl，**不**宣传无损破解或绕过会员。

## Upstream snapshot

| 项 | musicDownload |
|----|---------------|
| 形态 | 独立桌面 GUI（PyQt5 / PySide6） |
| 依赖 | `requests`, `musicdl`, PyQt |
| 平台 | 酷狗、酷我、QQ、网易云、咪咕等（README 宣称） |
| 能力 | 搜索、单曲、批量、歌单一键、宣称支持无损 |
| 发行 | Python 3.13 + venv；`make_release.bat` / `.sh` 打包 |

## UX 可借鉴点

1. **搜索即下载入口**：结果列表上直接下载，不必先播放。
2. **勾选 + 批量**：一次保存多首。
3. **歌单级动作**：整单入队（Lyra 本轮先做搜索批量；歌单入口可后续迭代）。
4. **按源分目录 / 可读文件名**：与 Lyra 已有 `{provider}/{歌手 - 歌名}.ext` 一致。

## 与 Lyra 对照

| 能力 | musicDownload | Lyra（落地后） |
|------|---------------|----------------|
| 多源搜索 | 独立搜索页 | 已有聚合搜索 + provider pills |
| 单曲保存到磁盘 | 有 | Electron：`songDownloadService` |
| 搜索结果下载 | 有 | 搜索 overlay 单曲 / 已选 / 全部可下 |
| 批量队列 | 有 | 串行队列（并发 1） |
| 无损/会员绕过 | 宣称 | **不做** |
| 第三方扒站库 | musicdl | **不引入** |
| YTM / Navidrome 下载 | N/A | 本轮仍排除 |

## 对 happy-player 的建议（已采纳）

1. 产品文案承认桌面端「保存已可播音频」，与播放后媒体缓存区分。
2. 增强搜索面下载与简易队列，复用 `getAudioUrl` + Electron IPC。
3. 若用户已把默认下载根（`Lyra`）导入本地库，下载后可选自动 `resyncFolder`。
4. 明确拒绝：musicdl 集成、未授权音源下载、Web 端下载、独立下载管理页（本轮）。

## Sources

- https://github.com/MrsEWE44/musicDownload
- https://github.com/CharlesPikachu/musicdl
- happy-player: `src/services/songDownloadService.ts`, `src/utils/ui/downloadDirectoryMath.ts`, `docs/product-capability-summary.md`
