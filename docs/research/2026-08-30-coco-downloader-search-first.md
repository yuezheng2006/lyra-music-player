# CoCo Downloader 搜索优先 IA

- Date: 2026-08-30
- Scope: [markcxx/coco-downloader](https://github.com/markcxx/coco-downloader) 信息架构对照；Lyra 干掉首页后空状态怎么填
- Method: 上游 `src/app/page.tsx`、`src/app/api/search/route.ts` + 对照 Lyra 搜索落地 / overlay

**不是** Lyra 的 `coco` 免费音源。那个是 sidecar provider；这个是独立下载站。两套产品不要混。

## Executive summary

CoCo Downloader 这类站的答案不是「再造一个发现首页」，而是：**产品就是搜索**。空查询时页上只有搜索框、来源、热门词；提交后同一页换成结果，从行里播放/下载。没有封面田，没有听台，没有排行榜。

Lyra 已经把游客落地改成搜索 + 排行榜。该学的是空状态热词和「结果不要盖住搜索」，不是它的扒站、批量下载抽屉、或营销功能卡。

**Lyra 立场：** 只借搜索优先 IA。桌面端仍只保存当前会话已可播音频；不集成其 scraper providers，不宣传免费无损。

## Upstream snapshot

| 项 | CoCo Downloader |
|----|-----------------|
| 形态 | Next.js 单页，仓库 [markcxx/coco-downloader](https://github.com/markcxx/coco-downloader) |
| 线上气质 | [cocodownloader.markqq.com](https://cocodownloader.markqq.com) |
| 入口 | 只有 `src/app/page.tsx`（千行级，搜索 + 播放 + 下载全堆在一起） |
| 空状态 | 大搜索框 + 来源 chips + 热门词（周杰伦 / 林俊杰 / 陈奕迅…）+ 三张功能卡 |
| 提交后 | `searched` 为真：顶栏 `layout` 压缩，热词/功能卡退出，结果列表换上 |
| 结果行 | 封面播放、双击播放、勾选、单曲/批量下载 |
| 搜索 API | `GET /api/search?q=&provider=`；`provider=all` 时 `Promise.all`，失败源返回 `[]` |

空提交直接 return，不跳页。热词在仓库里多数是 **填入输入框**，不自动搜。

## 学 / 不学

| 模式 | 处理 |
|------|------|
| 没有首页，搜索就是产品 | **已采纳**（侧栏搜索第一，游客无歌单） |
| 空状态 = 搜索 + 来源 + 一行热词 | **采纳**；热词点下去直接搜（播放器比下载站更该如此） |
| 没搜时用排行榜填空 | **比 Coco 更好**；Coco 用营销卡，Lyra 用官方榜（i音乐已采纳的一级发现） |
| 结果留在同一表面，搜索条不换一套 | **下一步**；现在 `SearchResultsOverlay` 全屏盖住 `HomeSearchCard` |
| 行内播放 | 已有 overlay 行播放 / 播全部 |
| 勾选批量下载 | overlay 已有；不做成下载站主路径 |
| 失败源吞成 `[]` | 已有多源搜索；Coco sidecar 仍须 < 8s |
| scraper / 无损宣传 / 巨型 `page.tsx` | **拒绝** |

## 对 Lyra 的落地

1. **空查询**：搜索条 + 来源 chips + 一行热门推荐 + 排行榜。不要听台，不要封面田，不要功能卖点卡。
2. **有查询**：理想是排行榜换成结果，`HomeSearchCard` 留着。在抽出 overlay 结果体之前，继续走现有 overlay，不要把榜单塞进 overlay。
3. **Bilibili / 汽水**：热词跟当前来源走（UP / 艺人），不要把「周杰伦」硬套到 B 站空状态。
4. **登录**：仍只为歌单、红心、雷达；Coco 站点无账号模型，不学「搜之前先登录」。

## Sources

- https://github.com/markcxx/coco-downloader
- https://github.com/markcxx/coco-downloader/blob/master/src/app/page.tsx
- https://github.com/markcxx/coco-downloader/blob/master/src/app/api/search/route.ts
- https://zread.ai/markcxx/coco-downloader
- happy-player: `src/components/app/home/ChartsSurface.tsx`, `src/components/SearchResultsOverlay.tsx`, `docs/research/2026-08-16-musicdownload-reference.md`, `docs/research/2026-08-17-imusic-webos-reference.md`
