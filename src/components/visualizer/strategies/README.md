# Visual Strategies - 视觉策略系统

## 概述

视觉策略系统是 Lyra 的主视觉氛围（Ambient Visual）的核心实现，采用策略模式架构，支持：
- **多种视觉效果**（粒子、波浪、几何）
- **响应音乐节奏**（BeatEvent 驱动）
- **根据情绪切换**（自动选择合适的策略）
- **平滑过渡动画**（淡入淡出 2–3s）

## 已实现功能

### ✅ 核心架构
- `VisualStrategy` 接口 - 统一的策略接口
- `VisualStrategyManager` - 策略生命周期、切换、cross-fade、preload
- `useAmbientVisualStore` - 策略状态 / 过渡时长
- `useAmbientVisualController` - 情绪引擎 + BeatMap → Manager 桥接
- `AmbientVisualStage` - Three.js Ambient Layer 宿主
- `ambientVisualRhythm` / `ambientVisualTransition` - 纯函数（可单测）

### ✅ 三个策略
| 策略 | 情绪 | 实现 |
|------|------|------|
| ParticleStrategy | happy / energetic / uplifting | `ParticleStrategy.ts` |
| WaveStrategy | sad / calm / melancholic / relaxed | `WaveStrategy.ts` |
| GeometryStrategy | neutral / romantic / angry / tense | `GeometryStrategy.ts` |

## 使用方法

### 1. 挂载 Ambient Layer（推荐）

```tsx
import { AmbientVisualStage } from '@/components/visualizer/strategies';
import { useAtmosphereEngine } from '@/hooks/useAtmosphereEngine';

function PlayerStage({ audioRef }) {
  const atmosphere = useAtmosphereEngine({ /* ... */ });

  return (
    <div style={{ position: 'relative' }}>
      {/* 现有 geometric / lyric 层 */}
      <AmbientVisualStage
        beatMapRef={atmosphere.beatMapRef}
        audioRef={audioRef}
      />
    </div>
  );
}
```

情绪变化由 `useMoodEngineStore.currentEmotion` 驱动自动切换；节拍来自同一 `beatMapRef`，不修改 atmosphere tick 热路径。

### 2. 手动使用 Manager

```tsx
const manager = new VisualStrategyManager();
manager.init(scene);
manager.preload();
manager.setTransitionDuration(2.5);
manager.switchByEmotion('happy'); // → particle + cross-fade

// 每帧
manager.update(deltaTime);

// 节拍（自动分级 beat/bar/phrase）
manager.onRhythmEvent(beatEvent);
```

### 3. 情绪 → 策略映射（单一真源）

映射定义在 `getVisualStrategyForEmotion`（`src/types/moodEngine.ts`），store / manager 均复用该函数。

| 情绪 | 策略 |
|-----|------|
| happy, energetic, uplifting | particle |
| sad, calm, melancholic, relaxed | wave |
| neutral, romantic, angry, tense | geometry |

## 架构

```
Mood Engine ──► useAmbientVisualController ──► VisualStrategyManager
Atmosphere BeatMap ─┘                              │
                                                   ├─ ParticleStrategy
                                                   ├─ WaveStrategy
                                                   └─ GeometryStrategy
```

切换时旧策略淡出、新策略淡入；过渡中途再次切换会 dispose 未完成的 next，避免堆积。

## 测试

```bash
npx vitest run -c vitest.config.ts test/unit/visualizer/ambientVisualRhythm.test.ts test/unit/visualizer/visualStrategyManager.test.ts
```

## 相关文件

- `src/types/visualStrategy.ts` - 策略接口
- `src/types/moodEngine.ts` - 情绪 → 策略映射
- `src/stores/useAmbientVisualStore.ts` - UI/状态
- `src/hooks/atmosphere/useAmbientVisualController.ts` - 运行时桥接
- `src/utils/atmosphere/ambientVisualRhythm.ts` - 节拍分级
- `src/utils/atmosphere/ambientVisualTransition.ts` - cross-fade 数学
- `docs/adr/0005-ambient-visual-architecture.md`

## 参考

- ADR-0005 / ADR-0001 / ADR-0002
- Ticket 05 — 主视觉：策略切换系统
