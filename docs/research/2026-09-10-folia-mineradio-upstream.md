# 参考仓更新对照：Folia v0.7.4–0.7.6 / Mineradio v2.2.0

- Date: 2026-09-10
- Method: `git fetch` 本地 `.temp/folia-major`、`.temp/Mineradio`；对照 `origin/main` 与 Lyra 当前工作树。Zread MCP 不可用，未用远程 wiki。
- Product policy: 对标 Folia 为主、Mineradio 为辅。借能力、性能优先。不整包 Tempera/Pixi/Sonnet、automix/stem/onnx、Forge、Windows / Linux 壁纸、Wallpaper Engine / Full Desktop、kgcheckin VIP。
- 上次 Folia 基线：`08fc072f`（2026-09-06）— `docs/research/2026-09-06-folia-v0.7.3-upstream.md`
- 上次 Mineradio 基线：`89c0d23` / v2.1.0（2026-08-24）— `docs/research/2026-08-24-kumone-mineradio-folia-borrow.md`（**该文 Mineradio「无增量」已过时**）

## Snapshot

| 仓 | 本地 HEAD（fetch 前） | origin/main | 相对上次 |
|---|---|---|---|
| [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) | `08fc072f`（v0.7.3-12） | **`2f665907`**（2026-09-09）**v0.7.6** | **65 commits**；标签 v0.7.4 / v0.7.5 / v0.7.6；321 files，+20359 / −1412（含 lattice / 转码 / 代码地图噪声） |
| [XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio) | `89c0d23`（v2.1.0 + README） | **`328a087`** **v2.2.0** | **2 commits / 118 files / +12616 −1238**，这次是产品增量 |
| Lyra | `feat/lyric-clock-sync-offset-persistence` @ `3d48062` 及后续工作树 | — | 09-06 后已落地：staff 歌词过滤、全局 Cmd+K、fuzzy+frequency、sleep `--` hints、visualizer 内置 id、AddToPlaylistHost、网易云 API 重启、awlrc（本地文件）、displaySleep、global offset、queue DSL、汽水 QR、Gain fade、方向键音量 |

忽略 Folia `chore(dev): 同步代码地图`。Lattice 整包、转码 ffmpeg 运行时、Tempera 纹理二次幂不进建议吸收。

---

## 结论（先看这张表）

| 优先级 | 借谁 | 能力 | 对 Lyra | 方式 |
|---|---|---|---|---|
| P0 | Folia `e1f7e616` | 嵌入歌词路径也拆 `[awlrc:]` | `LocalFileLyricAdapter` 已做；`EmbeddedLyricAdapter` 仍直接 `detectTimedLyricFormat` | 适配移植（十几行） |
| P0 | Mineradio 2.2.0 | 账号「待同步 / 会话失效 / unknown 会员」 | 统一账号面板已有，缺统一 stale 徽章语义 | 只学状态机与文案，不搬 `*-api.js` |
| P1 | Folia | 设置分组侧栏 + 默认展开 | `SettingsModal` 仍是卡片网格（~1950 行，须先拆） | 适配移植，勿整盖 |
| P1 | Folia `47765b2a` | 非翻译歌词模糊开关 | 仅有运动模糊 `lyricMotionClarity` | 适配移植 + 外观导入导出 |
| P1 | Folia | 网格样式 / 命令面板网格操作 | 有 `GridView`，无独立外观设置、无 grid 命令 | 适配移植 |
| P1 | Folia | 本地文件夹自动扫描 + 子目录 ignore | 无 `localLibraryAutoScan` | 实验室默认关 |
| P1 | Folia `466dbe05` | 崩溃报告落盘 | 仅 GPU crash escalation | cherry-pick Electron main |
| P1 | Folia `27356850` | 网易云听歌历史上报 | 仅 Navidrome scrobble | 适配移植，默认关 |
| P1 | Mineradio 2.2.0 | 四套粒子预设 + 歌词/封面避光 + viewport fit | 粒子只留 `emily` | opt-in，勿默认 1.55/ultra |
| P2 | Folia | 构建时拼音索引、非 auto-update 检查通道 | fuzzy 已有；updater 已有 unsupported 文案 | 后置 |
| — | Folia Lattice | 新默认播放入口 / 海报墙 | 与 Lyra dock/舞台合同不同 | **产品确认后** |
| — | Folia 转码 | Electron ffmpeg fallback | Lyra 无同路径 | **产品确认后** |
| — | Mineradio Cuefield / 摄像头手势 / WE | 重引擎与 Windows 壁纸 | 政策冲突 | **明确不做**（手势默认关，需确认才立项） |

