# Interactive Character Layer

独立于 Ambient Visual 的角色层（ADR-0003）。透明 WebGL canvas 叠在主视觉之上，加载 glTF/GLB，用 `AnimationMixer` 播放骨骼动画。

## 模块

| 文件 | 职责 |
|------|------|
| `CharacterStage.tsx` | React 宿主（独立 canvas / RAF） |
| `CharacterRuntime.ts` | 场景、三点光、加载、渲染 |
| `loadCharacterGltf.ts` | GLTFLoader + AbortSignal |
| `CharacterAnimationController.ts` | play / pause / stop / cross-fade |
| `characterFitMath.ts` | 包围盒适配到目标身高 |
| `characterAnimationMath.ts` | clip 选择纯函数 |

状态：`useCharacterStore`（enabled / status / clips / playback）。

## 挂载

已接入 `GeometricLayer`（interactive3d 舞台）：

- 适配层：`src/components/visualizer/geometric/CharacterStageOverlay.tsx`
- **懒加载** `CharacterStage`（避免 GLTFLoader 进入启动关键路径）
- 右下角角落位：`CharacterStageOverlay` dock（避开中央歌词与底栏）
- **仅在沉浸播放 / 播放页歌词舞台（`immersiveLyrics || showLyrics`）时挂载**
- 适配：先 scale 再 recenter（避免 Fox 局部原点把模型甩到相机后方）

预览：打开播放器（显示歌词）→ 右下角可见 Fox；首页不挂载。

## 节奏 / 情绪驱动（Ticket 08）

- 情绪 → `playAction`（`useMoodEngineStore.currentEmotion`）
- BeatMap → BPM + 节拍强调（`useAtmosphereBeatMapStore`）
- 乐句 drop/phrase → 短暂动作强调后回到情绪基线

手动试：

```ts
useMoodEngineStore.getState() // 看 currentEmotion
useCharacterStore.getState().setBpm(140)
```


语义动作 → 模型 clips（Fox MVP）：

| Action | Fox clip | base timeScale |
|--------|----------|----------------|
| idle | Survey | 1.0 |
| dance-slow | Walk | 0.85 |
| dance-fast | Run | 1.15 |
| cheer | Run | 1.35 |
| sad | Survey | 0.65 |

```ts
runtime.playAction('dance-fast');
useCharacterStore.getState().setBpm(140); // CharacterStage 同步到 mixer.timeScale
```


## 测试

```bash
npx vitest run -c vitest.config.ts test/unit/character
```
