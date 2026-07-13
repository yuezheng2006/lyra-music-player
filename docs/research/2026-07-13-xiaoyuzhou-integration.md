# 小宇宙 (Xiaoyuzhou) 第三方集成调研

- Date: 2026-07-13
- Scope: 公开/非官方 API、RSS、鉴权、ToS、数据面、对 happy-player 播客 Tab 的建议
- Method: 优先引用官方页面与开源客户端源码/文档

## Executive summary

**能否集成？** 可以“技术上”集成，但**没有官方开放平台/公开 API** 可供第三方播客 App 正规对接。

| 保真度 | 路径 | 结论 |
|--------|------|------|
| 低–中 | 上游 RSS / OPML / iTunes `feedUrl` | 合法、稳定；覆盖「有独立 RSS 的节目」，漏掉小宇宙独占/付费内容 |
| 中 | 网页 `__NEXT_DATA__` / RSSHub 抓取 | 无需登录可读部分公开页；易碎、集数有限、反爬时会挂 |
| 高 | 逆向 `api.xiaoyuzhoufm.com` | 搜索/订阅/进度/评论/音频 URL 均有社区实现；**ToS 禁止外挂与未授权访问**；登录常因验证码/版本校验失效 |

**与 Listen Notes / cos.txqing.com：** 未发现小宇宙与 Listen Notes 的 API 合伙关系；Listen Notes 是独立的全球播客搜索 API。未找到 `cos.txqing.com` 属于小宇宙基础设施的证据（更像腾讯云 COS / 蜻蜓相关域名猜测，本调研无主源确认）。小宇宙媒体 CDN 常见为 `*.xyzcdn.net`。

**对 happy-player：** 现有播客 Tab 基于网易（`neteasePodcast.ts` / `PodcastBrowseSurface.tsx`）。推荐：**继续以网易为主目录**；用 OPML/RSS/iTunes 补齐可分发中文播客；**不要**把逆向小宇宙 API 作为默认产品依赖。

## Available integration paths (ranked by feasibility)

### 1. Keep NetEase podcast catalog (highest product feasibility for happy-player)

- **What:** 继续用现有网易播客（djradio/voice）发现与播放。
- **Pros:** 已落地；鉴权与播放栈熟悉；无小宇宙 ToS 冲突。
- **Cons:** 与小宇宙目录不完全重叠；独占节目缺失。
- **Sources:** happy-player `src/services/neteasePodcast.ts`; App Store 亦称小宇宙支持「一键导入」订阅迁移，说明跨客户端迁移是 OPML 生态而非开放 API
  https://apps.apple.com/cn/app/%E5%B0%8F%E5%AE%87%E5%AE%99-%E4%B8%80%E8%B5%B7%E5%90%AC%E6%92%AD%E5%AE%A2/id1488894313

### 2. OPML export/import + standard RSS feeds (best legal fidelity for multi-platform shows)

- **What:** 用户从小宇宙导出 OPML（含各节目 `xmlURL`），或经 iTunes Search API 拿 `feedUrl`，再拉标准 RSS。
- **Pros:** 行业标准；音频 enclosure 可播；无逆向 token。
- **Cons:** 小宇宙**不**对每档节目提供稳定的官方 RSS 出口；独占/仅站内托管节目可能没有可用 feed；部分网络对某些 feed host 有封锁。
- **Sources:**
  - OPML 导出步骤（社区教程）：https://jingyan.baidu.com/article/db55b6092736a30aa30a2fba.html
  - OPML 结构说明：https://matters.town/a/fyns88x7j7ap
  - iTunes → RSS 路径（社区 skill）：https://github.com/rrrrrredy/xiaoyuzhou-podcast/blob/main/SKILL.md
  - 产品侧：小宇宙支持粘贴 RSS 订阅（36氪评测）：https://36kr.com/p/2252986260959105

### 3. Public web scrape / RSSHub proxy (medium feasibility, fragile)

