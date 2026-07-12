# 歌词特效包（Lyric Effect Packs）

## Goal

把歌词表现拆成三层，互不绑死：

1. **走位**（现有 visualizer）：只管布局/舞台，原有走位不改行为语义。
2. **样式**：字体是字体，颜色是颜色，各自独立选择。
3. **歌词特效**：用「特效包」一键套一组动效参数；不叫走位。

「野火」走位只保留大字报单行砸脸布局；红墨、书法、双重叠字从走位里拆出。

## Locked decisions

| Item | Choice |
|------|--------|
| 野火归属 | **已从走位移除**：大字布局不再作为 visualizer mode；「野火感」保留在歌词特效包 |
| 特效选择 | **3**：特效包（preset packs），单选 |
| 字体 / 颜色 | 全局独立设置；特效包不绑死 |
| 建议搭配 | 可选「一键填入建议字体+颜色」，填完后仍可单独改 |
| 原有走位 | classic / monet / cadenza / … 布局逻辑不因本功能改写 |

## Three layers

| Layer | User-facing name | What it controls | Storage |
|-------|------------------|------------------|---------|
| 走位 | 歌词走位 / visualizer mode | 舞台布局、行数、轨道结构 | `visualizerMode`（既有） |
| 样式 | 字体预设 / 颜色预设 | `fontFamily`、主题歌词色 | `lyricFontPresetId`、lyric color preset（既有） |
| 歌词特效 | 特效包 | 双重叠字、霓虹、故障等表现手法 | **新增** `lyricEffectPackId` |

## 野火走位收束

模式 id 仍为 `dazibao`（兼容已存配置）；用户可见名保持「野火 / Wildfire」。

**保留**

- 单行英雄字居中
- 行入场缩放砸脸
- 词级 punch 缩放（基础动效，属布局节奏的一部分）

**移出走位（改由样式 / 特效包提供）**

- 强制 `YEHUO_INK` 颜色 → 用全局歌词颜色 / 主题色
- 强制 `yehuo-brush` 字体 → 用全局 `lyricFontPresetId`
- 双重叠字 echo/face → 纳入特效包 `yehuo`

## 特效包

### Pack ids（v1）

| Id | Label | Effect contents |
|----|-------|-----------------|
| `none` | 无 | 无附加特效（默认） |
| `yehuo` | 野火感 | 双重叠字（暗底放大 + 亮面）+ 强描边/光晕 |
| `neon` | 霓虹感 | 外发光 + 扫光（CSS / 轻量动画） |
| `glitch` | 故障感 | 短促抖动 + RGB 错位 |

单选：同一时刻只有一个 `lyricEffectPackId`。

### Suggested style pairing（optional UX）

每个包可声明建议搭配，**不自动覆盖**样式：

| Pack | Suggested font | Suggested color preset |
|------|----------------|------------------------|
| `yehuo` | `yehuo-brush` | `dazibao-red` |
| `neon` | （可空或后续定） | （可空） |
| `glitch` | （可空） | （可空） |

UI 提供「应用建议搭配」按钮：写入字体/颜色预设；之后用户仍可单独改字体或颜色。

### Intensity

复用既有 `visualEffectIntensity`（subtle / normal / strong / extreme）缩放包内参数（光晕半径、echo scale、抖动幅度等）。不另开一套强度枚举。

## Runtime

1. Store 暴露 `lyricEffectPackId` + `handleSetLyricEffectPackId`。
2. 歌词渲染路径读取 pack，解析为结构化 effect config（echo、glow、glitch、scan 等开关与数值）。
3. **接好的走位**应用 config；未接线的走位降级为视觉 `none`，不切换 `visualizerMode`。
4. v1 接线优先级：`dazibao`（野火）→ classic → monet；其余走位可后续补。

性能约束（对齐 frontend-runtime-guardrails）：

- 特效用 CSS / Framer Motion / 静态双层 DOM，不引入逐帧 React time state
- 离散状态仍用 `waiting | active | passed`

## Settings / integration

- Controls 面板 + 浮动菜单：新增「歌词特效」单选（与字体、颜色分区并列）
- 视觉配置导入导出：`lyricEffectPackId` 进入 Appearance shortcode / JSON
- Command palette：切换特效包命令（中英 + 拼音关键词）
- i18n：`ui.lyricEffectPack.*` / command titles

## UI copy

- 走位网格：继续叫走位 / 歌词样式（现有命名可保留）
- 新控件文案：**歌词特效**（不要叫「新走位」）
- 野火走位说明可注明：「仅大字布局；颜色与字体请在样式中选」

## Non-goals（v1）

- 多选叠加多个特效包
- 把霓虹/故障做成新 visualizer mode
- 改写 classic / monet 等原有布局算法
- 特效包自动强制改字体/颜色
- WebGL 文字 / 粒子爆炸类重特效

## Migration

- 已选 `visualizerMode: dazibao` 的用户：保留走位；若本地没有 `lyricEffectPackId`，默认 `none`（不偷偷打开野火感，避免突然改观感）
- 可选后续：若检测到用户从未改过字体且仍在野火走位，首次升级提示「可选用野火感特效 + 野火笔锋/野火红」——非必须

## Success criteria

1. 切换字体或颜色时，任意走位 + 任意特效包立即跟从，无需换走位。
2. 野火走位在 `lyricEffectPackId = none` 时不再强制红/书法/双重叠字。
3. 选「野火感」后，在已接线走位上出现双重叠字等包内效果。
4. 原有走位列表与行为不被本功能替换或重命名为特效。
