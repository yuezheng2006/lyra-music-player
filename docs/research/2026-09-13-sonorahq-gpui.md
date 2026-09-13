# 参考仓：sonorahq/gpui — 可借鉴之处

- Date: 2026-09-13
- Source: [sonorahq/gpui](https://github.com/sonorahq/gpui) master（zip 核对；Apache-2.0，自 Zed GPUI 抽出）
- Method: README + `crates/gpui` / `gpui_wgpu` / `gpui_apple` / `gpui_windows` 源码对照；Zread 无索引
- Product policy: **只借合成思路与性能策略**，不引入 Rust GPUI，不重写 Lyra 前端栈

## Snapshot

| 项 | 事实 |
|---|---|
| 定位 | GPU UI 框架 fork；主卖点是 **layer filter**（子树 blur / edge fade / paint-only scale·translate）+ **backdrop blur** |
| README 卖点 | `text_blur`、`backdrop_blur`、`blur`、`Window::paint_aurora` |
| 树内实装 | `Styled::blur` / `backdrop_blur` / `fade_edges` / `fade_sides` / `layer_scale` / `layer_translate` / `layer_scale_origin`；`Window::paint_backdrop`；Metal / wgpu / DirectX 均有同款路径 |
| README 过时 | **`text_blur`、`paint_aurora` 树内无符号**；README 写「仅 Linux」，实际已带 macOS Metal + Windows DirectX |
| WebGL | `shaders_webgl.wgsl` 明确：**不画 backdrops / layer filters**（stub 保编译） |
| Kill switch | `GPUI_FILTERS=0` 关闭 layer filters（Metal 路径） |

## 结论表

| 优先级 | 借鉴点 | gpui 做法 | Lyra 现状 | 建议 |
|---|---|---|---|---|
| P0 | 少做「叠层现场 blur」 | 同 sigma / 同 filter 的邻接层 **合并成一次 offscreen pass**（一批 backdrop 取最大 sigma，blur 一次多块采样）；小半径全分辨率、大半径走 `[1,2,4]` + ping-pong 可分高斯；滤镜嵌套深度有上限（wgpu `LAYER_DEPTH=4`） | `backdrop-blur` 约 **128 命中 / 58 文件**；常驻热点含 `FloatingPlayerControls`（`blur(24px) saturate…`）；舞台已禁全屏 backdrop（`SpeakerStageShell`）；封面已 downsample（`coverAtmosphereDownsample`） | 热路径（浮动播控 / titlebar / 面板 / 模态）收敛成 **共享模糊底 + 半透明面板** 或 fog，勿层层叠 CSS `backdrop-filter` |
| P0 | 粒子/舞台上方勿 live backdrop | WebGL 直接关掉 filter；native 才开 | 已写死 `backdropBlurPx: 0` + fog/vignette | **保持**；新视觉勿回退成全屏 `backdrop-blur` |
| P1 | 边缘 fade 当合成 mask | `LayerFilter.fade_*` 与 blur 同管道，一次 mask composite | Monet 已有 `mask-image` 线性渐隐，分散在 `MonetLyricsRail` | 抽 **共用 edge-fade helper**（上下/左右预算），别每个模式抄一遍 |
| P1 | 效果总闸 | `GPUI_FILTERS=0` | 已有 `performanceMode` / `qualityTier` / `reducedMotion` / `visualizerStill` | lite / still 时关掉 glass blur 与多余 filter，只留实体色或雾 |
| P1 | paint-only 变换 | `layer_scale` / `layer_translate`：**不改 layout / hitbox**，专给 spring 展示位 | 多数 motion 已用 CSS transform；个别路径仍可能触 layout | 歌词/封面弹簧动画坚持 transform-only；文档化「展示位移 ≠ 命中区」 |
| P2 | 真·GPU 子树 blur | Offscreen `StartFilter` → 可分高斯 → mask | 歌词运动模糊是轻量 CSS `filter: blur`（`lyricMotionClarity` 已限 px） | 仅当要做「整段歌词层一起糊」时再上 canvas/WebGL pass；**不要**为 chrome 去抄整套 compositor |
| — | 字形 atlas 内 blur | README `text_blur` | 无；现有 glyph dilation 偏描边/发光 | **不做**（符号已不存在；P2 若做辉光可自研 canvas atlas，勿等上游） |
| — | `paint_aurora` | README only；`Window::blur` 是**焦点失焦**不是视觉模糊 | Monet/几何着色已有氛围场 | **不跟名号**；色场继续走现有 shader |
| — | 桌面歌词 / OBS「糊真实桌面」 | in-app backdrop 只糊本窗口已画内容 | 透明窗 / browser source / 系统 vibrancy 是另一条路径 | **勿混为一谈**；不要假装 CSS/WebGL backdrop 能糊桌面 |
| — | 迁到 GPUI / Rust | 整框架 | Electron + React + WebGL | **明确不做** |

## 可抄的算法细节（映射到 Web）

1. **半径 → 分辨率阶梯**：`BLUR_STEPS = [1,2,4]`，`sigma ≤ BLUR_REACH * shrink` 时选该档。Lyra 封面氛围已是「缩到 16% → blur 7px → scale 8」；新 blur 应同思路，禁止对 1:1 视口做 live `backdrop-filter`。
2. **可分高斯 + ping-pong**：横纵两次；同 filter 邻接层共用 target（「一列表分别 blur 的行 → 一次 pass」）。映射：多个玻璃卡片共享一张预模糊纹理，或干脆不用 blur 用半透明 + vignette。
3. **Edge fade 与 blur 同层**：避免「先 blur 再套一层 CSS mask」的双重代价时，至少保证 mask 是廉价的 `mask-image`，不要再叠第二层 backdrop。
4. **后端能力降级**：gpui 在 WebGL 直接关 filter。Lyra 应对低端 / lite 同样降级，而不是「CSS 写了就算开了」。

## 与 Folia P1「非翻译歌词模糊」的边界

- Folia：产品开关（非翻译行糊掉）。
- gpui：compositor 能力（子树 / 背景高斯）。
- Lyra：`lyricMotionClarity` 只管运动预算。三者不要混成一个 issue；若做 Folia 开关，优先 opacity + 轻 blur，不要上 GPUI 级 offscreen 管线。

## 明确不做

- 引入 `sonorahq/gpui` 或 Zed GPUI 作为 UI 运行时
- 为实现 aurora / text_blur 去追 README 营销 API
- 在 visualizer 粒子全屏上恢复 CSS `backdrop-filter`
- 把 Metal/HLSL shader 整段 vendor 进仓库（许可可跟，栈不合；大段移植需 Apache-2.0 署名，更推荐重写到现有 WebGL）
- 用 in-app backdrop 假装能糊真实桌面（桌面歌词 / OBS）

## 建议下一刀（若排程）

1. 先盯 `FloatingPlayerControls`：已落地 `resolveFloatingDockGlassStyle`（单层 live / soft / solid；popover 不叠第二层 blur）。
2. 抽 `edgeFadeMask(css)` 共用 helper，先接到 Monet / Classic lyric rail。
3. `performanceMode === 'lite'` / still 时统一关掉其它 chrome glass blur（对齐 `GPUI_FILTERS=0` 语义）。

产品确认后再动：桌面歌词要系统 vibrancy 还是纯自绘；OBS 透明模式是否允许任何 live backdrop-filter（常开默认否更符合标尺）。