- **What:** 解析 `https://www.xiaoyuzhoufm.com/podcast/:id` 中的 `#__NEXT_DATA__`，或使用 RSSHub `/xiaoyuzhou/podcast/:id`。
- **Pros:** 无需用户登录即可做「单节目更新」类订阅；可拿到 title、enclosure、shownotes（RSSHub 二次请求 episode JSON）。
- **Cons:** 依赖前端 SSR/SPA 形态；历史 issue 显示页面抓取会失败；网页侧集数有限；不适合账号同步。
- **Sources:**
  - RSSHub 路由实现：https://github.com/DIYgod/RSSHub/blob/master/lib/routes/xiaoyuzhou/podcast.ts
  - 抓取失败报告：https://github.com/DIYgod/RSSHub/issues/18467
  - 早期需求（站内节目无导出 RSS）：https://github.com/DIYgod/RSSHub/issues/6941

### 4. Unofficial private API via community clients (highest technical fidelity, lowest compliance)

- **What:** 调用 `https://api.xiaoyuzhoufm.com`，模拟 App（`BundleID: app.podcast.cosmos`）头，使用 `x-jike-access-token` / `x-jike-refresh-token` / `x-jike-device-id`。
- **Pros:** 覆盖发现、订阅、进度、评论、付费音频链接等。
- **Cons:** 非官方；ToS 禁止外挂与未授权访问；SMS 登录曾因阿里云滑块/「请升级」失败；token 会过期。
- **Primary community projects:**
  - https://github.com/ultrazg/xyz （功能最全的本地代理/SDK）
  - https://github.com/MosesHe/xiaoyuzhoufm-mcp （MCP + 明确端点）
  - https://github.com/r266-tech/xiaoyuzhou （只读 CLI，含分页/字幕）
  - https://github.com/jackwener/OpenCLI/blob/main/docs/adapters/browser/xiaoyuzhou.md （本地凭证文件）
  - Token 抓取说明：https://github.com/lindenxing/rss-worker/blob/main/docs/GET_XIAOYUZHOU_TOKEN.md

### 5. Official partner / developer portal (not available)

- **Finding:** 未发现小宇宙面向第三方 App 的公开开发者门户或开放 API 文档。
- **Official surfaces found:** 用户产品站 `xiaoyuzhoufm.com` / `podcast.xyz`、主播博客、App 内协议链接；无 API keys / OAuth for 3rd-party apps。
- **Note:** Apifox 上「小宇宙大平台」(`test.51vive.com/openapi/...`) 看起来是**另一产品**的内部开放文档，不应视为小宇宙 FM 官方 API。
  https://s.apifox.cn/872629ba-a449-4ac4-9135-a8052ebde3e3/api-103607113

### 6. Listen Notes Podcast API (orthogonal)

- Listen Notes 提供正式商业 Podcast API（搜索/目录），**不是**小宇宙官方接口，也不等于小宇宙中国目录。
  https://www.listennotes.com/api/docs/

## Domain / identity notes

| Name | Relation |
|------|----------|
| 小宇宙 / Xiaoyuzhou | 即刻系播客客户端；运营方在 App Store 显示为宁波追光网络科技有限公司 |
| `xiaoyuzhoufm.com`, `web.xiaoyuzhoufm.com`, `podcast.xyz` | 官方站点（同品牌落地页）https://www.xiaoyuzhoufm.com/ https://podcast.xyz/ |
| `api.xiaoyuzhoufm.com` | 非公开 App/Web API 主机（社区一致） |
| `*.xyzcdn.net` | 音频/封面 CDN（RSSHub 样例可见）https://github.com/DIYgod/RSSHub/pull/7592 |
| `xyz.fm` | 用户提及域名；本调研未找到独立官方文档站，以 `xiaoyuzhoufm.com` / `podcast.xyz` 为准 |
| Listen Notes | 独立全球播客搜索引擎/API；与小宇宙无官方 API 绑定 |
| `cos.txqing.com` | **未找到**与小宇宙主源关联证据 |

App Store（含协议链接）：
https://apps.apple.com/cn/app/%E5%B0%8F%E5%AE%87%E5%AE%99-%E4%B8%80%E8%B5%B7%E5%90%AC%E6%92%AD%E5%AE%A2/id1488894313

## API surface details (unofficial, with sources)

