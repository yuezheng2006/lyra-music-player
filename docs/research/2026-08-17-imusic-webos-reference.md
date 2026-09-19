# i音乐（i.webos.im）参考调研

- Date: 2026-08-17
- Scope: [i.webos.im](https://i.webos.im/) 产品面对照、可借鉴 UX、对 Lyra 的落地边界
- Method: 入口页 HTML / 落地 SPA 资源 + 对照 happy-player 现有发现、搜索、播放、下载路径

## Executive summary

[i.webos.im](https://i.webos.im/) 不是 vivo 官方「i音乐」，也不是 LG webOS。它是一层加密 iframe 壳，真实产品是 Tabos 云桌面里的独立应用 **FreeMusicApp**，落地地址 `https://ios.25pan.com/music/`（站点自称「不运营,测试自用」）。

它强的不是歌词舞台，而是 **「推荐 / 排行榜 / 搜索 / 收藏 / 本地」一条完整听歌 IA**，以及播放条上的音质、桌面歌词、逐字歌词、相似歌曲。Lyra 已经在视觉和多源播放上领先；缺的是把发现与曲库做成同样一级的产品面。

**Lyra 立场：** 只学信息架构和交互，不移植其音源绑定、无损扒站、`musicSecureWorker` 或未授权下载。桌面端仍只保存当前会话已可播放的音频。

## Upstream snapshot

| 项 | i音乐 / FreeMusicApp |
|----|----------------------|
| 入口 | [https://i.webos.im/](https://i.webos.im/) → AES-GCM 解密 iframe → `https://ios.25pan.com/music/` |
| 宿主 | Tabos「云端桌面操作系统」，独立路由 `/music` |
| 技术 | Vue 3 + Vite，主包 `FreeMusicApp-*.js` |
| 音源 | 酷我、QQ、网易云、酷狗、汽水；歌词源酷我 / QQ；YRC 逐字 |
| 一级页 | 推荐、排行榜、收藏、本地、最近、设置 |
| 播放器 | 底栏 PlayerBar + 全屏 FullPlayer（唱片模式 / 沉浸 / 音质 / 歌词偏移） |
| 发现 | 猜你喜欢、雷达（熟悉/新鲜/我喜欢）、场景芯片、换一批、每日推荐、新歌、私人 FM |
| 排行榜 | 飙升 / 新歌 / 热歌 / 原创，另有诗意主题名：清岚 / 星河 / 听澜 / 弦月 |
| 搜索 | 歌曲 / 歌手 / 专辑 / 歌单，历史、下滑加载更多、加歌单、下载 |
| 设置 | 默认音质（标准/较高/极高/无损）、音源扫码绑定、逐字歌词、桌面歌词、弹幕、流体背景、自适应字号 |

主资源（2026-08-16 构建）：

- `assets/FreeMusicApp-cuJJDLUX.js`
- `assets/RecommendView-DF1d2ilk.js`
- `assets/FreeMusicToplist-iEBwMbuw.js`
- `assets/FullPlayer-BPtDOX9o.js`
- `assets/PlayerBar-Dmmn_Glk.js`
- `assets/SettingsView-C1zDJdE5.js`
- `assets/SimilarSongsPanel-DToNAfat.js`
- `assets/LocalMusicView-Dq7fwXck.js`

## 与 Lyra 对照

| 能力 | i音乐 | Lyra（对照时） |
|------|-------|----------------|
| 歌词舞台 / 3D 背景 | 流体光斑或静态取色 | **远强**：多模式歌词 + interactive3d |
| 多源搜索 / 播放 | 酷我 / QQ / 网易 / 酷狗 / 汽水 | 已有网易 / QQ / Coco / 酷我 / 酷狗 / 汽水 / Navidrome / YTM |
| 今日精选 | 每日推荐 + 雷达 + 换一批 | 已有 Today Picks（热歌种子匹配多源） |
| **排行榜一级入口** | 独立 Tab + 主题视觉 | **无**；热歌榜只当每日精选种子 |
| 搜索实体 | 歌 / 歌手 / 专辑 / 歌单 | 以歌曲为主，歌手/专辑是行内跳转 |
| 最近搜索 | 有 | 已有 `RecentSearchChips` |
| 相似歌曲 | 全屏播放器侧栏 | **无** |
| 音质切换 | 播放条四级（标准/较高/极高/无损） | 浮动条已有 exhigh / lossless / hires |
| 桌面歌词 / 逐字 | 设置 + 播放条 | 已有 |
| 本地下载 | 搜索/播放即可下，含无损宣传 | Electron：仅保存已可播音频；不宣传破解 |
| 音源扫码绑定 / VIP 档 | 设置里扫码 | 账号接入页；不学其绑定实现 |
| 弹幕 | 可开 | **不做**（和舞台抢注意力） |
| 挂载盘扫描 | 本地页扫 NAS/挂载目录 | 本地库 + Navidrome；挂载扫描可后做 |

## 明确拒绝

1. 不集成其聚合扒站、无损破解、会员绕过、`musicSecureWorker`。
2. 不宣传「免费无损」。
3. 不把弹幕做成默认播放层。
4. 不把流体光斑背景当成视觉主线——Lyra 已有更强的舞台。

## 建议吸收（按优先级）

### P0 — 本轮落地

**官方排行榜成为发现一级面。** i音乐把榜单做成和推荐同级的入口；Lyra 只把网易热歌榜藏在 `dailyChartPicks` 里。本轮用网易公开官方榜单（飙升 / 新歌 / 热歌 / 原创）做成：

- 首页发现条下的榜单轨道
- 侧栏「排行榜」
- 完整 `charts` 浏览页
- command palette：`home-charts`

视觉标签轻度借用其诗意主题名（清岚 / 星河 / 听澜 / 弦月），正式名仍用官方榜名单。

### P1 — 下一刀

1. **搜索实体 Tab**：歌曲 / 歌手 / 专辑 / 歌单（YTM 搜索已有 Songs/Playlists，在线源应对齐）。
2. **相似歌曲**：播放器侧栏，走已登录官方/sidecar 相似接口，没有接口就不做。
3. **推荐雷达 + 换一批 + 场景芯片**：建立在 Today Picks 之上，不新开未授权推荐源。
4. **从搜索「加入歌单 / 新建歌单」**：i音乐搜索结果的主动作之一。

### P2 — 只学架构

| 项 | 说明 |
|----|------|
| 歌词设置芯片（来源 / 字号 / 色板 / 预览） | Lyra 设置已更深；可学其「当场预览」密度 |
| 全屏播放器唱片模式 | 不替代舞台；最多做一种轻量封面态 |
| 挂载目录扫描 | 对照 Navidrome / 本地方案，勿搬其存储鉴权 |
| 音源绑定扫码 UX | 只学「已绑定 / 过期 / VIP 档」状态展示 |

## 本轮对 happy-player 的改动

1. 新增官方榜单目录、摘要/曲目归一化和缓存 store。
2. 首页发现条增加排行榜轨道；侧栏与 command palette 可进入完整榜单页。
3. 播放走现有网易歌单详情 / 曲目接口，不新增未授权音源。

## Sources

- https://i.webos.im/
- https://ios.25pan.com/music/
- https://ios.25pan.com/api/v1/settings/site
- happy-player: `src/services/dailyChartPicks.ts`, `src/components/app/home/HomeDiscoveryRail.tsx`, `docs/research/2026-08-16-musicdownload-reference.md`