09-06 文档里仍标「建议吸收」但 **Lyra 现已落地**、不要再开专题：本地歌词上传切 `lyricsSource=local`、网易云 API 重启、AddToPlaylistHost、fuzzy+frequency、sleep `--`、visualizer 内置 id、awlrc 本地文件、mediaSession 门闩、displaySleep、visualizerStill、globalLyricTimelineOffset、queue `--remove/--next/--end`、ImportConfirmDialog、汽水 Passport QR、GainNode fade、方向键音量。

---

## 1. Folia v0.7.4–0.7.6

### 1.1 P0：嵌入 awlrc（`e1f7e616`）

**上游** `src/utils/lyrics/adapters/EmbeddedLyricAdapter.ts`：LX 把逐字轨写在 `[awlrc:...]` 里，正文重复 LRC 只是回退视图；先 `extractAwlrcContainer` 再 parse。

**Lyra** `LocalFileLyricAdapter.ts` 已同样处理。`EmbeddedLyricAdapter.ts` 在 `mainLrc` 上直接 `detectTimedLyricFormat`，嵌入 USLT/文本会把两套时间轴揉成一条。

**结论：本轮建议吸收。** 复用已有 `awlrcContainer.ts`，不要重写 parser。

### 1.2 P1：设置分组侧栏（旧缺口 + `bc7a2d94`）

**上游** `settingsNavModel.ts`、`SettingsSidebarWide.tsx`、`useSettingsScrollSpy.ts`；`bc7a2d94` 默认展开导航。

**Lyra** `SettingsModal.tsx` 仍是选项卡卡片网格 → `SettingsSubviewShell` overlay。文件已超 800 行硬上限，**必须先拆再改**。交互控制分区继续占位（快捷键策略未定）。

### 1.3 P1：非翻译歌词模糊（`47765b2a`）

**上游** `subtitleUpcomingLyricsBlur` → `VisualizerSubtitleOverlay` + appearance codec。

**Lyra** 有 `lyricMotionClarity`（运动模糊），没有「即将到来的非翻译行是否模糊」开关。视觉设置，须进导入导出。

### 1.4 P1：网格样式 + 命令面板网格（`23f9f137` / `8e8320ad` / `458d28db`）

**上游** `GridViewSettingsSection.tsx`、`useGridViewSettingsStore`、`gridCommands.ts`、settings 锚点命令。`5c7b28da`：filter 命令播完关掉 inline 网格——只在做 filter-view 时带上。

**Lyra** `GridView.tsx` 已有页内筛选，无独立网格外观、无 palette surface。

### 1.5 P1：本地库 watch / ignore（`48a58480` / `cea9e9cc`）

**上游** `localLibraryAutoScan.ts`、`LocalLibraryWatchSection.tsx`、`localLibraryFolderIgnore.ts`。

**Lyra** 本地库已有，无自动扫描、无「删子目录标 ignore 可在树里恢复」。建议实验室默认关。

### 1.6 P1：崩溃报告（`466dbe05`）+ 网易云 listen report（`27356850`）

- 崩溃：Folia `electron/debug/crashLog.cjs` 同步写 userData logs。Lyra 只有 GPU crash escalation。
- 听歌历史：Folia `useNeteaseScrobbleReporter.ts` + `playbackListenTracker.ts`。Lyra 仅 Navidrome scrobble。默认关，勿整包 omni。

### 1.7 P2 / 产品确认后 / 明确不做

