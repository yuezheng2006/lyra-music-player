# Lyra 技术与开发说明

这份文档收纳仓库 README 中较细的部署、开发、桌面端和技术栈说明。更完整的使用指南也可以访问专门的文档站点：

- [Lyra Guide](https://folia-site.vercel.app/guide/)
- [Stage API 文档](../test/manual/stage-client/README.md)

## 桌面端说明

桌面版内置前后端运行环境，适合希望即装即用的用户。最新版本请前往 [Releases 页面](https://github.com/chthollyphile/folia-major/releases)。

### Linux 获取方式

1. Arch Linux / Manjaro：通过 AUR 安装 `folia-major-bin`

```bash
yay -S folia-major-bin
```

2. Debian / Ubuntu / Linux Mint：下载 `.deb`
3. Fedora / RHEL / openSUSE：下载 `.rpm`
4. 其他发行版：下载 `tar.gz`，解压后直接运行 `folia-major`

`tar.gz` 包中附带图标与 `.desktop` 模板，可按需手动创建桌面启动项。

### Hyprland / Wayland 遥控窗

桌面端的外部遥控窗会作为主窗口的伴随窗口打开，并使用稳定窗口标题 `Lyra Remote`。在 Hyprland 下，如果希望它以悬浮小窗方式出现，可以在 `hyprland.conf` 中添加类似规则：

```ini
windowrule {
  name = folia-remote
  float = on
  size = 520 315
  center = on
  pin = on
  no_blur = on
  border_size = 0
  no_shadow = on
  match:class = ^(folia-major)$
  match:title = ^(Lyra Remote)$
}

```

不同打包方式下窗口 `class` 可能不同；如果规则没有生效，可以用 `hyprctl clients` 查看实际 `class` / `title` 后再调整匹配条件。

## 部署与开发

### 后端 API

本项目依赖 [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced) 提供音乐相关后端服务。

如果使用前端版本的话，需要先自行部署该 API 服务。

### QQ / 汽水音乐 Provider Sidecar

QQ 音乐和汽水音乐通过本地 sidecar 接入。推荐实现方式是 JS adapter module：把开源 extractor 中稳定的解析逻辑移植或封装成 `search` / `audio` / `lyrics` 三个函数。CLI 调用只作为本地调试和兜底，不作为主要运行路径。

当前内置能力：

- QQ 音乐：支持关键词搜索、登录 Cookie 模式下获取播放 URL，以及 QQ 歌词获取。播放 URL 按登录模式处理，必须在“账号面板 -> QQ 音乐 -> 配置”或“选项 -> 集成设置 -> QQ Music Account”填入包含 `qm_keyst` / `qqmusic_key` / `music_key` / `wxskey` 等有效票据的 QQ 音乐 Cookie；请求会自动带上 Cookie、UIN、`authst` 和稳定 GUID。
- 汽水音乐：支持解析 `https://qishui.douyin.com/s/...` 分享链接并获取播放 URL；暂不支持关键词搜索曲库。

本地 Web / Electron 开发时，`npm run dev:web` 与 `npm run dev:electron` 会同时启动：

- 网易云 API：默认 `127.0.0.1:3001`
- Music provider sidecar：默认 `127.0.0.1:3002`
- Vite：默认 `127.0.0.1:3000`

打包后的桌面端会在 Electron 主进程中自动启动网易云 API 与 sidecar，并通过动态端口暴露给前端。

Sidecar 支持以下环境变量：

| 变量名 | 说明 |
| --- | --- |
| `MUSIC_PROVIDER_QQ_ADAPTER` | QQ JS adapter module 路径 |
| `MUSIC_PROVIDER_QISHUI_ADAPTER` | 汽水 JS adapter module 路径 |
| `MUSIC_PROVIDER_ADAPTER` | 通用 fallback JS adapter module 路径 |
| `MUSIC_PROVIDER_QQ_SEARCH_CMD` | QQ 搜索 extractor 命令 |
| `MUSIC_PROVIDER_QQ_AUDIO_CMD` | QQ 播放 URL extractor 命令 |
| `MUSIC_PROVIDER_QQ_LYRICS_CMD` | QQ 歌词 extractor 命令 |
| `MUSIC_PROVIDER_QISHUI_SEARCH_CMD` | 汽水搜索 extractor 命令 |
| `MUSIC_PROVIDER_QISHUI_AUDIO_CMD` | 汽水播放 URL extractor 命令 |
| `MUSIC_PROVIDER_QISHUI_LYRICS_CMD` | 汽水歌词 extractor 命令 |
| `MUSIC_PROVIDER_EXTRACTOR_CMD` | 通用 fallback extractor 命令 |
| `MUSIC_PROVIDER_SIDECAR_PORT` | sidecar 监听端口，默认 `3002` |

Adapter module 参考 `scripts/music-provider-adapters/example-provider-adapter.mjs`。模块需要导出：

```js
export async function search(payload) {}
export async function audio(payload) {}
export async function lyrics(payload) {}
```

CLI fallback 命令从 stdin 读取 JSON：

```json
{
  "provider": "qishui",
  "action": "search",
  "query": "关键词",
  "limit": 30,
  "offset": 0
}
```

搜索结果输出：

```json
{
  "songs": [
    {
      "id": "source-song-id",
      "title": "Song title",
      "artists": ["Artist"],
      "album": "Album",
      "durationMs": 180000,
      "coverUrl": "https://example.com/cover.jpg"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

播放 URL 输出：

```json
{
  "audioUrl": "https://example.com/audio.m4a"
}
```

歌词输出：

```json
{
  "lyrics": {
    "lines": []
  }
}
```

### AI 能力

Lyra 当前支持以下两类 AI 提供方式：

- Google Gemini
- OpenAI 兼容 API，例如 DeepSeek、ChatGPT 接口等

Gemini 通常更适合当前项目场景，因为 JSON 输出相对稳定。

### Stage API

Lyra 提供了从外部与播放器进行交互的 Stage API，从而可以实现外部程序与播放器的深度集成。可以通过 `npm run stage:client` 启动本地联调台，查看和测试这些接口的功能。

具体可参考 [Stage API 文档](../test/manual/stage-client/README.md)。

### 一键部署到 Vercel

如果你希望快速上线 Web 版本，可以直接通过下方入口创建 Vercel 项目：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chthollyphile/folia-major)

部署完成后，请在 Vercel 项目设置中补齐环境变量。

### 本地开发

推荐使用 `vercel dev`，这样本地环境会更接近线上部署行为。

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
cp .env.example .env.local
```

如果你已经在 Vercel 中配置过环境变量，也可以直接拉取：

```bash
vercel env pull .env.local
```

然后按需填写以下变量：

| 变量名 | 描述 | 是否必需 |
| --- | --- | --- |
| `VITE_NETEASE_API_BASE` | 网易云音乐 API 实例地址 | 是 |
| `VITE_MUSIC_PROVIDER_API_BASE` | QQ / 汽水 provider sidecar 地址；本地默认 `http://127.0.0.1:3002` | 否 |
| `VITE_AI_PROVIDER` | AI 提供商，`google` 或 `openai` | 是 |
| `GEMINI_API_KEY` | Gemini API Key | 使用 Gemini 时需要 |
| `OPENAI_API_KEY` | OpenAI 兼容 API Key | 使用 OpenAI兼容接口 时需要 |
| `OPENAI_API_URL` | OpenAI 兼容接口地址，可填 base URL 或完整 `chat/completions` 地址 | 使用 OpenAI兼容接口 时需要 |
| `OPENAI_API_MODEL` | 模型名，例如 `gpt-4o`、`gpt-4.1-mini`、`deepseek-v4-flash` | 使用 OpenAI兼容接口 时需要 |

Gemini 示例：

```env
VITE_NETEASE_API_BASE=http://localhost:3000
VITE_AI_PROVIDER=google
GEMINI_API_KEY=your_google_gemini_api_key
```

OpenAI 兼容接口示例：

```env
VITE_NETEASE_API_BASE=http://localhost:3000
VITE_AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_API_URL=https://api.deepseek.com
OPENAI_API_MODEL=deepseek-v4-flash
```

如果你使用的是 OpenAI 官方接口，也可以这样写：

```env
VITE_NETEASE_API_BASE=http://localhost:3000
VITE_AI_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_MODEL=gpt-4o
```

#### 3. 启动开发环境

```bash
vercel dev
```

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run dev:web` | 启动网易云 API、music provider sidecar 和 Vite |
| `npm run dev:music-provider` | 只启动 QQ / 汽水 provider sidecar |
| `npm run build` | 构建 Web 版本 |
| `npm run preview` | 预览构建结果 |
| `npm run dev:electron` | 启动网易云 API、music provider sidecar、Vite 和 Electron 开发模式 |
| `npm run dev:electron:dist` | 构建后以桌面模式运行 |
| `npm run build:electron` | 打包桌面端应用 |
| `npm run stage:client` | 打开本地 Stage API 联调台 |

## 代码速查地图

| 需求 | 优先入口 |
| --- | --- |
| App 顶层装配、overlay、dialog、播放器面板参数组装 | `src/components/app/*` |
| 设置中心 UI | `src/components/modal/settings/*` |
| 设置持久化、visualizer tuning、偏好 store | `src/stores/useSettingsUiStore.ts` |
| 命令面板命令 | `src/components/command-palette/commandRegistry.ts` |
| visualizer 共享契约和注册 | `src/components/visualizer/definition.ts`、`src/components/visualizer/registry.tsx` |
| visualizer 预览和设置面板 | `src/components/visualizer/VisPlayground.tsx`、`src/components/visualizer/VisPlaygroundSettingsPanel.tsx` |
| visualizer 模式实现 | `src/components/visualizer/<mode>/*` |
| 智能氛围引擎（本地节拍，非 LLM） | `src/hooks/atmosphere/*`、`src/utils/atmosphere/*` |
| AI 主题配色 | `src/services/gemini.ts`、`src/hooks/useThemeController.ts` |
| AI 主题 → 氛围参数桥 | `src/hooks/useAtmosphereThemeBridge.ts`、`src/utils/atmosphere/deriveAtmosphereThemeHints.ts` |
| 歌词解析和渲染提示 | `src/utils/lyrics/*` |
| 本地音乐、Navidrome、网易云服务 | `src/services/*` |
| 共享类型和默认 tuning | `src/types.ts` |

## 智能氛围与 AI 边界

- **智能氛围**（`enableSmartAtmosphere`）是本地音频分析：实时频谱节拍、可选离线 BeatMap、mood / cinemaScale、cameraPunch。UI 上的「节拍 / 低频 / 镜头」是驱动信号标签，不是 AI，也不是摄像头。
- **AI 主题**走 Gemini / OpenAI，只生成亮暗双主题配色；应用主题时可通过 `atmosphereHints` 推荐 `visualPreset`、`atmosphereSensitivity`、`cameraPunchStrength` 等，再写入 `interactive3dSceneTuning`。
- 氛围灵敏度与镜头强度字段：`Interactive3dSceneTuning.atmosphereSensitivity` / `cameraPunchStrength`，随视觉配置导入导出（`interactive3dSceneTuning` / `i3st`）。

新增设置时遵守项目 skill：视觉相关设置需要进入外观页的配置导入导出；功能性设置和可执行动作需要注册到 command palette。

## 技术栈

- [NeteaseCloudMusicApiEnhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)
- React 19
- Vite 6
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Electron
- i18next
