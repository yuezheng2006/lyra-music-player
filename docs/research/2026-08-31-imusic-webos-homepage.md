# i.webos.im 发现首页对照

- Date: 2026-08-31
- Scope: [i.webos.im](https://i.webos.im/) **发现首页**版式、信息架构、卡片密度；对照 Lyra 当前游客落地与登录后歌单页
- Method: 用户提供的发现页截图 + 现有首页代码（`ChartsSurface` / `HomeDiscoveryRail` / `AppSidebar`）+ 8 月 17 日产品面调研
- Prior: [2026-08-17-imusic-webos-reference.md](./2026-08-17-imusic-webos-reference.md)、[2026-08-30-coco-downloader-search-first.md](./2026-08-30-coco-downloader-search-first.md)

## Executive summary

**可以参考，但不能当游客首页模板。**

这张发现页是标准「门户式听歌站」：侧栏意图导航 + 顶栏搜索 + 底栏播放条，主栏一条滚动里塞完运营 Banner、问候最近听、场景入口、推荐歌单、榜单精选。它强的是 **第一屏就能点播放的密度**，不是歌词舞台。

Lyra 已经走了另一条线：游客默认进 **搜索**（侧栏文案就是「搜索」，表面是 `ChartsSurface`：搜索卡 + 热词 + 官方榜列表）。登录后「歌单」才是听台 + 心动 + 雷达 + 个人歌单。把 i 音乐发现页整页搬过来，会把 8 月 30 日刚定的搜索优先 IA 冲掉，也会把 Lyra 的浮动播放器和舞台让给一条普通底栏。

**Lyra 立场不变：** 只学版式与模块组合；不宣传免费无损，不移植扒站、下载、音源扫码绑定实现。汽水扫码同步歌单只作为账号动作，不上发现页主视觉。

## 这张首页在卖什么

截图里的发现页，从上到下是四层：

1. **壳：** 左栏发现 / 排行 / 电台 / 最近 / 本地 / 我喜欢 + 创建/收藏歌单树；顶栏居中搜索；底栏传统播放条。
2. **英雄 bento：** 左大运营 Banner（可直接播）、中「凌晨好，给你最近常听」四宫格、右「驾车」场景卡 + 唱片。
3. **推荐歌单：** 九宫格封面，角标播放量，标题在封面下，区块标题带 `>` 钻入。
4. **榜单精选：** 六张横卡，每张露出 Top 3 曲名/歌手，新曲打绿标，同样 `>` 钻入完整榜。

产品话术（搜歌随便听、无损下载、扫码同步汽水歌单）发生在搜索结果和设置里，**首页本身几乎不讲下载**。首页卖的是「打开就能逛、逛就能播」。

## 和 Lyra 现在差在哪

| 模块 | i.webos 发现页 | Lyra 现在 | 判据 |
|------|----------------|-----------|------|
| 默认落地 | 「发现」门户 | 游客 → `charts`（侧栏叫「搜索」） | **不要改游客默认** |
| 搜索位置 | 顶栏 chrome | 搜索就是页面（`HomeSearchCard`） | 游客维持；登录后可考虑顶栏压缩 |
| 发现 vs 曲库 | 发现是内容，歌单在侧栏树 | 登录后「歌单」= 听台 + 个人库（`HomeDiscoveryRail` + Carousel3D / Grid3D） | 发现模块应叠在歌单页上，不要新开一个空壳 Tab |
| 英雄区 | 三卡 bento：运营 / 问候最近听 / 场景 | 游客听台 mosaic；登录后听台 strip + 心动卡 | **学问候+最近听密度**；不学运营 Banner 和驾车插画 |
| 推荐歌单 | 算法/运营九宫格，主内容 | `getPersonalizedPlaylists` 只塞进电台拉取，发现页没有货架 | **登录后可做货架**，走已登录网易接口 |
| 榜单 | 首页 Top 3 卡片墙 + 独立排行入口 | `ChartsSurface` 是芯片 + 完整列表，没有首页预览墙 | **补预览墙**，完整列表留在搜索空状态 |
| 侧栏歌单树 | 创建的 / 收藏的 | 侧栏不列歌单，画布才是库 | 不搬树；Grid3D / 扁平货架已经承担 |
| 我喜欢 | 一级入口 | 混在歌单里 | P2 可做成歌单页置顶或侧栏一项 |
| 播放器 | 传统底栏 | 浮动条 + 舞台 | **不学底栏** |
| 无损 / 下载 | 排行角标「无损」 | 不宣传破解音质 | **拒绝** |

## 已经对上的部分

8 月 17 日那份调研的 P0（官方榜成为一级面）已经落地：`OFFICIAL_CHART_CATALOG`（飙升 / 新歌 / 热歌 / 原创）、侧栏入口、`ChartsSurface`、command palette `home-charts`。雷达货架 `HomeRadarShelf`、听台 `HomeListeningDesk`、播客 / 电台 / 最近 / 本地也都有。

所以这张截图 **不是新发现一座完整产品**，而是指出：登录后的歌单页还缺「门户那三块货」——问候最近听、推荐歌单墙、榜单 Top 3 卡。游客页不缺发现，缺的是搜索空状态的信息效率；榜单已经在填这个空。

## 建议吸收

### 做：登录后歌单页加成门户货架

不要新增「发现」Tab。把下面三块接到现有 `HomeDiscoveryRail` 下面、个人歌单画布上面：

1. **问候 + 最近常听卡**  
   「凌晨好，给你最近常听」比单独一个历史 Tab 更适合当第一眼。数据走已有播放历史，露出 4 张封面即可点播。听台 strip 继续负责多源精选，不要和这张卡抢同一批歌。

2. **榜单精选卡片墙**  
   四张官方榜各露 Top 3，点卡片进现有 `ChartsSurface` 或直接播。这是 8 月 17 日写过、但后来被「搜索优先」整页榜单挤掉的那条「首页发现条下的榜单轨道」。

3. **推荐歌单墙**  
   仅登录网易后，用已有 `getPersonalizedPlaylists`。封面角标可带播放量。区块标题带 `>`，钻入更多。未登录不要用这墙填游客页。

### 不做 / 只学气质

| 项 | 原因 |
|----|------|
| 整页改成发现门户、游客离开搜索 | 与 `resolveLandingHomeViewTab` + Coco 搜索优先决议冲突 |
| 运营 Banner / 神仙打架 | 没有编辑 CMS，硬造一张会假 |
| 驾车模式插画 | 没有对应能力；真要场景入口应对现有舞台/可视化模式，而不是一张空卡 |
| 传统底栏播放器 | 会吃掉浮动条和舞台，这是 Lyra 的产品 |
| 侧栏创建/收藏歌单树 | 与 Grid3D / 扁平歌单画布重复 |
| 排行「无损」角标、免费无损、未授权下载 | 产品红线，8 月 17 日已拒绝 |
| 把汽水扫码做成首页主视觉 | 扫码属于账号接入（已有汽水登录命令）；首页不靠它撑场 |

## 优先级

- **P0** 登录后歌单页：问候最近听卡 + 四榜 Top 3 预览墙。数据都已有（播放历史、`useOfficialChartStore`）。
- **P1** 登录后推荐歌单墙（`getPersonalizedPlaylists`），标题可钻入。
- **P2** 「我喜欢」在歌单页置顶；封面播放量角标；区块 `>` 统一成钻入约定。
- **不排期** 游客发现门户、驾车卡、底栏播放器、无损营销。

## Sources

- 用户提供的 [i.webos.im](https://i.webos.im/) 发现首页截图（2026-08-31）
- `src/components/app/Home.tsx`、`src/components/app/home/ChartsSurface.tsx`、`src/components/app/home/HomeDiscoveryRail.tsx`
- `src/components/app/chrome/AppSidebar.tsx`（侧栏「搜索」=`charts`，「歌单」= 登录库）
- `src/utils/home/resolveLandingHomeViewTab.ts`
- `src/data/musicCharts/catalog.ts`
- `src/services/netease.ts` `getPersonalizedPlaylists`
- [docs/research/2026-08-17-imusic-webos-reference.md](./2026-08-17-imusic-webos-reference.md)
- [docs/research/2026-08-30-coco-downloader-search-first.md](./2026-08-30-coco-downloader-search-first.md)
