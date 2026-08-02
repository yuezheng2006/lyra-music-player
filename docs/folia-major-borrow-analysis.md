# Folia Major → Lyra 可迁移分析

> 日期：2026-08-01（增量核查；原稿 2026-07-28）  
> 参考仓：`.temp/folia-major` @ `002b581` / **v0.6.8**（已 `git pull --ff-only`）  
> 产品仓：happy-player / Lyra @ `adcb9c7` / **1.0.4**  
> 许可：两边均为 **AGPL-3.0**，可在保持 AGPL 的前提下直接 cherry-pick / 适配移植

## 1. 关系与版本差

Lyra 是 **folia-major fork + Mineradio 合成**。歌词管线、Visualizer registry、RAF/MotionValue 桥、`frameRateLimiter`、lyrics worker、`renderHints` / `graphemeTiming`、`frontend-runtime-guardrails` skill **高度同源**。

| 项 | Folia (参考) | Lyra |
|---|---|---|
| 包名 / 版本 | `folia-major` **0.6.8** | `lyra-music-player` 1.0.4 |
| 本地参考 HEAD | `002b581`（相对 borrow 旧基线 `3d975a2` / v0.6.5 领先 **35 commits** / ~91 files） | `adcb9c7` |
| 注册歌词模式 | classic, cadenza, partita, fume, tilt, claddagh, monet, cappella, **diorama**, **pendolo** | classic, cadenza, partita, fume, tilt, claddagh, monet, cappella, **pendolo**（**dazibao 有代码未注册**）；**和声字幕已落地** |
| 产品定位 | 全屏歌词 PV + 网易云/多源在线 | Mineradio 舞台质感 + Folia 歌词设置分层 |

产品决策（既有）：**只吸收优点；冲突时保留 Lyra 已校准默认与性能策略**。

---

## 1.1 v0.6.6–0.6.8 增量（相对 v0.6.5）

相对 `3d975a2` → `002b581`。Release 要点：酷狗 Electron http 播放修复、cappella 安全区、Navidrome「最近加入/最近播放」、和声/底部字幕背景样式、docker stack。

### 建议吸收（已移植面的 polish / 同源 bugfix）

| 项 | 上游 | 方式 | Lyra 对照 |
|---|---|---|---|
| **和声字幕背景 → 光晕** + iOS Safari 合成隔离 | `037dd87`、`3a36230`；`VisualizerHarmonyOverlay.tsx` 独立 `blur-2xl` radial glow | **已落地（2026-08-01）** | 实心底改为独立光晕层 |
| **底部字幕背景 → 遮罩渐隐** | `0b98951`；`VisualizerSubtitleOverlay.tsx` | **已落地（2026-08-01）** | 翻译/预告行均用 soft glow |
| **默认开启两种字幕背景** | `581b7a0`；`useSettingsUiStore` | **产品确认后** | Lyra 默认仍关；勿盲目跟上游默认 |
| **cappella 按动态行高算下方安全区** | `ed7b297`；`VisualizerCappella.tsx` | **已落地（2026-08-01）** | `getEstimatedMessageHeight` 走 `measureBubbleText` |
| **Grid3DSlider 键盘/滚轮竞态** | `be31d82`：`stopWheelSmoothing()` 清滚轮 RAF | **已落地（2026-08-01）** | Lyra 无 discrete wheel smoothing；等价为 `stopKineticScroll`（清 momentum + wheelIdle） |
| **设置面板独立明暗切换** | `8bbf98a`；`SettingsModal.tsx` | **适配移植**（P2） | SettingsModal 未见等价；本轮未做 |

### 只学架构 / 对照 sidecar（勿整包）

| 项 | 说明 |
|---|---|
| 酷狗 `kg-youth` 502 / 手动匹配 kg 来源 / Electron **保留 kg media URL http**（`4a89183`） | 对照 `scripts/music-provider-adapters/kugou-provider-adapter.mjs` 与 Electron 媒体加载；Web 仍可 HTTPS 升级 |
| 登录失效清空缓存（`b88778f`） | 对照 Lyra 在线账号 store 失效路径 |
| QQ lyric provider 字段小修 | 若歌词 resolve 走同源逻辑可对照 |

