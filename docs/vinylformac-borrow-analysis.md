# vinylformac → Lyra 可迁移分析（3D / 唱盘背景）

> 日期：2026-07-29  
> 参考仓：`temp/vinylformac` @ `f6cb049`（[shhivv/vinylformac](https://github.com/shhivv/vinylformac)）  
> 产品仓：happy-player / Lyra  
> 许可：**代码 SPDX 为 NOASSERTION / Other（GitHub 未声明开源许可）**；材质贴图均为 **CC0**。移植时优先**重写算法与构图**，勿整文件粘贴 Swift/Metal 源码。

## 1. 先纠正预期：它不是真 3D

Vinyl for Mac 的「桌面唱盘背景」是 **俯视 2.5D 摄影级合成**，不是 SceneKit / RealityKit / three.js 场景：

| 层 | 实现 | 路径 |
|---|---|---|
| 桌面窗口 | AppKit `NSWindow`（desktop level +1，点击穿透） | `Vinyl/Wallpaper/ArtworkWallpaperController.swift` |
| 场景构图 | SwiftUI `ZStack` + `GeometryReader` 比例布局 | `AlbumCanvasWallpaperView.swift`（~1625 行） |
| 材质着色 | Metal **stitchable** `colorEffect` shader | `VinylShaders.metal`（~174 行） |
| 动画 | `TimelineView(.animation(minimumInterval: 1/30))` + 进度外推旋转 | `RecordAssembly` |
| 音源 | Spotify 本地通知 / 轮询（与视觉无关） | `Spotify/*` |

当前唯一可用 setup 是 `albumCanvas`（Turntable）；`classicDeck` / `floatingVinyl` 等仍是 `comingSoon`（`VinylSetup.swift`）。

**对 Lyra 的含义**：可借的是「单一主光 + 材质 shader + 静态沟槽/只转标签」这套 **假三维摄影语言**，不是把整个 macOS 壁纸管线搬进来。

---

## 2. 与 Lyra 现状对照

| 能力 | vinylformac | Lyra |
|---|---|---|
| 唱盘主视觉 | 整桌：胡桃木桌 + 封套 + 铝制机身 + 唱臂 + 旋钮 | `coverParticleShaders` preset≈10「Classic desk turntable」粒子近似；UI 上 `mineradioVinyl` **已退役并 normalize → emily** |
| 沟槽光泽 | Metal：各向异性 lobe（相对灯光固定）+ deadwax/sep + sparkle | 简单 `sin` groove + `dot` sheen；粒子粒感证明旋转 |
| 旋转策略 | **碟面沟槽静态**，只转 label / dust（沟槽旋转对称） | 整盘 UV 随 `uVinylSpin` 旋转 |
| 光照一致性 | 全局 `SceneLight.direction` → 阴影 offset / shader 共用 | 无统一场景光；各层局部算 |
| 材质老化 | film grain、划痕/灰尘贴图、指纹、杯渍、封套磨损 | 基本无 |
| 性能档 | 静态层 + 30fps 旋转层；桌面级常驻 | interactive3d 粒子路径；vinyl 已标 retired |
| 桌面壁纸 | macOS desktop window | **不做**（产品是播放器舞台，不是系统壁纸） |

Lyra 粒子唱盘代码仍在 `src/components/visualizer/geometric/webgl/coverParticleShaders.ts`（`uPreset < 10.5` 分支），但产品入口已关掉——说明「粒子唱盘」路线已被放弃，更适合用 **独立 canvas / 全屏 CSS+WebGL 平面场景** 重做，而不是复活粒子 preset。

---

## 3. 迁移方式图例

| 标签 | 含义 |
|---|---|
| **算法重写移植** | 按 Metal/Swift 逻辑用 GLSL/Canvas/CSS 重写；保持许可安全 |
| **只学架构** | 学模式与参数，不搬结构 |
| **不做** | 与 Lyra 定位冲突或运维过重 |

---

## 4. P0 — 高价值（建议优先）

### 4.1 各向异性唱片刻纹光泽 — **算法重写移植**

| | |
|---|---|
| **上游** | `VinylShaders.metal` → `vinylSurface` |
| **核心** | 沟槽旋转对称 → 光照 lobe 相对 `lightDir` 固定；`pow(lobes, 2/5/32)` 分层高光；deadwax 更镜面；track separation 用 `ringGauss`；微 sparkle |
| **Lyra** | 粒子 vinyl 用低频 `sin` + 弱 sheen，缺「固定灯光轴上的各向异性扫光」 |
| **价值** | 这是 Vinyl 看起来「贵」的主因；可直接抬升任何平面唱盘预设 |
| **接入点** | 新建 `turntableSurface.frag`（或并入独立 Turntable 背景层），**不要**再塞进 cover-particle morph |
| **性能** | 单全屏 quad / 一张离屏纹理即可；沟槽可预烘焙到纹理，运行时只转 label |

关键思路（上游注释原文意图）：

> The disc is rotationally symmetric… only the label and dust rotate… anisotropic sheen… fixed relative to the light rather than the record.

### 4.2 静态沟槽 + 旋转标签 — **只学架构**（强烈建议照做）

| | |
|---|---|
| **上游** | `RecordAssembly`：静态 `vinylSurface` + `TimelineView` 只旋 `RecordLabel` / `RecordDust` |
| **价值** | 沟槽不随旋转采样 → 无摩尔/闪烁；CPU/GPU 更低；视觉仍「在转」 |
| **Lyra** | 当前整盘旋转，粒子还要扛旋转证明 |
| **接入** | 两层合成：底盘 `background-image` / canvas 静态；中心封面 `transform: rotate` 由播放进度驱动（MotionValue / RAF，**禁止**每帧 `setState`） |

### 4.3 全局 `SceneLight` 灯架 — **只学架构**

| | |
|---|---|
| **上游** | `SceneLight.direction` + `shadowOffset(distance)`；全场景阴影、渐变、shader 共用同一向量 |
| **价值** | 封套 / 机身 / 唱臂 / 碟影读成「一张照片」，而不是一堆各自打光的 UI |
| **接入** | Turntable 背景模块内一个 `const LIGHT = { dx, dy }`；所有 contact shadow / rim 派生自此 |

---

## 5. P1 — 值得做，但工作量大

### 5.1 整桌摄影构图（桌 + 封套 + 唱机） — **算法重写移植**

上游构图比例（`AlbumCanvasWallpaperView`）：

- 以 `min(h, w/1.55)` 为 unit
- 机身右偏 `deckCenter ≈ (0.655w, 0.515h)`，微倾 `-0.35°`
- 封套左下侧、`-3.6°` 倾角；内衬纸从开口边露出
- 全场：暖色灯池 screen + softLight 暖调 + vignette + film grain

Lyra 可作为 **新 interactive3d / 舞台背景预设**（例如 `turntableDesk`），挂在现有 FloatingPlayerBackground / GeometricLayer 旁，而不是替换 emily 封面粒子。

建议分层（Web 实现）：

1. 桌面纹理（可用 CC0 Walnut，见 `ASSET_LICENSES.md`）
2. 封套（封面图 + 磨损叠加）
3. 机身（渐变铝 + brushed metal 噪声）
4. 静态碟面 shader + 旋转 label
5. 唱臂 / 配重 / 旋钮（SVG 或 canvas 路径）
6. 全场 post：暖光 / vignette / grain

### 5.2 platter / brushedMetal / filmGrain shader — **算法重写移植**

| Shader | 用途 | Web 等价 |
|---|---|---|
| `platterSurface` | 橡胶垫同心肋 + 铝边 | GLSL 或预烘焙 |
| `brushedMetal` | 纵向拉丝，softLight 叠在机身 | 噪声纹理 + soft-light |
| `filmGrain` | 摄影颗粒 | 已有氛围路径可复用；保持低频 |

### 5.3 播放进度驱动 RPM — **只学架构**

上游：`rotation = (progressSec + elapsedSinceSnapshot) * 30°/s`，暂停则 elapsed=0。

Lyra：用现有 media clock / MotionValue；切歌时重置 snapshot；服从 `frontend-runtime-guardrails`（连续角不进 React state）。

---

## 6. P2 / 不做

| 项 | 标签 | 原因 |
|---|---|---|
| AppKit desktop wallpaper window | **不做** | 系统壁纸 companion，不是播放器产品 |
| Spotify 本地检测桥 | **不做** | Lyra 已有多源播放管线 |
| 整文件粘贴 SwiftUI / Metal | **不做** | 许可未声明；语言栈不兼容 |
| 复活 `mineradioVinyl` 粒子 preset | **不做**（或仅作过渡） | 产品已 retired；粒子无法承载摄影级细节 |
| comingSoon setups（listeningRoom 等） | **不做** | 上游尚未实现 |

---

## 7. 推荐落地路径（Lyra）

### 方案 A（推荐）：独立 `TurntableDesk` 背景层

1. 新建 `src/components/visualizer/turntable/`（入口 + geometry + shaders + settings）
2. WebGL 全屏 quad 画静态 `vinylSurface`；DOM/canvas 叠旋转封面 label
3. 可选第二阶段：桌面 + 封套 + 唱臂
4. 注册到 interactive3d / background mode；设置进视觉导入导出 + command palette（见 `settings-feature-integration`）
5. 帧率：静态层 0；旋转层 ≤30fps 或跟 `frameRateLimiter`

### 方案 B（小步）：只升级「碟面光泽」算法

把 `vinylSurface` 的 lobe / deadwax / sep 重写进现有任一平面唱盘实验（或 VisPlayground 专用预览），先验证观感再扩场景。

### 方案 C（不推荐）：继续堆在 cover-particle preset 10

粒子分辨率与 grain 语义不匹配摄影桌面；且 vinyl 入口已关。

---

## 8. 许可与资产

- **代码**：GitHub `license: Other / NOASSERTION` → 视为未授权再分发；**重写实现**，文档注明「informed by vinylformac composition」。
- **贴图**（CC0，可直接用或换同站等价物）：ambientCG Wood067 / Scratches005 / SurfaceImperfections015 / Metal012 / Leather026；Poly Haven rosewood_veneer1。清单见 `temp/vinylformac/ASSET_LICENSES.md`。
- 上游桌面窗口思路声明受 [Luviosa](https://github.com/ibuhs/Luviosa)（GPL-3.0）启发，但 Vinyl **未包含**其源码；Lyra 也不需要那一层。

---

## 10. 落地进度（Lyra）

| 日期 | 状态 |
|---|---|
| 2026-07-29 | 碟面一期（Canvas 近似）观感不足。 |
| 2026-07-29 | **忠实移植启动**：`public/turntable/*` CC0 贴图；WebGL 直译 `VinylShaders.metal`；`resolveTurntableLayout` / `drawAlbumCanvasScene` 对齐 `AlbumCanvasWallpaperView` 整桌构图（胡桃木桌 + 封套 + 铝机身 + GL 碟面 + 唱臂）。 |

## 9. 结论（一句话）

Vinylformac 的可迁移精华是：**整桌摄影构图 + Metal 全分辨率各向异性碟面 + CC0 材质**；Canvas 手绘近似几乎不构成「同一观感」，必须以 shader + 贴图 + 原比例布局对齐。