| 项 | 结论 |
|---|---|
| Monet 藏音频条 `90a30fba` | 小开关，可顺手；非阻塞 |
| Monet 副标题行距 `57d3f806` | 对照 Lyra Monet 裁切再摘 |
| 拼音构建插件 | fuzzy 已有，后置 |
| 非 auto-update 仍可检查 `a6a1fc31` | 对照 Lyra updater |
| Windows 卸载清用户数据 `ae5ce62b` | 仅 Windows 安装器 |
| **Lattice 整包**（#345 + `2c1ae098`） | 新默认播放入口；产品确认后 |
| **Electron 转码**（`c0235fab` 系 / `62293673`） | 能播更多本地格式，引入 ffmpeg 生命周期；产品确认后 |
| QQ CDN 临时补丁 `2f665907` | Folia 打 `@yakult-green-tea/qq-music-api`；Lyra 走 sidecar，对照限速即可，**不要** vendor 该包 |
| Tempera/Sonnet 纹理二次幂 `1220c0eb` | 明确不做 |
| ffmpeg 与 mod 导出拆分 `1cc005c5` | 无 Forge，跳过 |
| 壁纸 / god-store / 代码地图 | 明确不做 |

---

## 2. Mineradio v2.2.0

CHANGELOG：登录/账号识别/播放稳定性；歌单分页与网络恢复；新粒子预设与更多手势。代码上还有 Cuefield、摄像头手势、WE 生命周期——后三者按政策不进主线。

### 2.1 P0：账号会话气质（不搬 API）

**上游** `08-account/01-login-modal-utils.js`（`providerMembershipNeedsSync`、「待同步」）、`qishui-api.js`（`reauthRequired`、`vipLevel:'unknown'`）、`tests/provider-login-state-recovery.test.js`、`tests/qishui-session-recovery.test.js`。

**Lyra** `UnifiedMusicAccountsPanel` + 各 AccountCard；QQ 有 `qqMusicPlaybackLimited`；汽水 QR 已在 `electron/qishuiAuthLogin.cjs`。缺的是酷狗/汽水 **stale / 待同步 / unknown 会员** 统一徽章。

**结论：学状态机和文案，接到 sidecar 错误码。** 勿整包 `qishui-api.js` / `kugou-api.js`。

### 2.2 P1：舞台（Mineradio 主责）

| 项 | 上游 | Lyra | 动作 |
|---|---|---|---|
| 四套封面粒子预设 | `02-visual/00-pointer-cover-particles.js`；`MAX_VISUAL_PRESET_INDEX=12` | `mineradioVisualPresets.ts` 只保留 `emily`，旧 id 归一 | opt-in 预设，勿默认高分档 |
| 歌词 live viewport fit | `12-lyrics-row-layers.js` | 有 `resolveLyricContainerFit`，缺投影后实时缩放独立开关 | 沉浸/几何歌词路径适配 |
| 亮底避光 backdropAdapt | 歌词层 + 粒子 `uBackdropAdapt` | 粒子有 `readableRim`，无独立强度开关 | 适配移植 |
| 酷狗取播限制分类 | `kugou-api.js` vip/login_required + 超时 | sidecar 无同套分类文案 | 只学分类 |

### 2.3 旧缺口复核（相对 2026-08-24）

| 当时写的缺口 | 现况 |
|---|---|
| 汽水 Passport QR → sidecar | **已有**：`electron/qishuiAuthLogin.cjs` + `useQishuiLogin.ts` |
| GainNode play/pause fade | **已有**：`audioPlayPauseFadeMath.ts` |
| 方向键音量 ±5% | **已有**：`KEYBOARD_VOLUME_STEP` + `usePlaybackInteractionBridge` |
| entitlement 文案 | 部分有；v2.2.0 的 stale/unknown 仍缺 → 上面 P0 |
| `performanceBackground` keep | **仍勿默认 keep** |

### 2.4 明确不做

Wallpaper Engine / Full Desktop、Cuefield AutoMix 整包、Spotify、摄像头 MediaPipe 播控默认开、登录彩蛋门禁、kgcheckin、整包替换 `server.js`。

---

## 建议下一刀

1. Folia：**嵌入 awlrc**（正确性，体积小）
2. Mineradio：**账号 stale / 待同步 / 重新登录文案**（账号面板气质）
3. Folia：**非翻译歌词模糊开关** 或 **崩溃报告落盘**（二选一先做可见设置 / 桌面可靠）
4. 设置分组侧栏：先拆 `SettingsModal.tsx`，再移植导航模型
5. Lattice / 转码 / 分词 AI / 底栏槽位 / 摄像头手势 — 产品拍板后再立项