Base URL: `https://api.xiaoyuzhoufm.com`
（https://raw.githubusercontent.com/MosesHe/xiaoyuzhoufm-mcp/main/internal/constants/constants.go）

### Auth model

| Step | Endpoint | Notes | Source |
|------|----------|-------|--------|
| Send SMS code | `POST /v1/auth/sendCode` | 曾要求阿里云 `captchaVerifyParam`；易 400 | MosesHe `auth_api.go`; ultrazg#23 https://github.com/ultrazg/xyz/issues/23 |
| Login / signup | `POST /v1/auth/loginOrSignUpWithSMS` | Token 在**响应头**：`x-jike-access-token`, `x-jike-refresh-token` | MosesHe `auth_api.go`; ultrazg#22 https://github.com/ultrazg/xyz/issues/22 |
| Refresh | `POST /app_auth_tokens.refresh` | Header 带 `x-jike-refresh-token` | MosesHe `auth_api.go` |
| Session headers | `x-jike-access-token`, `x-jike-device-id`, App UA/BundleID | Jike 系头命名 | MosesHe podcast/search clients; rss-worker token doc |

Web 抓包也可拿 `x-jike-device-id` + `x-jike-refresh-token`：
https://github.com/lindenxing/rss-worker/blob/main/docs/GET_XIAOYUZHOU_TOKEN.md

OpenCLI 凭证文件字段：`access_token`, `refresh_token`, `device_id`, …
https://github.com/jackwener/OpenCLI/blob/main/docs/adapters/browser/xiaoyuzhou.md

### Content / discovery endpoints (documented in open-source clients)

| Capability | Endpoint (as implemented) | Source |
|------------|---------------------------|--------|
| Podcast detail | `GET /v1/podcast/get?pid=` | MosesHe `podcast_api.go` |
| Episode list | `POST /v1/episode/list`（`loadMoreKey` 分页，约 15/页） | MosesHe; r266 README https://github.com/r266-tech/xiaoyuzhou |
| Episode detail | `GET /v1/episode/get?eid=` | MosesHe |
| Search podcast/episode/user | `POST /v1/search/create` (`type`: PODCAST/EPISODE/USER) | MosesHe `search_api.go` |
| Pickup / 精选 | `POST /v1/pickup/list` | rss-worker curl 示例 |
| Subscriptions, progress, comments, stickers, charts, etc. | 由 ultrazg/xyz 代理封装（本地 `/docs`） | https://github.com/ultrazg/xyz/blob/main/README.md |

ultrazg/xyz 宣称能力（摘要）：短信登录、搜索、我的订阅、订阅/取消、节目/单集详情、**音频链接（含付费单集）**、播放进度读写、评论 CRUD、榜单/精选、精彩时间点、分类、收藏、收听历史、用户偏好等。
https://raw.githubusercontent.com/ultrazg/xyz/main/README.md

r266-tech 额外强调：官方字幕/transcript（signed URL）、播放历史（仅 `is_played`/`is_finished`，无精确秒数）。
https://github.com/r266-tech/xiaoyuzhou

### RSS / web data available without private API

From RSSHub `podcast.ts`（解析 `__NEXT_DATA__` + `_next/data/.../episode/:eid.json`）：

- Podcast: title, author, description, image, pid
- Episode: title, enclosure.url, duration, pubDate, eid, shownotes/description, image

https://github.com/DIYgod/RSSHub/blob/master/lib/routes/xiaoyuzhou/podcast.ts

### Data availability matrix

| Data | Official public API | RSS / web | Unofficial API |
|------|---------------------|-----------|----------------|
| Podcast discovery / search | ❌ | 部分（网页/RSSHub） | ✅ |
| Episode list | ❌ | 有限 | ✅（可分页） |
| Audio URLs | ❌ | ✅（enclosure，公开节目） | ✅（含付费链路声明） |
| Show notes | ❌ | ✅ | ✅ |
| Subscriptions sync | ❌（仅 OPML 人工导出） | ❌ | ✅ |
| Playback progress sync | ❌ | ❌ | ✅（读写） |
| Comments / 精彩时间点 | ❌ | ❌ | ✅ |
| Transcripts | ❌ | ❌ | ✅（r266） |
| DRM | 未见广泛 DRM；付费内容靠鉴权 | 付费通常不可得 | 付费依赖登录；非 Widevine 类证据不足 |

