# 悬浮 / 动态歌词开源可借鉴目录

> 日期：2026-08-01  
> 目的：为桌面歌词与舞台动态歌词收集**有出处**的参考；禁止自行编造效果名。  
> 原则：优先 MIT / Apache / CC0；GPL / AGPL 只学思路后 clean-room，不直接并入产品源码。  
> 调研核对：[调研开源悬浮歌词](https://github.com/) agent `14581baf-24e6-4338-a077-2ff78d52db4b`（一手 README / SPDX）。

## 0. 与 Happy Player 现状的关系

| 层 | 已有 | 缺口（本目录服务对象） |
|----|------|------------------------|
| 数据 | `amll-ttml-db`（CC0）、`@applemusic-like-lyrics/ttml`、lyrics-resolve | — |
| 舞台 | classic / monet / pendolo / `LyricKaraokeWipe`；`lyricFontPresetId` / `lyricEffectPackId` / `visualEffectIntensity` | 与桌面窗未打通 |
| 桌面 | Electron 置顶窗 + `public/desktop-lyrics.html`（单行 wipe + 固定 `lyr-in`） | 字体组合 / 特效包 / 可选动态模式 |

当前产品方向（已确认）：**增强桌面歌词**，核心是**字体组合 + 字体特效 + 动态歌词**；设置直通现有 store，另加换行动画模式枚举。

---

## 1. 使用与许可速查

| 档位 | 含义 | 用法 |
|------|------|------|
| ✅ 可依赖 / 移植 | MIT、Apache-2.0、CC0 | 可引用算法、CSS 合同、部分源码（保留版权声明） |
| 🟡 谨慎 | MIT + 额外 README 限制、商标名 | 学交互；命名勿蹭品牌 |
| ⚠️ 勿直接并入 | GPL-3.0、AGPL-3.0 | 只看效果与架构，自研实现 |
| 🚫 灵感-only | 闭源商业 App | 不可像素抄、不可用商标暗示官方 |

---

## 2. AMLL 生态

### 2.1 Apple Music-like Lyrics（渲染组件）

- **URL**: https://github.com/amll-dev/applemusic-like-lyrics · https://amll.dev/
- **License**: AGPL-3.0 ⚠️
- **可取之处**:
  - 类 iPad Apple Music 多行歌词页：逐字时间轴、翻译 / 罗马音、对唱与背景行
  - 动态流体背景（Pixi）
  - CSS 变量定制；`mask-image` / `mix-blend-mode: plus-lighter` 细节
  - React 绑定包存在，但并入会 AGPL 传染
- **不可取 / 风险**: 直接 `npm` 进主产品；「Apple Music」命名商标
- **对我们**: 效果天花板参考；桌面/舞台做同类体验时 **clean-room**，继续只用其数据侧

### 2.2 amll-ttml-db

- **URL**: https://github.com/amll-dev/amll-ttml-db
- **License**: CC0-1.0 ✅
- **可取之处**: 社区 TTML 逐词库、平台 ID 元数据、格式约定
- **对我们**: 已接入（README 已致谢）；非渲染器

### 2.3 amll-ttml-tool / amll-player

- **URL**: https://github.com/amll-dev/amll-ttml-tool · https://github.com/amll-dev/amll-player
- **License**: GPL / AGPL ⚠️
- **可取之处**: 打轴工作流、完整播放器集成方式
- **对我们**: 勿并入代码；编辑器若自建另开设计

---

## 3. Web / 渲染算法（桌面与舞台共用参考）

### 3.1 music-lyric-player-web ⭐ 优先

- **URL**: https://github.com/music-lyric/music-lyric-player-web  
  Demo: https://music-lyric.github.io/music-lyric-player-web  
  解析: https://github.com/music-lyric/music-lyric-kit-node
- **License**: MIT ✅
- **可取之处**:
  - 音节 **float**、**karaoke wipe**
  - 距离驱动的 blur / scale、边缘 fade
  - 滚动模式：smooth / ripple / directional / stagger
  - `base` 状态机 + DOM CSS transform；`data-role` CSS 合同
  - 翻译 / 罗马音 / 间奏
- **对我们**: 桌面换行动画与舞台 wipe/float 的**第一参考**；移植时重写进 `desktop-lyrics.html` / 现有 visualizer，勿整仓拷贝后不管 API 不稳定性

### 3.2 react-karaoke-lyric

- **URL**: https://github.com/chentsulin/react-karaoke-lyric  
  Demo: http://chentsulin.github.io/react-karaoke-lyric/
- **License**: MIT ✅
- **可取之处**: 双层文字 + `overflow:hidden` + width% 的最小 wipe
- **对我们**: 与现有 `LyricKaraokeWipe` / 桌面 gradient progress 同类；可作简化对照，不必再引依赖

### 3.3 Lyr-ix

- **URL**: https://github.com/bouzidanas/lyr-ix · https://lyr-ix.vercel.app
- **License**: MIT ✅（主题名含 spotify → 商标谨慎 🟡）
- **可取之处**: 逐行同步滚动、点行 seek、主题分层
- **对我们**: 多行舞台更相关；桌面单行可忽略 seek，学滚动焦点节奏

### 3.4 lyricBlow

- **URL**: https://github.com/xcwajdax/lyricBlow · https://xcwajdax.github.io/lyricBlow/
- **License**: MIT ✅
- **可取之处**: Canvas 逐词打轴；rail（karaoke scroll）/ multiline / full text 布局；LRC 导出
- **对我们**: 打轴工具链与 rail 布局灵感；非悬浮窗主路径

---

## 4. 桌面悬浮 / OSD

### 4.1 LyricGlow

- **URL**: https://github.com/ateymoori/lyricglow
- **License**: MIT ✅
- **可取之处**:
  - Electron macOS always-on-top 浮窗
  - 逐字高亮 + glow
  - 菜单栏歌词、LRC + 缓存
- **对我们**: 对照现有 `electron/desktopLyrics.cjs` 的置顶 / 穿透；glow 强度可与 `visualEffectIntensity` 挂钩

### 4.2 SpotifyLyrics（Swift）

- **URL**: https://github.com/denyherianto/SpotifyLyrics
- **License**: MIT ✅（名称含 Spotify → 商标谨慎 🟡）
- **可取之处**:
  - **四种动画模式**：Karaoke / Smooth / Spring / Glow（产品枚举直接对齐）
  - 迷你字幕条、间奏倒计时、点行 seek
  - word-level karaoke fill
- **对我们**: **桌面「换行动画」四选一的命名与行为语义出处**；实现须 Electron/HTML clean-room，勿抄 SwiftUI

### 4.3 Spotify Custom Floating Lyrics（Tauri）

- **URL**: https://github.com/ichika0130/Spotify-Custom-Floating-Lyrics
- **License**: MIT ✅
- **可取之处**: 透明置顶、点击穿透锁定、外观自定义、Win SMTC / macOS AppleScript
- **对我们**: 锁定 / 穿透交互已有；外观自定义可对照字体与颜色 payload

### 4.4 lx-music-desktop

- **URL**: https://github.com/lyswhut/lx-music-desktop  
  文档: https://lyswhut.github.io/lx-music-doc/
- **License**: Apache-2.0 ✅（另有项目补充协议，以仓库为准）
- **可取之处**:
  - Electron 独立桌面歌词 BrowserWindow
  - 锁定、字体/颜色/对齐/不换行、**竖排**、频谱
  - 暂停提高透明度、全屏自动关、任务栏歌词进程
- **对我们**: 窗体策略与设置项清单；竖排 / 频谱可作为后续增量，非本轮核心

### 4.5 Lyrix / Lyrimuse / Rota（macOS 独立 App）

| 项目 | URL | License | 可取之处 |
|------|-----|---------|----------|
| Lyrix | https://github.com/pranav-bhatkar/lyrix | 需核 LICENSE | 浮窗；README 称 slide/zoom/blur/flip/fade 等多动画 |
| Lyrimuse | https://github.com/Yudaotor/lyrimuse | GPL-3.0 ⚠️ | 逐词；经典浮层 / Dynamic Island 胶囊 / 菜单栏 |
| Rota | https://github.com/aalemoro/Rota | 需核 LICENSE | 封面优先 widget，翻面进同步歌词 |

- **对我们**: 动画枚举与胶囊布局作灵感；GPL 仓勿并入；落地前再核 SPDX

### 4.6 OSD Lyrics / FrontLine Lyrics Desktop

- **URL**: https://github.com/osdlyrics/osdlyrics · https://github.com/juliocax/FrontLine-Lyrics-Desktop
- **License**: GPL-3.0 ⚠️
- **可取之处**: Linux OSD 双模式；Windows 独立 overlay 进程 + WebSocket
- **对我们**: 架构观察即可；不并入

---

## 5. 中文播放器 / 插件生态

### 5.1 SPlayer / SPlayer-Next

- **URL**: https://github.com/SPlayer-Dev/SPlayer · https://github.com/SPlayer-Dev/SPlayer-Next  
  Demo: http://splayer.imsyy.top/
- **License**: AGPL-3.0 ⚠️
- **可取之处**:
  - 逐字高亮；LRC/QRC/YRC/TTML
  - 桌面歌词 / 灵动岛 / 任务栏歌词产品矩阵
  - README 致谢并集成 AMLL
- **对我们**: 产品矩阵对照；源码勿合并

### 5.2 Lyricify

- **App**: https://github.com/WXRIW/Lyricify-App · https://lyricify.app/（本体**非**全量开源）
- **Helper**: https://github.com/WXRIW/Lyricify-Lyrics-Helper — Apache-2.0 ✅
- **素材**: 部分创作 CC BY-SA 4.0（署名 + 衍生同许可）
- **可取之处**:
  - App：灵动词岛、桌面歌词、滚动体验（**仅体验参考**）
  - Helper：YRC/QRC/KRC/TTML/Lyricify Syllable 解析与降级
- **对我们**: 解析可学 Helper；UI/动画勿抄闭源 App；CC BY-SA 素材慎用

### 5.3 YesPlayMusic

- **URL**: https://github.com/qier222/YesPlayMusic
- **License**: MIT 🟡（README 另有「仅学习 / 禁商业非法」表述，商业需法务判断）
- **可取之处**: 应用内歌词排版审美
- **对我们**: Wiki 称桌面歌词暂无计划；非本轮主参考

### 5.4 HyPlayer + LyricParser

- **URL**: https://github.com/HyPlayer/HyPlayer（GPL ⚠️）· https://github.com/HyPlayer/LyricParser（MIT ✅）
- **可取之处**: Toast 式桌面歌词；LyricParser karaoke 行结构
- **对我们**: 解析器可参考；播放器 UI 勿并入

### 5.5 Refined Now Playing（BetterNCM）

- **URL**: https://github.com/solstice23/refined-now-playing-netease
- **License**: MIT ✅（已停更）
- **可取之处**: 沉浸页歌词动画、封面取色驱动主题
- **对我们**: 舞台侧灵感；桌面单行次要

---

## 6. 格式辅助

### 6.1 ALRC

- **URL**: https://github.com/kengwang/ALRC
- **License**: CC0-1.0 ✅
- **可取之处**: 高级歌词格式（多轨 / 背景人声等数据模型）
- **对我们**: 数据层远期；非视觉

---

## 7. 商业灵感（不可直接复制）

| 产品 | 可观察方向 |
|------|------------|
| Apple Music | 逐字弹跳、背景行、流体/封面氛围、TTML 词级 |
| Spotify | 全屏大字滚动、当前行层级（Canvas ≠ 歌词 OSS） |
| QQ 音乐 | QRC 逐字、传统桌面歌词 |
| 网易云音乐 | YRC 动态歌词、沉浸页 |
| 汽水音乐 | 年轻化排版与动效节奏 |

仅 **inspiration reference**；实现必须 clean-room。

---

## 8. 对「桌面特效歌词」的映射

权威设计：[`docs/superpowers/specs/2026-08-02-desktop-lyric-effects-design.md`](./superpowers/specs/2026-08-02-desktop-lyric-effects-design.md)

产品决策（2026-08-02）：参考项目里能 clean-room 的**歌词效果全部提供**（菜单一次齐），实现可 P0/P1/P2 分批。

| Happy Player 能力 | 优先出处 | 落地 |
|-------------------|----------|------|
| 字体组合 | `lyricFontPresets`；LyricGlow / lx-music | store → `buildDesktopLyricsState` → overlay |
| 强度 / 特效包 | `lyricVisualEffects` / `lyricEffectPacks` | 同上，驱动 echo/neon/glitch |
| 特效样式全集 | SpotifyLyrics + Lyrix + music-lyric-player-web + 现有 pack | `desktopLyricEffectId` |
| 叠影 / 多色重叠 | 产品诉求；yehuo echo | `echo-stack` 等 |
| 窗体锁定 / 穿透 | 已有；lx-music / Custom Floating Lyrics | `electron/desktopLyrics.cjs` |
| 真逐词轴 | AMLL 数据已有 | `float`/`ripple` 先 grapheme，后接 word timings |

署名：设置格子写出处；UI 用中性 id，不用 Apple/Spotify 商标作正式名。

---

## 9. 明确不做

- 直接依赖 AGPL 的 `@applemusic-like-lyrics/*` **渲染**包（ttml 解析包已用，保持数据边界）
- 合并 SPlayer / Lyricify App / GPL overlay 源码
- 像素级复刻商业 App
- Dynamic Island 胶囊 / 竖排 / 任务栏歌词 / AMLL 流体整页（另一产品形态）

---

## 10. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-01 | 初版：一手来源目录 + 桌面歌词增强映射 |
| 2026-08-02 | 对齐「特效全集提供」；链到 design spec |
