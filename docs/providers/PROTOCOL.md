# Music Provider Protocol v1

Lyra 的 sidecar 在线源走统一插件协议。官方 curated adapter（QQ / 汽水 / Coco / 酷狗 / B 站 / 酷我）与用户本地插件使用同一契约。

**不做**：WASM 市场、远程自动安装、把网易云 / Navidrome / YouTube Music / 本地文件插件化。

## 目录布局

每个 provider 一个文件夹，文件夹名必须等于 `manifest.id`：

```text
{id}/
  provider.manifest.json
  adapter.mjs
```

### 发现路径（优先级从高到低）

1. 环境变量 `MUSIC_PROVIDER_{ID}_ADAPTER`（开发调试）
2. 用户开放模式目录：
   - Electron：`{userData}/music-providers/{id}/`
   - 独立 sidecar：`~/.lyra/music-providers/{id}/`（可用 `MUSIC_PROVIDER_USER_PLUGINS_DIR` 覆盖）
3. 仓库内置：`scripts/music-provider-adapters/`（legacy 单文件 + 可选 `{id}/provider.manifest.json`）

模板目录 `scripts/music-provider-adapters/example/` **不会**被自动加载。复制后改名再安装。

## Manifest

```json
{
  "id": "demo-echo",
  "name": "Demo Echo",
  "version": "1.0.0",
  "protocolVersion": 1,
  "capabilities": ["search", "audio", "lyrics"],
  "auth": "none",
  "entry": "adapter.mjs",
  "ui": {
    "label": "Demo Echo",
    "accent": "#64748B"
  }
}
```

| 字段 | 要求 |
|------|------|
| `id` | `^[a-z][a-z0-9-]{1,31}$` |
| `name` / `version` | 非空字符串 |
| `protocolVersion` | 必须为 `1` |
| `capabilities` | 至少包含 `search` 与 `audio`；可选 `lyrics`、`recommend` |
| `auth` | `none`（默认）或 `cookie-header` |
| `entry` | 相对路径，默认 `adapter.mjs`，禁止 `..` |
| `ui.label` / `ui.labelKey` / `ui.accent` | 可选 |

### 保留 id

用户插件不得使用：

- 一等公民：`netease`、`navidrome`、`ytm`、`ytmusic`、`local`、`stage`
- 官方 curated：`qq`、`qishui`、`coco`、`kugou`、`bilibili`、`kuwo`

## Adapter API

`adapter.mjs` 导出：

```js
export async function search({ provider, query, limit, offset }) {
  return { songs: [], total: 0, hasMore: false };
}

export async function audio({ provider, id, song, quality }) {
  return { audioUrl: 'https://...', videoUrl: 'https://...' }; // videoUrl 可选
}

export async function lyrics({ provider, id, song }) {
  return { lyricsText: '...', /* 或 */ lyrics: { lines: [] } };
}
```

### Song 字段

`search` 返回的每首歌至少包含稳定 `id`（字符串或数字）。建议：

- `title` / `name`
- `artists`（字符串数组或 `{ name }`）
- `album`、`durationMs`、`coverUrl`

Sidecar / 前端会补 `musicProvider: {id}`。身份建议写作 `{providerId}::{providerSongId}`；运行时至少保证 `musicProvider` + `providerSongId`/`id`。

## HTTP（sidecar）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/providers` | 已加载插件列表 + `userPluginsDir` |
| `POST` | `/providers/reload` | 重新扫描插件目录 |
| `GET` | `/providers/dir` | 仅返回插件目录 |
| `GET` | `/providers/:id/search?q=&limit=&offset=` | 搜索 |
| `POST` | `/providers/:id/song-url` | body: `{ id, song, quality }` |
| `POST` | `/providers/:id/lyrics` | 歌词 |
| `POST` | `/providers/:id/recommend` | 可选推荐 |

`:id` 必须已在 registry 中注册（不再使用硬编码白名单）。

## 开发者接入

1. 复制 `scripts/music-provider-adapters/example/`
2. 将文件夹改名为你的 `id`，改 manifest 与 adapter
3. 校验：`npm run provider:validate -- ./path/to/your-id`
4. 安装到开放模式目录，或在设置页「重新扫描」
5. 成熟后可 PR 进仓库 curated 列表（官方会 code review）

## 信任模型

开放模式插件 = 用户主动安装的本地 Node 模块，权限与官方 adapter 相同。v1 **无沙箱、无签名市场**。只安装你信任的来源。

## 错误码（约定）

- `404` 未知 provider / 无音频 URL
- `405` 方法不允许
- `500` adapter / 传输失败（前端可走恢复逻辑）
