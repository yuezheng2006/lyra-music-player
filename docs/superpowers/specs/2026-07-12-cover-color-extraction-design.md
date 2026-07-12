# 封面取色优化（Color Thief）

## Goal

用 `colorthief` 替换自研中心加权采样，让封面主色更接近「面积占比 + 中等饱和度」的核心色，避免被中心高饱和色块抢走氛围。

典型失败例：多色拼贴封面中央有高饱和黄块时，当前算法把整页主题染成偏黄褐，忽略周边更大面积的中性/冷色内容。

## Locked decisions

| Item | Choice |
|------|--------|
| 方案 | 引入 `colorthief`，保留薄适配层 |
| 对外 API | 不变：`extractColors(imageUrl, count?) => Promise<string[]>` |
| 排序策略 | 面积（proportion）为主，叠加中等饱和与可用亮度偏好 |
| 中心加权 | **取消**；全图量化，不额外抬中心 |
| 边框降权 | **不做**特殊边框检测；依赖面积 + 中等饱和自然制衡 |
| Node `sharp` | **不装**；仅用浏览器侧 API |
| 下游消费 | `coverShellTheme` / `buildBuiltinDualTheme` / remote / ThemeQuickEditor 接口不改 |

## Architecture

```
cover URL
  → load image (Electron proxy / direct)
  → colorthief getPalette (OKLCH)
  → rankCoverPalette (area + moderate saturation)
  → hex[] (length = count)
  → existing theme / shell consumers
```

`extractColors` 继续负责：

- TTL 缓存与 pending 去重
- Electron `fetchCoverViaProxy` CORS 安全加载
- 失败时返回 `[]`

量化与排序逻辑从入口文件拆出，避免 `colorExtractor.ts` 继续堆实现。

## Extraction pipeline

1. 加载 `HTMLImageElement`（与现网一致，含 proxy blob URL 释放）。
2. 调用：

   ```ts
   getPalette(img, {
     colorCount: Math.max(count, 8),
     colorSpace: 'oklch',
     quality: 5,
     ignoreWhite: true,
   })
   ```

3. 对 palette 中每个 `Color` 计算 score，降序排序。
4. 取前 `count` 个，输出 `color.hex()`。

### Score（面积 + 中等饱和）

对每个候选色：

- **面积权重**：`proportion`（若不可用则用 `population` 归一化）。
- **饱和偏好**：峰值约 HSV / 等价饱和度 **0.35–0.55**；过灰与过冲降权。
- **亮度偏好**：约 **20%–75%** 相对亮度区间；纯黑 / 死白降权。
- **不**再按几何中心加权。

最终：

`score ≈ proportion × satFactor × lightFactor`

### Fallbacks

| Case | Behavior |
|------|----------|
| 图片加载失败 / palette `null` / 空 | 返回 `[]` |
| 全部低饱和 | 仍按面积排序返回；下游 `pickDominantCoverColor` 自行兜底 |
| colorthief 抛错 | catch 后返回 `[]`，并 `console.warn` |

## File plan

| File | Role |
|------|------|
| `src/utils/colorExtractor.ts` | 入口、缓存、proxy、调用 palette + rank |
| `src/utils/coverPaletteScore.ts` | 纯函数：`scoreCoverPaletteColor`、`rankCoverPalette` |
| `package.json` | 新增依赖 `colorthief` |

不改 `coverShellTheme.ts` 与 theme 组装逻辑，除非实现中发现 `colors[0]` 语义与 score 排序不一致需要最小对齐（默认不需要）。

## Testing

Vitest（纯逻辑优先）：

1. **打分**：高饱和、低 proportion 的色块，score 低于「中等饱和 + 更高 proportion」。
2. **排序**：`rankCoverPalette` 输出长度 = `count`，且第一色为最高 score。
3. **hex 格式**：结果为 `#rrggbb`。

不强制 Playwright 截图。实现后用拼贴类封面手动目视确认：主题色不应再被中央黄块单独主导。

## Non-goals

- 不引入 `node-vibrant` 或双库并存。
- 不做边框 / ROI 检测。
- 不改 AI 主题生成路径，仅影响 `extractColors` 输出质量。
- 不把取色搬进 Web Worker（首版）；若切歌卡顿再评估 `worker: true`。

## Success criteria

- 多色拼贴封面：`coverColors[0]` 更接近整体主体色，而非仅中心高饱和色。
- 单色 / 低饱和封面：仍能给出可用主色，不回退为空白主题。
- 现有调用方零改动即可受益。
