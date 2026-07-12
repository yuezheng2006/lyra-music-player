<p align="center">
  <img src="/img/head2.png" alt="Lyra" width="100%" />
</p>

<div align="center">

# Lyra（音波）

Sound, Stage, Sense // 声随境转

[![GitHub release](https://img.shields.io/github/v/release/yuezheng2006/lyra-music-player?label=release)](https://github.com/yuezheng2006/lyra-music-player/releases)
[![License](https://img.shields.io/github/license/yuezheng2006/lyra-music-player)](https://github.com/yuezheng2006/lyra-music-player/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yuezheng2006/lyra-music-player?style=social)](https://github.com/yuezheng2006/lyra-music-player/stargazers)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-21-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

[桌面版下载](https://github.com/yuezheng2006/lyra-music-player/releases/tag/v1.0.2)
·
[技术说明](docs/technical.md)
·
[macOS 安装注意](docs/desktop/macos-app-damaged.md)

</div>

## 项目简介

听歌不再只是听歌——多平台曲库汇进同一座 3D 歌词舞台，像在看文字 PV。

Lyra（音波）是面向桌面端的沉浸式歌词音乐播放器。当前可连接网易云、QQ 音乐、Coco 聚合搜索、Navidrome 等来源，在同一套全屏歌词 / 3D 舞台中播放。

推荐直接使用 Electron 桌面版（Windows / macOS）。

## 能力状态（请按此理解仓库）

| 状态 | 能力 |
| --- | --- |
| **已可用** | 全屏歌词动画、多主题舞台、3D 交互背景；网易云 / QQ 音乐 / Coco / Navidrome 多源播放；本地曲库导入；桌面端安装包 |
| **支持中** | 本地歌智能匹配（补歌词 / 封面）；AI 情绪主题配色（需配置模型 Key） |
| **计划开放中** | 统一舞台纳入 |

说明：

- **智能氛围**（节拍 / 低频 / 镜头）是本地音频分析，不是 LLM。
- **AI 主题配色**依赖 Gemini / OpenAI，需自行配置；未配置时不影响基础播放与视觉主题切换。
- Coco 为公开聚合搜索通道，上游偶发空结果，属已知波动。

## 展示

### 截图

#### 多源连接与搜索

![多源连接](/img/screenshots/home-multisource-connect.png)

![多源搜索](/img/screenshots/search-multisource.png)

#### 沉浸播放页

![播放页歌词](/img/screenshots/player-lyric-gejian.png)

![点阵视觉](/img/screenshots/player-lyric-peini.png)

#### 多主题歌词舞台

![浮名](/img/screenshots/theme-fume-lyrics.png)

![流光](/img/screenshots/theme-lumi-lyrics.png)

![群唱](/img/screenshots/theme-cappella-chat.png)

### 演示视频

演示视频待补。桌面安装包见 [Releases v1.0.2](https://github.com/yuezheng2006/lyra-music-player/releases/tag/v1.0.2)。

## 桌面端下载

| 平台 | 文件 |
| --- | --- |
| macOS Apple Silicon | [Lyra-1.0.2-arm64.dmg](https://github.com/yuezheng2006/lyra-music-player/releases/download/v1.0.2/Lyra-1.0.2-arm64.dmg) |
| macOS Intel | [Lyra-1.0.2-x64.dmg](https://github.com/yuezheng2006/lyra-music-player/releases/download/v1.0.2/Lyra-1.0.2-x64.dmg) |
| Windows | [Lyra-Setup-1.0.2.exe](https://github.com/yuezheng2006/lyra-music-player/releases/download/v1.0.2/Lyra-Setup-1.0.2.exe) |

macOS 若提示「应用已损坏」：把 app 拖到 Applications 后执行：

```bash
xattr -dr com.apple.quarantine /Applications/Lyra.app
```

详见 [macOS 安装说明](docs/desktop/macos-app-damaged.md)。

## 文档

| 文档 | 用途 |
| --- | --- |
| [docs/technical.md](docs/technical.md) | 开发、环境变量、Stage API、技术栈 |
| [docs/desktop/macos-app-damaged.md](docs/desktop/macos-app-damaged.md) | macOS Gatekeeper / 未签名包处理 |
| [src/README.md](src/README.md) | 前端模块边界 |
| [docs/hackathon/](docs/hackathon/) | Hackathon 过程材料（非产品说明，可忽略） |

## 开发

```bash
npm install
npm run dev:electron   # 桌面开发
npm run lint
npm test
```

### 本机 mac release 自测

`dev:electron` 走 Vite；发版前请用 release 同构闸门：

```bash
npm run verify:electron:dist   # L1：file:// + 内置 API（日常）
npm run verify:mac:packaged    # L2：本机 arch 真包 + 安装后冒烟（发版前）
# 可选：VERIFY_INSTALL_APPLICATIONS=1 npm run verify:mac:packaged
```

`npm run test:electron-smoke` 只测 dev 壳，不能替代上面两条。

更多脚本与环境变量见 [技术说明](docs/technical.md)。

## 贡献者

Thanks goes to these wonderful people. Issue reports, bug reports, ideas, docs, design, tests, and code are all counted through the [all-contributors](https://allcontributors.org/) spec.

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yuezheng2006"><img src="https://avatars.githubusercontent.com/u/30263107?v=4?s=100" width="100px;" alt="冬霧"/><br /><sub><b>冬霧</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/commits?author=yuezheng2006" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ZhaoAlpha931206"><img src="https://avatars.githubusercontent.com/u/113200713?v=4?s=100" width="100px;" alt="zhao_alpha"/><br /><sub><b>zhao_alpha</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3AZhaoAlpha931206" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hz1ang"><img src="https://avatars.githubusercontent.com/u/79741472?v=4?s=100" width="100px;" alt="hz1ang"/><br /><sub><b>hz1ang</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Ahz1ang" title="Bug reports">🐛</a> <a href="#ideas-hz1ang" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/steadyoak"><img src="https://avatars.githubusercontent.com/u/62462010?v=4?s=100" width="100px;" alt="steadyoak"/><br /><sub><b>steadyoak</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Asteadyoak" title="Bug reports">🐛</a> <a href="#ideas-steadyoak" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jin6yang"><img src="https://avatars.githubusercontent.com/u/68692517?v=4?s=100" width="100px;" alt="POINTER"/><br /><sub><b>POINTER</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Ajin6yang" title="Bug reports">🐛</a> <a href="#ideas-jin6yang" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Yuki-3939"><img src="https://avatars.githubusercontent.com/u/171513605?v=4?s=100" width="100px;" alt="Yuki-3939"/><br /><sub><b>Yuki-3939</b></sub></a><br /><a href="#ideas-Yuki-3939" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MewsCat-Dev"><img src="https://avatars.githubusercontent.com/u/207451147?v=4?s=100" width="100px;" alt="MewsCat"/><br /><sub><b>MewsCat</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3AMewsCat-Dev" title="Bug reports">🐛</a> <a href="#ideas-MewsCat-Dev" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://afdian.com/a/tumuyan"><img src="https://avatars.githubusercontent.com/u/3126801?v=4?s=100" width="100px;" alt="tumuyan"/><br /><sub><b>tumuyan</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Atumuyan" title="Bug reports">🐛</a> <a href="#ideas-tumuyan" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/yuezheng2006/lyra-music-player/commits?author=tumuyan" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/948720857"><img src="https://avatars.githubusercontent.com/u/23718388?v=4?s=100" width="100px;" alt="948720857"/><br /><sub><b>948720857</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3A948720857" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/setube"><img src="https://avatars.githubusercontent.com/u/73606411?v=4?s=100" width="100px;" alt="谦君"/><br /><sub><b>谦君</b></sub></a><br /><a href="#ideas-setube" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/suheandzl"><img src="https://avatars.githubusercontent.com/u/3975134?v=4?s=100" width="100px;" alt="suheandzl"/><br /><sub><b>suheandzl</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Asuheandzl" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Enkianssus"><img src="https://avatars.githubusercontent.com/u/69905090?v=4?s=100" width="100px;" alt="Enkianssus"/><br /><sub><b>Enkianssus</b></sub></a><br /><a href="#ideas-Enkianssus" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pwupink"><img src="https://avatars.githubusercontent.com/u/122716454?v=4?s=100" width="100px;" alt="不会飞的麻将"/><br /><sub><b>不会飞的麻将</b></sub></a><br /><a href="#ideas-pwupink" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/streamstack-cn"><img src="https://avatars.githubusercontent.com/u/270505056?v=4?s=100" width="100px;" alt="streamstack-cn"/><br /><sub><b>streamstack-cn</b></sub></a><br /><a href="#ideas-streamstack-cn" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bywhite0"><img src="https://avatars.githubusercontent.com/u/86943191?v=4?s=100" width="100px;" alt="白影White"/><br /><sub><b>白影White</b></sub></a><br /><a href="#ideas-bywhite0" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/IXnAh1L"><img src="https://avatars.githubusercontent.com/u/298766825?v=4?s=100" width="100px;" alt="IXnAh1L"/><br /><sub><b>IXnAh1L</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3AIXnAh1L" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://chatwise.app"><img src="https://avatars.githubusercontent.com/u/8784712?v=4?s=100" width="100px;" alt="EGOIST"/><br /><sub><b>EGOIST</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Aegoist" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.yanfd.cn"><img src="https://avatars.githubusercontent.com/u/70418161?v=4?s=100" width="100px;" alt="yanfd"/><br /><sub><b>yanfd</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3Ayanfd" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://tonysmith.vercel.app/"><img src="https://avatars.githubusercontent.com/u/108202013?v=4?s=100" width="100px;" alt="Tony Smith"/><br /><sub><b>Tony Smith</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/commits?author=tonysmith1sme" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/z962432526-commits"><img src="https://avatars.githubusercontent.com/u/299800478?v=4?s=100" width="100px;" alt="z962432526-commits"/><br /><sub><b>z962432526-commits</b></sub></a><br /><a href="#ideas-z962432526-commits" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AndyRose806"><img src="https://avatars.githubusercontent.com/u/74594311?v=4?s=100" width="100px;" alt="AndyRose806"/><br /><sub><b>AndyRose806</b></sub></a><br /><a href="https://github.com/yuezheng2006/lyra-music-player/issues?q=author%3AAndyRose806" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## 法律与免责声明

本项目在 AI 的广泛协助下开发，因此仍可能存在细微或不易察觉的问题。若给你带来不便，敬请理解。

本项目主要用于展示播放动效、界面设计与相关工程实现。应用中涉及的在线音乐流媒体、歌词、专辑封面及其他内容，其版权均归对应权利人所有。

本仓库及其源代码仅供个人学习、技术交流与非营利测试使用。请勿将其用于商业盈利用途。若因对在线资源的传播、加工或再分发而引发版权纠纷或其他责任，均由使用者自行承担，项目开发者不承担相关责任。

请始终尊重数字版权，并在条件允许时通过官方平台支持正版音乐。

## 致谢

特别感谢以下项目和资源：

- [chenmozhijin/LDDC](https://github.com/chenmozhijin/LDDC)
- [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)
- [chenglou/pretext](https://github.com/chenglou/pretext)

本项目接入了 [Apple Music-like Lyrics TTML 逐词歌词库](https://github.com/amll-dev/amll-ttml-db) 以提供高质量的歌词文件，感谢此歌词库的作者和贡献者们。

## 许可证

本项目基于 `AGPL-3.0` 许可证开源。
