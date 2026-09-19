# 参考仓更新对照：Kumone / Mineradio / Folia Major

- Date: 2026-08-24
- Scope: 拉取最新参考代码后，对照 Lyra 1.0.4 可借鉴能力（UX / 架构），不含整包移植清单
- Method: 本地 `.temp` clone + 源码/CHANGELOG/既有 borrow 文档交叉核查
- Product policy: Folia 能力尽量参考，冲突时性能优先；Mineradio 只吸收舞台/稳定性优点；Kumone 只学官方客户端产品面，不引入灰色解锁与客户端协议加密

## Snapshot

| 仓 | 本地路径 | HEAD | 版本 | 相对上次 borrow |
|---|---|---|---|---|
| [missuo/kumone](https://github.com/missuo/kumone) | `.temp/kumone`（新 clone） | `a59b348`（2026-08-23） | **0.2.5** | 首次入库 |
| [XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio) | `.temp/Mineradio` | `89c0d23` | **v2.1.0** + README | 相对 `96091d1` **无产品增量** |
| [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) | `.temp/folia-major` | `29882de8` | **v0.6.22+19** | 相对 `cc4c57c9` **90 commits / 327 files** |

许可：Kumone **LGPL-3.0-only**（只学交互，勿拷 Swift）；Mineradio **GPL-3.0**（需 NOTICE）；Folia / Lyra 均为 **AGPL-3.0**。

---

## 结论（先看这张表）

| 优先级 | 借谁 | 能力 | 对 Lyra 的意义 | 方式 |
|---|---|---|---|---|
| P0 | Folia | `awlrc` 容器解析 | 洛雪/LX 导出歌词本地打开即对齐 | 适配移植 |
| P0 | Folia | Media Session 切歌时序门闩 | 修 SMTC/MPRIS 切歌被清空 | 适配移植 |
| P0 | Folia（基线仍缺） | 播放时 `powerSaveBlocker` | 桌面端长时间听歌不熄屏 | cherry-pick |
| P1 | Folia | `visualizerStill` 低功耗静态歌词 | 与性能档/GPU 降级同向 | 适配移植 |
| P1 | Folia | 设备级全局歌词 offset | 与 ADR-0006 单曲 offset 叠加 | 适配移植 |
| P1 | Kumone | 网易官方登录 UX（QR 续上 + SMS） | sidecar 已有 QR，缺容错与短信 | 只学 UX |
| P1 | Kumone | 首页 Feature Cards：漫游 / 心动 / 雷达 | 补 NetEase 发现面，不替代多源 Daily Mix | 只学 IA |
| P2 | Folia | 命令面板队列 DSL / 音量 / 记忆排序 | 已有 palette，缺批量语法 | 适配移植 |
| P2 | Kumone | 桌面歌词比例定位 + 中线磁吸 | 多屏/分辨率变化比绝对 bounds 稳 | 只学架构 |
| P2 | Kumone | Media Session like / seek + 高清锁屏图 | 控制中心补全 | 只学架构 |
| — | Mineradio | — | 本轮无新代码可借；既有缺口仍有效 | 维持旧文档 |

---

## 1. Folia Major（主增量）

基线文档：`docs/folia-major-borrow-analysis.md`（上次 `cc4c57c9` / v0.6.18+14）。

### 1.1 建议吸收

1. **awlrc** — `src/utils/lyrics/awlrcContainer.ts` + `parserCore.ts` + `LocalFileLyricAdapter.ts`。LX `[awlrc:lrc:B64,...]` 容器优先；Lyra 仍走 `splitCombinedTimeline`。
2. **mediaSessionSync** — `src/utils/mediaSessionSync.ts`：先 `setPositionState`（duration 就绪）再写 metadata；过滤非 http(s)/data/blob 封面。Lyra `useMediaSessionBridge.ts` 无门闩。
3. **visualizerStill** — `src/components/visualizer/still/`：三行静态歌词、`renderBackground={false}`。适合 Lab / 低配档。
4. **globalLyricTimelineOffsetMs** — Lab 校准 Modal（1/10/50ms）。与 `lyricOffsetStore`（按歌）互补。
5. **命令面板** — `queueQuery.ts`：`--remove/--next/--end`、`@artist:` / `@album:`；音量数字命令；使用记忆排序。
6. **displaySleep** — 仍在基线、Lyra 仍缺：`electron/displaySleepBlocker.cjs`。

### 1.2 只学架构

- **Tempera**（Pixi 新模式，121 shot、自定义贴图 16 张、Linux 壁纸）：学 bridge shot / glyph settle，**不整包**。
- ThemePark 拆 draft/panel；封面随机 dual theme fallback。
- OBS 本地 browser source 参数补齐（Lyra 已有简化 publisher）。
- QQ/酷狗封面尺寸规范化（对照 sidecar，勿换 Folia onlineMusic）。
- 进度条邻曲预览 / `playbackNeighbors.ts`。

### 1.3 明确不做

Tempera/sonnet/diorama 整包、`pixi.js`、Linux windowtolayer 壁纸、docker 栈、均衡器+后处理效果链（默认）、用 Folia provider 替换 sidecar。

---

## 2. Mineradio（无增量）

`origin/main` 仅 `89c0d23 Update README.md`。产品代码仍停在 **v2.1.0**。

既有高价值未移植（见 `docs/mineradio-beat-auth-borrow-analysis.md`、memory `happy-player-mineradio-port-gaps.md`）不变：

- 汽水 Passport QR → sidecar cookie（合规评估后再做）
- 播放/暂停 GainNode fade、方向键音量
- 后台 `performanceBackground` 策略（勿默认 keep）
- entitlement 文案边界

Windows Wallpaper Engine / Full Desktop **继续不做**。

---

## 3. Kumone（首次对照）

原生 SwiftUI 网易云客户端。Lyra 是多源 + visualizer + sidecar；Kumone 是单源官方客户端范本。

### 3.1 建议借鉴（产品 / UX）

| 能力 | 源 | Lyra 落点 |
|---|---|---|
| QR 切 App 后续轮询 + 短信登录 | `Features/Pages/LoginSheet.swift` | 扩展 `useNeteaseQrLogin.ts` / `OnlineMusicGuestConnect.tsx`；SMS 走 sidecar 官方接口 |
| 首页：每日 / 漫游 / 心动 + 雷达货架 | `Features/Home/HomeView.swift` | `HomeDiscoveryRail.tsx` 增量，不拆掉多源 Daily Mix |
| Explore 分类歌单无限滚 | `Features/Explore/ExploreView.swift` | 新 surface 或 command palette，不抄 API 层 |
| FM 沉浸页 + trash | `Features/Pages/FMView.swift` | Lyra 已有 `isFmMode`，缺独立产品页 |
| 队列「正在播放 / 即将播放」 | `Features/Player/Panels.swift` | `QueueTab.tsx` |
| 桌面歌词 0–1 因子 + 中线磁吸 | `Features/Player/DesktopLyrics.swift` | `electron/desktopLyrics.cjs`（保留 cinema/beat） |
| Media Session 喜欢 / seek / 1024 封面 | `Core/Player/NowPlayingManager.swift` | `useMediaSessionBridge.ts` |
| 列表底部 player-bar 净空 | `PlayerClearanceSpacer` | 搜索/每日推荐列表最后一行被底栏挡住时对照 |

### 3.2 明确不做

- **灰色曲第三方解锁**（`UnblockService.swift` / UnblockNeteaseMusic 同源策略）
- **客户端 weapi/eapi 加解密克隆**（`NeteaseCrypto.swift`）；Lyra 继续 sidecar
- **Hi-Res / VIP 绕过**；仅可参考官方音质回落提示文案
- 直接拷贝 Swift 进 AGPL 仓

---

## 建议下一刀

1. Folia：**awlrc + mediaSessionSync**（零视觉、正确性）
2. Folia：**displaySleep** 或 **visualizerStill**（二选一先做桌面体验或低功耗档）
3. Kumone：**网易登录容错（visibility 续轮询）+ 首页雷达/心动卡片**（产品面，不碰协议）

全局 offset、队列 DSL、桌面歌词比例定位、Media Session like 作为随后一批。