### 本增量明确不做 / 低优先级

| 项 | 原因 |
|---|---|
| `deploy/docker/*` 整栈 | Folia 自托管部署；Lyra 走 sidecar / Electron，运维模型不同 |
| Navidrome「最近加入/最近播放」 | 仅在 Lyra 已接 Navidrome 时有价值；当前非主线 |
| contributors / README / release 渠道 | 文档噪声 |

### 建议的下一刀（增量后）

1. ~~和声光晕 + 底部字幕渐隐 + Grid3DSlider 竞态 + cappella 安全区~~ **已落地**  
2. 设置面板明暗（体验增量）  
3. sidecar 对照酷狗 http / 登录缓存清理（另立小修）  
4. OBS PlayerCap / diorama 等原 P0–P1 队列

---

## 2. 迁移方式图例

每个候选标一种：

| 标签 | 含义 |
|---|---|
| **直接 cherry-pick** | 路径/契约接近，改少量 import/store 即可合入 |
| **适配移植** | 可搬文件，但要接 Lyra registry / settings / 性能护栏 |
| **只学架构** | 学模式，勿整包粘贴（或 Lyra 已有等价物） |
| **不做** | 与定位冲突、运维过重、或会回退性能默认 |

---

## 3. P0 — 高价值（历史；多项已落地）

### 3.1 pendolo（时计）歌词模式 — **已落地（适配移植）**

| | |
|---|---|
| **上游** | `src/components/visualizer/pendolo/*` + `test/unit/visualizer/pendolo*.test.ts` |
| **Lyra** | `src/components/visualizer/pendolo/*` 已注册 |
| **残留** | 继续对照上游 seek / 手动滚动 / 切歌清空时间修复，反哺其他 canvas 模式 |

### 3.2 和声字幕层 — **已落地（适配移植）**

| | |
|---|---|
| **上游** | `VisualizerHarmonyOverlay.tsx`、`harmonyRuntime.ts`、`alternateText.ts`、`subtitleContentMode` |
| **Lyra** | 舞台已渲染；见 §1.1 光晕 / 默认背景 polish |
| **残留** | 背景样式与 iOS Safari 合成隔离（§1.1） |

### 3.3 OBS / 推流增强（PlayerCap + AI theme） — **适配移植**（仍待做）

| | |
|---|---|
| **上游** | `ObsPlayerCapSourceApp.tsx`、`ObsWebSourceApp.tsx`、`ObsNowPlayingSourceApp.tsx`、`usePlayerCapSource`、`useObsAiTheme`、`utils/playerCap*.ts`、`ObsCopyUrlButton` |
| **Lyra** | 仅 `ObsBrowserSourceApp` + 静态三行 `ObsBrowserSourceLyrics.tsx`；publisher 时钟隔离已有 |
| **价值** | 接外部播放器（PlayerCap）、OBS URL 主题模式、按歌 AI 主题 overlay |
| **接入点** | `bootstrap.tsx` 路由、`electron` OBS 端点、Integration 设置 |
| **性能注意** | **勿削弱** Lyra `mediaClockIsolation` / publisher 的 clock 真源；AI 主题生成放离线/节流，勿绑主 RAF |

---

## 4. P1 — 体验与完整度

| 项 | 方式 | 说明 |
|---|---|---|
| **diorama 完整模式** | 适配移植 | 上游 `visualizer/diorama/*`（R3F + 粒子走廊）。Lyra 仅有 `coverParticleBandTrackerMath`（注释写 ported from diorama）。须服从 `shouldEnableInteractive3dWebGlLyrics() === false`，避免 DOM/WebGL 双轨幽灵字；粒子默认勿覆盖 Mineradio quality tier |
| **`localLyricsPriority`** | 直接 cherry-pick | 上游设置：本地曲「本地歌词优先 / 在线优先」（`local_lyrics_priority`）。Lyra 有 `preferredAlternativeLyricSource`，缺此开关；改动集中在 `useSettingsUiStore` + `useLibraryPlaybackController` + PlaybackSettings |
| **VisPlayground 预览暂停** | 直接 cherry-pick | `useVisPlaygroundPreviewPlayback.ts`；小而有用 |
| **命令面板 2.0** | 适配移植 | 上游：`PinnedCommandRow`、`pinnedCommandPreferences`、`CommandPaletteQueueList/Row`、外观里 3 槽固定命令。Lyra 已有队列搜索雏形（`commandRegistry`），缺 pin 槽与独立 Queue UI |
| **注册 dazibao** | 只学架构 / 自研债 | 代码在 `src/components/visualizer/dazibao/`，`hasVisualizerMode('dazibao') === false`。不依赖上游，属于 Lyra 自己的歌词 PV 补齐 |
| **和声/字幕背景 polish** | 适配移植 | 见 §1.1；优先于新模式 |
| **Grid3DSlider 滚轮竞态** | 直接 cherry-pick | 见 §1.1 |

