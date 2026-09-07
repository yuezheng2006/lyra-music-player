# 参考仓对照：kgcheckin / 酷狗登录票据

- Date: 2026-09-06
- Scope: [develop202/kgcheckin](https://github.com/develop202/kgcheckin) `main`（2026-09 当前树：`qrcodeLogin.js` / `phoneLogin.js` / `main.js` + 内嵌 [MakcRe/KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi)）
- Method: GitHub `main` 源码 + 对照 Lyra sidecar / 账号面板；Zread wiki 仍停在旧 `master`（`QRcode.js` / `listen.js`），不以 wiki 为准
- Prior: [2026-08-31-listening-landscape-position.md](./2026-08-31-listening-landscape-position.md)、[folia-major-borrow-analysis.md](../folia-major-borrow-analysis.md)（酷狗账号 / VIP / KRM = 只学架构）
- Product policy: **Folia 为主、Mineradio 为辅**；硬筛高性能 / 高B格 / 高氛围 / 高实用。借播放器能力；**不**做自动签到、听歌领 VIP、广告领会员、无损绕过

## Executive summary

kgcheckin 是 GitHub Actions 机器人，不是播放器。它每天用已登录的 `token` + `userid` 调 `/youth/listen/song` 和最多 8 次 `/youth/vip`，给「酷狗概念 VIP」续期。这条路径 [2026-08-31 已定性不做](./2026-08-31-listening-landscape-position.md)。

对 Lyra 有用的是它旁边的登录协议，不是签到循环：

1. 扫码拿 `token` + `userid`（约 2 分钟过期的 QR）
2. Cookie 形态 `token=…; userid=…`
3. 周日 `POST /login/token` 续票据（大约两个月过期一次）
4. 登录后走 tracker `priv_url` 取播链（用户**自己已有**的会员权益）

Lyra 现在的酷狗：**搜索仍免登录**；账号面板内扫 Folia 式官方二维码，加密写入 `token`+`userid`（有则带 `dfid`）；sidecar 取播优先 tracker `/v5/url`，失败回落 `playInfo`；Electron 保留 `fs.*.kugou.com` 的 http 播链。不自动签到或领取概念 VIP。账号卡片外壳跟 Mineradio 统一面板。

**结论：播放器能力跟 Folia；账号面板跟 Mineradio。学登录与会话，不学签到。不要把 `api/` 整包塞进 Electron。**

## Upstream snapshot

| 项 | kgcheckin `main` |
|----|------------------|
| 形态 | Node 脚本 + 内嵌 KuGouMusicApi HTTP 服务 + GitHub Actions |
| 登录 | 二维码（推荐）或手机号验证码 |
| 会话 | Secret `USERINFO`：`[{ userid, token }, …]` |
| 刷新 | 周日 `POST /login/token`；可用 PAT 写回 Secret |
| 签到 | `/youth/listen/song` + `/youth/vip` × 8（间隔 30s） |
| 到期查询 | `GET /user/vip/detail` → `busi_vip[0].vip_end_time` |
| 通知 | 企业微信 / 钉钉 / 飞书 / Telegram / Bark 等（与播放器无关） |
| API 许可 | 内嵌 API 为 MIT（MakcRe）；kgcheckin 本体未另标播放器可用的产品授权 |

二维码：

| 步骤 | 接口 | 含义 |
|------|------|------|
| 取 key | `GET /login/qr/key` | 上游 `login-user.kugou.com/v2/qrcode` |
| 展示 | `https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=` | 酷狗 APP 扫 |
| 轮询 | `GET /login/qr/check?key=` | `0` 过期 / `1` 未扫 / `2` 待确认 / `4` 成功并返回 token |

手机号：`/login/cellphone?mobile=&code=`；`error_code === 34175` 表示一号多账号暂不支持。

已知错误码（README）：`51002` / `20018` 未登录，`130012` 今日已领，`30002` 次数用光。后两个只属于签到，播放器只该认未登录。

## Lyra 现状

| 层 | 现状 |
|----|------|
| Sidecar | `scripts/music-provider-adapters/kugou-provider-adapter.mjs`：无 Cookie，免费 `m.kugou.com/.../playInfo` |
| Provider | `kugouMusicProvider.ts` 只转发 search / audio / lyrics |
| 账号面板 | `UNIFIED_ACCOUNT_PROVIDERS` 里 `kugou` 是 `peer-free`；详情走 `PeerFreeAccountDetail` |
| 会话落盘 | QQ / 汽水已有 `createEncryptedAuthSessionRepository`（`safeStorage`） |
| 登录 UX | 汽水：Electron 隔离 partition 开官方网页扫码 |

对照汽水：汽水借的是官方网页 Cookie；酷狗没有同等稳定的网页登录窗，kgcheckin 走的是 H5 QR + 轮询。若做登录，应跟汽水同一套「桌面弹窗 + 加密落盘 + sidecar 带头」，协议换成 QR key/check，不要再开一套 GitHub Actions。

## 学 / 不学

| 能力 | 处理 | 理由 |
|------|------|------|
| 扫码登录 → `token` + `userid` | **建议吸收（P1）** | 把酷狗从试听源升到「用户自己的账号」；对齐汽水 / QQ |
| 会话加密落盘 + 失效重登 | **建议吸收（P1）** | 复用 `createEncryptedAuthSessionRepository`；`/user/detail` nickname 空视为过期 |
| `POST /login/token` 续期 | **建议吸收（P1）** | 两个月过期；放 sidecar / Electron 启动时，不要 PAT 写 GitHub Secret |
| 登录后 `priv_url` / `song_url_new` | **建议吸收（P1）** | 只服务用户已购/已有会员；失败回落现有 `playInfo` |
| `/user/vip/detail` 做权益提示 | **只学架构（P2）** | 文案「当前账号可播 / 需会员」，不展示「去领 VIP」 |
| 用户歌单 / 每日推荐 / FM | **产品确认后** | KuGouMusicApi 有 `user_playlist` / `recommend_songs` / `personal_fm`；要首页货架才做 |
| `/youth/vip`、`/youth/listen/song` | **明确不做** | 自动刷概念 VIP；账号风险；与定位冲突 |
| GitHub Actions 定时签到 / 仓库保活 / PAT | **明确不做** | 不是播放器功能 |
| 整包 `api/` 当本地酷狗后端 | **不做** | 体积大、android 加密、和 sidecar 三函数契约冲突 |
| 多账号农场、通知机器人 | **不做** | |

## 若做 P1：落点（不在本轮改代码）

1. **会话** — `electron/kugouAuthSessionRepository.cjs` 复用 QQ/汽水 envelope；Cookie 最小集 `token` + `userid`（登录刷新后再加 `vip_token` / `vip_type` 如果 `login_by_token` 返回）。
2. **登录 UI** — 账号面板把 `kugou` 改成 `kind: 'login'`；桌面扫码（生成 QR + 轮询 status 4）；浏览器模式只保留手动 token/userid 粘贴，与汽水 Cookie 兜底同构。
3. **Sidecar** — `kugou-provider-adapter.mjs` 有会话时改走 tracker；无会话或 51002 回落 `playInfo`。不要在渲染进程里复制 AES/RSA 密钥。
4. **命令面板** — 对齐 `qishuiLoginCommands`：扫码 / 退出。
5. **HTTP 播放** — Folia 曾为 kg CDN 保留 http；Lyra Electron 已有媒体 Referer。登录播链若仍是 http，对照 `shared/mediaRequestHeaders.cjs`，Web 继续升 https。

KuGouMusicApi 是 MIT，可摘 `login_qr_key` / `login_qr_check` / `login_token` / `song_url_new` 的协议，保留版权声明。不要把 `youth_*` 带进来。

## 明确不做（重申）

- 把 Lyra 做成酷狗概念版签到器或 EchoMusic 式单厂壳。
- 产品话术里写「自动领 VIP / 免费无损」。
- 为了 VIP 曲去跑广告接口或伪造听歌上报。

## Sources

- https://github.com/develop202/kgcheckin（`main`：`qrcodeLogin.js`、`phoneLogin.js`、`main.js`）
- https://github.com/MakcRe/KuGouMusicApi（kgcheckin `api/` 来源，MIT）
- Lyra: `kugou-provider-adapter.mjs`、`unifiedMusicAccountProviders.ts`、`qishuiAuthLogin.cjs`、`qqAuthSessionRepository.cjs`
- 定位：[2026-08-31-listening-landscape-position.md](./2026-08-31-listening-landscape-position.md)