## Legal / ToS constraints

官方协议：
https://post.xiaoyuzhoufm.com/podcast-agreement/

相关条款（摘要，以原文为准）：

- **2.1.1** 个人、不可转让、非排他许可；**非商业目的**安装使用；不得擅自改编/复制/交易产品。
- **3.9** 不得使用未经授权的插件、「外挂」或第三方工具干扰/破坏/修改正常运行。
- **3.10** 不得未经许可使用相关数据或进入相关服务器/帐户；不得探查/扫描系统弱点。
- **4.5** 未经权利人同意，不得反向工程、反向汇编、反向编译。

隐私政策：https://post.jellow.club/podcast-privacy/

社区客户端均自带「仅供学习」免责声明（ultrazg、MosesHe 等），**不构成合法授权**。

## Risks

| Risk | Severity | Evidence |
|------|----------|----------|
| ToS / 不正当竞争诉讼风险 | High | 协议 3.9/3.10/4.5；国内平台对未授权数据接口较敏感 |
| Auth breakage | High | SMS captcha、App 版本门槛（ultrazg#22/#23） |
| Token expiry / account ban | Medium–High | refresh 过期；分享 token 危险（rss-worker FAQ） |
| CORS | Medium（若浏览器直连） | API 面向原生 App；Electron 主进程或自建代理更现实 |
| Fragile web scrape | Medium | RSSHub issue #18467 |
| Exclusive / paid content gaps | Medium | 无官方 RSS；付费需登录 API |
| DRM | Low–unclear | 多为鉴权后的 CDN URL；未发现明确流媒体 DRM 文档 |
| Product liability | High | 把逆向 API 做进发行版会绑定持续破解与合规成本 |

## Recommended approach for happy-player

happy-player 已有基于网易的播客表面（`PodcastBrowseSurface` + `neteasePodcast.ts`）。建议：

1. **默认继续 NetEase 播客目录与播放**——产品路径最短、风险最低。
2. **可选增强（合规）：**
   - 支持用户导入 OPML（从小宇宙导出）→ 解析 `xmlURL` → 标准 RSS 订阅与更新；
   - 对「仅有小宇宙链接、但 Apple Podcasts 也有」的节目，用 iTunes Search `feedUrl` 解析上游 RSS。
3. **不要**把 `api.xiaoyuzhoufm.com` 逆向客户端打进正式发行包（违反 ToS，登录易碎，维护成本高）。
4. 若仅个人/研究需要高保真：可用 ultrazg/r266 等**本地、用户自备 token**工具，与产品解耦。
5. 若未来必须做「小宇宙登录同步」：应优先走**商务合作/正式授权**，而非继续依赖私有 API。

## Primary sources index

- Official site: https://www.xiaoyuzhoufm.com/ https://podcast.xyz/
- Software license & ToS: https://post.xiaoyuzhoufm.com/podcast-agreement/
- Privacy: https://post.jellow.club/podcast-privacy/
- App Store listing (features + agreement links): https://apps.apple.com/cn/app/%E5%B0%8F%E5%AE%87%E5%AE%99-%E4%B8%80%E8%B5%B7%E5%90%AC%E6%92%AD%E5%AE%A2/id1488894313
- ultrazg/xyz: https://github.com/ultrazg/xyz
- MosesHe MCP + API client: https://github.com/MosesHe/xiaoyuzhoufm-mcp
- r266 CLI: https://github.com/r266-tech/xiaoyuzhou
- OpenCLI adapter: https://github.com/jackwener/OpenCLI/blob/main/docs/adapters/browser/xiaoyuzhou.md
- Token capture guide: https://github.com/lindenxing/rss-worker/blob/main/docs/GET_XIAOYUZHOU_TOKEN.md
- RSSHub route: https://github.com/DIYgod/RSSHub/blob/master/lib/routes/xiaoyuzhou/podcast.ts
- Listen Notes API (unrelated official podcast API): https://www.listennotes.com/api/docs/