---

## 5. P2 — 可借鉴但非紧急

| 项 | 方式 | 备注 |
|---|---|---|
| 多平台登录首页 / Omni provider | 只学架构 | 上游 `services/onlineMusic/*`；Lyra 已走 sidecar（QQ/汽水/酷狗等），勿整包替换 |
| 酷狗账号 / VIP / KRM | 只学架构 | 对照 sidecar 能力缺口即可；有 skill `kugou-provider-alignment`；含 v0.6.8 Electron http 保留 |
| Navidrome 0.63+ structured lyrics | 适配移植 | `navidromeStructuredLyrics.ts` |
| Navidrome 最近加入/最近播放子页 | 适配移植（低优先级） | v0.6.8 `useNavidromeGridLibrary.ts`；仅 Navidrome 主线时做 |
| 隐藏歌单 / 本地文件夹排序记忆 | 适配移植 | UI 小功能 |
| `nomandBG` | 适配移植 | 新背景模式；默认反色规则需单独验收 |
| 外观导入确认 `ImportConfirmDialog` | 直接 cherry-pick | 降低误导入风险 |
| acrylic 开启确认 | 适配移植 | 桌面端 |
| 字幕尺寸倍率 / 自定义字重 | 适配移植 | 与 Lyra 字体预设体系对齐后合入 |
| iOS Safari mask/filter 合成修复 | 适配移植 | 与和声光晕一并合入更划算 |
| 设置面板独立明暗 | 适配移植 | v0.6.7 `8bbf98a` |
| 多通道发布 / updateChannels | 只学架构 | 与 Lyra 发布流不同 |
| 语音输入暂停 `voiceInputPause` | 可选 | 桌面端旁路能力 |

---

## 6. 明确不要搬

| 项 | 原因 |
|---|---|
| 整包覆盖视觉默认（粒子密度、后台 keep、DPR） | 与 Mineradio 校准及 `document.hidden` 降载策略冲突 |
| 112KB+ `App.tsx` 巨石回潮 | Lyra / Folia 都在拆 `components/app/*`；只搬具体模块 |
| 整包 `sync-server` / `deploy/docker/*` | 运维面大；Lyra 不走 Folia 自托管栈 |
| 用 Folia onlineMusic 替换 sidecar | 架构分叉；Lyra 多源已走 Electron sidecar |
| Now Playing 协议/端口整盘复制 | 可学 clock 外推；勿绑死外部插件生态 |
| 把 WebGL lyric stage 默认与 DOM 模式叠开 | Lyra 已硬关 `shouldEnableInteractive3dWebGlLyrics` 防幽灵字 |

---

## 7. 性能专章

### 7.1 Lyra 已领先（移植时必须保留）

| 能力 | 路径 |
|---|---|
| 自动性能档 / FPS+内存监控 | `hooks/usePerformanceMonitor.ts`、`utils/performance/performanceMonitorMath.ts`、`stores/usePerformanceMonitorStore.ts` |
| Electron GPU 崩溃降级 | `utils/performance/electronInteractive3dGuardMath.ts`、`gpuUnstableStorage.ts` |
| 媒体时钟与 visualizer RAF 隔离 | `utils/playback/mediaClockIsolationMath.ts`、ADR-0006 |
| Monet Electron lite / 帧成本 | `monetElectronLiteMath.ts`、`interactive3dFrameCostMath.ts` |
| Mineradio frameSkip / DPR ceiling / hidden 降载 | interactive3d + cover particle 路径 |

