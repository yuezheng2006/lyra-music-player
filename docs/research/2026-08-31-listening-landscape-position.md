# 听歌方案对照与 Lyra 定位

- Date: 2026-08-31
- Scope: 酷狗概念版+kgcheckin、[EchoMusic](https://github.com/hoowhoami/EchoMusic)、YouTube Music、[i.webos.im](https://i.webos.im/)、music.411081.xyz
- Method: 用户清单截图 + 各产品公开 README/站点 + 对照 Lyra 现有舞台、多源、OBS
- Prior: [2026-08-31-imusic-webos-homepage.md](./2026-08-31-imusic-webos-homepage.md)

## Executive summary

**Lyra 不进这张「怎么免费听」清单。** 定位是桌面听歌舞台：对标 **Folia 为主、Mineradio 为辅**，硬筛 **高性能 / 高B格 / 高氛围 / 高实用**。多源搜得到、账号歌单带得走，歌词和画面才是主产品。

这五家解决的是同一类抱怨——官方 App 门槛高、曲库割裂、不想装客户端。路径分别是：刷 VIP、套官方壳、投靠大曲库、网页扒站。Lyra 已经在另一条线上：Electron 桌面播放器 + 多模式歌词舞台 + OBS。跟他们抢「免费无损 / 零安装 / 单厂替代客户端」，会把自己的差异化做没。

## 五家各自卖什么

| 方案 | 用户作业 | 强项 | 代价 |
|------|----------|------|------|
| 酷狗概念版 + [kgcheckin](https://github.com/develop202/kgcheckin) | 手机听、少付钱 | GitHub Actions 自动签到续 VIP | 灰色、账号风险、绑定酷狗 |
| [EchoMusic](https://github.com/hoowhoami/EchoMusic) | 桌面要一个更好用的官方壳 | 酷狗数据、歌单导入、EQ/识曲/评论/插件、跨平台 | 本质仍是单厂第三方客户端 |
| YouTube Music | 要海外、现场、翻唱、冷门 | 合法大曲库 | 国内版权/网络、没有 Lyra 那种舞台 |
| [i.webos.im](https://i.webos.im/) | 打开浏览器就能搜、听、下 | 零安装、门户首页、扫码同步汽水 | 扒站/无损话术、无歌词舞台 |
| music.411081.xyz | 同上，换一个网页站 | 浏览器即用 | 和 webos 同一类，没有新身份 |

EchoMusic 的完成度值得尊重：桌面布局、歌单从网易/QQ/汽水/Spotify 导入、逐字歌词、桌面歌词、均衡器、系统媒体键、插件。它赢在「酷狗桌面客户端可以不那么难用」。Lyra 不该做成第二个 EchoMusic。

## Lyra 站哪

一句话：**给愿意装桌面端的人，把「正在听」做成可看、可推流的舞台；曲库用多源接入，不靠白嫖会员。**

| 作业 | 这五家 | Lyra |
|------|--------|------|
| 不想装客户端 | webos / 411081 | 不主打；Web 是附带 |
| 白嫖 VIP / 免费无损 | kgcheckin、网页站 | **明确不做** |
| 只要酷狗更好用 | EchoMusic | 不跟单源套壳 |
| 海外/现场/翻唱 | YouTube Music | **当音源**，不当替代品 |
| 听的时候要看歌词和氛围 | 五家都弱 | **主场** |
| 推流 / OBS / 舞台 API | 没有 | **已有** |
| 多源搜 + 自己的歌单 | EchoMusic 能导入歌单；网页站能搜 | 搜索优先 + 登录后货架，继续这条 |

## 学 / 不学

**可学气质（不换身份）**

- EchoMusic：桌面完成度（设备输出、媒体键、识曲）可作为 P2 对照，不搬酷狗绑定和插件市场。
- YouTube Music：继续当合法海外源，发现页不要装成 YTM 克隆。
- i.webos：门户密度已经按登录后货架在借；游客搜索优先不动。

**拒绝**

- kgcheckin 式自动签到、VIP 绕过。
- 网页站的无损下载、聚合扒站作为产品话术。
- 把自己定位成「酷狗/网易的更好官方客户端」。
- 为了进这张清单，把舞台让给传统底栏或零安装门户。

## Sources

- 用户提供的听歌方案清单截图（2026-08-31）
- https://github.com/hoowhoami/EchoMusic
- https://github.com/develop202/kgcheckin（清单所述签到项目）
- https://i.webos.im/
- https://music.youtube.com
- Lyra: `docs/product-capability-summary.md`、`docs/research/2026-08-31-imusic-webos-homepage.md`
