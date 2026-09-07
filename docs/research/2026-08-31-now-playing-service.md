# Widdit Now Playing Service 对照

- Date: 2026-08-31
- Scope: [Widdit/now-playing-service](https://github.com/Widdit/now-playing-service) 产品面、检测架构、API；对照 Lyra 已有 Stage「Now Playing」客户端与 OBS 浏览器源
- Method: 上游 README / Java+C# 源码 / frontend `apiList.ts` + Lyra `nowPlayingProvider.ts`、`nowPlayingClock.ts`、Integration 设置
- Related: [folia-major-borrow-analysis.md](../folia-major-borrow-analysis.md) §3.3 PlayerCap；产品能力摘要「Now Playing 连接」

## Executive summary

**不要把这个仓库嵌进 Lyra。继续当 Windows 侧车，把现有客户端做完整。**

[now-playing-service](https://github.com/Widdit/now-playing-service) 不是播放器，是 **检测别人在播什么** 的 Windows 工具：C# `GetMusicStatus.exe`（SMTC / 窗口标题 / 进程音量 / UIA）→ Java 本地 HTTP/WS `:9863` → OBS 组件 / 文件输出。前端在 [now-playing-frontend](https://github.com/Widdit/now-playing-frontend)，歌词展示走 AMLL。

Lyra **已经是它的客户端**：舞台源切到 Now Playing 时固定连 `ws://localhost:9863/api/ws/lyric`，进度还会打 `GET /api/query/progress`。分工已经对：Widdit 侦测 20+ 外部软件，Lyra 用自己的舞台渲染。再造一套检测、或把它的歌曲/歌词小组件搬进来，都是重复且方向反了。

**许可：** 后端 MIT；前端 **AGPL-3.0**。小组件 UI 不能当 MIT 抄进发行包。

## 它是什么 / 不是什么

| 是 | 不是 |
|----|------|
| Windows 10/11 x64 直播「正在播放」叠层 | 音乐库、队列、播放引擎 |
| 外部 App 侦测器 + 本地 API 宿主 | 跨平台 Media Session 桥（无 macOS/Linux） |
| 歌曲组件、歌词组件、仿 Apple Music 播放页 | 歌词可视化引擎（展示靠 AMLL） |
| OBS / 直播姬浏览器源 + `Outputs/*.txt` | Lyra 那种时钟隔离的舞台 publisher |

平台表（窗口标题或 SMTC）：网易 / QQ / 酷狗 / 酷我 / 汽水 / 全民K歌、Spotify / Apple Music / YTM、点歌机若干、PotPlayer / Foobar / AIMP / Salt、浏览器 / 洛雪 / MusicFree / Cider / YesPlayMusic。

进度默认靠 Java 侧计时外推；拖动进度条一般侦测不到。网易云、全民K歌用 UI Automation 读窗口 `MM:SS / MM:SS` 才能跟 seek。暂停靠进程峰值音量。

## 和 Lyra 已经接上的部分

| Widdit | Lyra |
|--------|------|
| `WS /api/ws/lyric` 事件 `Track` / `Lyric` / `PlayerPauseState` / `PlayerProgress` | `src/services/nowPlayingProvider.ts`，URL 写死 9863 |
| `GET /api/query/progress` | `src/utils/nowPlayingClock.ts`，7s 轮询 + RTT 补偿 |
| 本机先开 now-playing 服务 | Integration 设置 + 舞台空状态文案已经这么写 |
| 自己的 OBS 歌曲/歌词小组件 | **不用它的组件**；`ObsBrowserSourceApp` 推的是 Lyra 舞台 |

Folia 的 PlayerCap 是另一条「接外部播放器」的路，还没搬。不要和 Widdit 混成一套检测实现。

## 建议吸收

### 做：把现有客户端当一等公民

1. **配对 UX**  
   设置里写清：这是 Windows 侧车 [now-playing-service](https://github.com/Widdit/now-playing-service)，macOS 连不上。探测 `:9863` 是否在听、失败时给下载/启动提示，不要只留一句「请先启动」。

2. **进度以 WS 为准**  
   上游前端大约补 130ms；Lyra 已有 RTT 补偿，但 REST 7s 一轮偏粗。优先吃 `PlayerProgress` / `PlayerProgressReplay`，REST 只做丢包校正。

3. **文档对齐产品边界**  
   Now Playing = 外部软件在播、Lyra 只负责舞台。OBS 叠层继续走 Lyra browser source，不引导用户去加 Widdit 的 `/widget` `/lyric`。

### 可后做，不进主线

| 项 | 说明 |
|----|------|
| OBS 文本源文件 | `title.txt` / `author.txt` / `cover.jpg` 给只认文本源的直播软件。Lyra 自己播时也可写一份，不必经过 Widdit |
| macOS Now Playing | 走 MediaRemote / 现有 Media Session，**不是**移植 `GetMusicStatus.exe` |
| 点歌机适配 | 直播点歌场景才有意义；和 Widdit 平台表对齐的是「舞台能吃同一套 WS」，不是在 Electron 里扫窗口 |

## 明确拒绝

1. **不要**把 Java + `GetMusicStatus.exe` 打进 Electron（Win32 SMTC / UIA / CSCore，和 macOS 主场冲突）。
2. **不要**抄 frontend 的 widget / AMLL 播放页（AGPL，且舞台已经强得多）。
3. **不要**在 Lyra 里再实现 20 家窗口标题解析。
4. **不要**把 Folia PlayerCap 和这套 SMTC 侦测合成一个模块。
5. **不要**把 Now Playing 当收费主卖点（产品能力分析已标中实用性、低收费潜力）。

## 优先级

- **P0** 配对说明 + 9863 探活（Windows 侧车关系写清楚）。
- **P1** WS 进度为主、缩短对 REST 的依赖。
- **P2** 自播时可选文本文件输出给 OBS。
- **不排期** 内嵌检测器、搬小组件、macOS 窗口侦测。

## Sources

- https://github.com/Widdit/now-playing-service
- https://github.com/Widdit/now-playing-frontend
- https://raw.githubusercontent.com/Widdit/now-playing-service/master/README.md
- `external_programs/AudioService/GetMusicStatus/Program.cs`
- `src/main/java/com/widdit/nowplaying/service/{AudioService,NowPlayingService,WebSocketService,OutputService}.java`
- frontend `src/constants/apiList.ts`、`src/services/playerService.ts`
- Lyra: `src/services/nowPlayingProvider.ts`、`src/utils/nowPlayingClock.ts`、`src/components/modal/settings/IntegrationSettingsSubview.tsx`