上游 **没有** `src/utils/performance/` 这一套；合入 Folia 模式时要主动接线，而不是「上游没有就不做」。

### 7.2 两边同源、继续对齐

| 能力 | 路径（两边都有） |
|---|---|
| RAF → MotionValue 时间 + 离散行号 | `hooks/usePlaybackVisualizerBridge.ts` |
| 全局 visualizer FPS 上限 | `utils/frameRateLimiter.ts` |
| 歌词解析 Worker | `workers/lyricsParser.worker.ts`、`utils/lyrics/workerClient.ts` |
| 运行时护栏 skill | `skills/frontend-runtime-guardrails/SKILL.md` |
| 解析 → renderHints → grapheme → 模式 | `utils/lyrics/*`、`visualizer/definition.ts` |

### 7.3 上游近期值得吸收的正确性 / 性能点

1. **pendolo seek / 手动滚动 / 切歌清空时间** — 反哺所有 canvas 模式的 seek 鲁棒性（不只是 pendolo 本身）。
2. **iOS Safari mask/filter 合成边界**（v0.6.7 `3a36230`）— 与和声光晕一并合入。
3. **Latent / Fluid 降分辨率、MAX_SHADER_PIXELS** — 对照 Lyra Monet Electron lite 做交叉检查，**不照搬默认**。
4. **harmonyRuntime 的 signature 门闩** — 和声层更新模式可复用到其他 overlay。
5. **Grid3DSlider `stopWheelSmoothing`** — 避免键盘/滚轮竞态残留 RAF。

### 7.4 移植检查清单（每个视觉特性合入时）

- [ ] 连续时间只走 MotionValue / canvas / DOM 直写，不进 React state
- [ ] 接入 `frameRateLimiter` 与现有 quality tier
- [ ] Electron 路径有 DPR / frameSkip / GPU demotion 回退
- [ ] `document.hidden` 时降载行为不变
- [ ] 外观导入导出与 command palette 按 skill 注册
- [ ] 不改变 Lyra 已校准的默认数值（除非单独产品决策）

---

## 8. 同源能力快照（不必再「迁移」）

以下 Lyra 已具备，评估上游时勿重复立项：

- Lyric Clock（ADR-0006）+ per-song offset + desktop lyrics
- 已注册歌词模式含 **pendolo** + VisPlayground + tuning 导入导出
- **和声字幕层** + `subtitleContentMode`（背景样式仍可 polish）
- AI 双主题 / ThemePark / 歌词色预设 / effect packs
- Stage API / Now Playing clock 工具（部分）
- folia-grid、cover particle band tracker
- 主题/歌词设置分层（播控极简 + ControlsTab 完整）— 已对齐过 Folia

---

## 9. 建议的下一刀

1. **§1.1 polish**：和声光晕 + 底部字幕渐隐 + Grid3DSlider 竞态（默认下一刀）  
2. **cappella 动态行高安全区**  
3. **OBS PlayerCap + AI overlay** — 推流场景；注意时钟隔离  
4. **diorama / localLyricsPriority / 命令面板 pin** — 原 P1 队列  

---

## 10. 参考路径速查

```
.temp/folia-major/                         # 已更新到 v0.6.8 @ 002b581
  src/components/visualizer/pendolo/
  src/components/visualizer/diorama/
  src/components/visualizer/VisualizerHarmonyOverlay.tsx   # 光晕背景
  src/components/visualizer/VisualizerSubtitleOverlay.tsx  # 遮罩渐隐
  src/components/visualizer/cappella/VisualizerCappella.tsx
  src/components/folia-grid/Grid3DSlider.tsx               # stopWheelSmoothing
  src/components/visualizer/harmonyRuntime.ts
  src/components/obs/ObsPlayerCapSourceApp.tsx
  src/utils/lyrics/sourcePriority.ts
  src/utils/lyrics/alternateText.ts
  src/components/command-palette/pinnedCommandPreferences.ts
  deploy/docker/                                           # 不做

src/utils/performance/                     # Lyra 独有护栏 — 移植时保留
src/utils/playback/mediaClockIsolationMath.ts
src/components/visualizer/dazibao/         # Lyra 自研未注册
docs/adr/0006-lyric-clock-sync-and-offset-compensation.md
```
