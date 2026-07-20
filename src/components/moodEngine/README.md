# Mood Engine - 情绪引擎

## 概述

情绪引擎是 Lyra 音乐播放器的核心功能之一，实现了混合情绪识别方案：
1. **优先使用平台API标签**（QQ音乐、网易云音乐）
2. **无标签时本地分析**（基于 BPM、音调、能量等音频特征）
3. **支持用户修正并学习**（用户可以手动修正情绪标签）

## 已实现功能

### ✅ 核心类型定义 (`src/types/moodEngine.ts`)
- `EmotionTag` - 11种情绪标签
- `SongEmotion` - 歌曲情绪数据结构
- `UserEmotionCorrection` - 用户修正记录
- 辅助函数：
  - `inferEmotionFromMoodProfile()` - 从 MoodProfile 推断情绪
  - `getVisualStrategyForEmotion()` - 获取情绪对应的视觉策略
  - `getEmotionDisplayName()` - 获取中文显示名称

### ✅ 情绪引擎服务 (`src/services/moodEngine.ts`)
- `MoodEngineService` - 核心服务类
- IndexedDB 本地存储
- 三级数据源：API → 本地分析 → 缓存
- 用户修正记录持久化

### ✅ 状态管理 (`src/stores/useMoodEngineStore.ts`)
- Zustand store 管理情绪状态
- 异步数据获取
- UI 交互状态管理

### ✅ UI 组件
- `EmotionButton` (`src/components/moodEngine/EmotionButton.tsx`) - 情绪显示按钮
- `EmotionSelector` (`src/components/moodEngine/EmotionSelector.tsx`) - 情绪选择器
- 样式文件 (`src/components/moodEngine/EmotionSelector.css`)

## 使用方法

### 1. 在播放器中集成

```tsx
import React, { useEffect } from 'react';
import { useMoodEngineStore } from '@/stores/useMoodEngineStore';
import { EmotionButton, EmotionSelector } from '@/components/moodEngine';
import '@/components/moodEngine/EmotionSelector.css';

function Player({ currentSong, moodProfile }) {
  const {
    currentEmotion,
    selectorOpen,
    updateCurrentEmotion,
    closeSelector,
  } = useMoodEngineStore();

  // 当歌曲切换时更新情绪
  useEffect(() => {
    if (currentSong) {
      updateCurrentEmotion(currentSong.id, moodProfile);
    }
  }, [currentSong?.id, moodProfile]);

  return (
    <div className="player">
      {/* 播放器其他内容 */}
      
      {/* 情绪按钮 */}
      <EmotionButton />

      {/* 情绪选择器（弹窗） */}
      {selectorOpen && currentSong && (
        <EmotionSelector
          songId={currentSong.id}
          currentEmotion={currentEmotion?.emotion}
          onClose={closeSelector}
        />
      )}
    </div>
  );
}
```

### 2. 获取情绪数据用于视觉策略

```tsx
import { useMoodEngineStore } from '@/stores/useMoodEngineStore';
import { getVisualStrategyForEmotion } from '@/types/moodEngine';

function VisualizerController() {
  const { currentEmotion } = useMoodEngineStore();

  // 根据情绪选择视觉策略
  const strategyType = currentEmotion
    ? getVisualStrategyForEmotion(currentEmotion.emotion)
    : 'geometry'; // 默认

  return <Visualizer strategy={strategyType} />;
}
```

### 3. 直接使用服务

```tsx
import { moodEngineService } from '@/services/moodEngine';

// 获取歌曲情绪
const emotion = await moodEngineService.getSongEmotion(songId, moodProfile);

// 用户修正情绪
await moodEngineService.correctEmotion(songId, 'happy');

// 获取所有修正记录
const corrections = await moodEngineService.getUserCorrections();
```

## 数据流

```
歌曲播放
  ↓
更新 MoodProfile (现有系统)
  ↓
调用 updateCurrentEmotion(songId, moodProfile)
  ↓
情绪引擎获取情绪数据
  ├─ 1. 检查缓存
  ├─ 2. 检查 IndexedDB
  ├─ 3. 尝试从 API 获取（TODO）
  └─ 4. 基于 MoodProfile 本地推断
  ↓
存储到 IndexedDB + 更新缓存
  ↓
更新 useMoodEngineStore 状态
  ↓
UI 显示情绪 / 视觉策略使用情绪数据
```

## 情绪标签映射

| 情绪标签 | 中文名称 | 视觉策略 | 特征 |
|---------|---------|---------|-----|
| happy | 快乐 | particle | 高能量 + 高亮度 |
| energetic | 激昂 | particle | 高能量 + 高侵略性 |
| uplifting | 振奋 | particle | 积极向上 |
| sad | 悲伤 | wave | 低能量 + 低亮度 |
| calm | 舒缓 | wave | 低能量 + 高稳定性 |
| melancholic | 忧郁 | wave | 忧伤氛围 |
| relaxed | 放松 | wave | 平静舒缓 |
| romantic | 浪漫 | geometry | 高温暖度 |
| angry | 愤怒 | geometry | 高侵略性 |
| tense | 紧张 | geometry | 低稳定性 |
| neutral | 中性 | geometry | 平衡状态 |

## TODO

### 已完成（相对原 TODO）
- [x] 网易云：`/song/wiki/summary` 标签 → EmotionTag（`source: 'api'`）
- [x] 用户修正学习：IndexedDB 修正记录偏置本地推断

### 优先级中
- [ ] 对接 QQ / 汽水等平台情绪或曲风字段（仍无稳定公开字段时保持本地）
- [ ] 优化本地分析算法（更准确的情绪推断）
- [ ] 添加情绪统计分析（用户最常听的情绪类型）

### 优先级低
- [ ] 支持自定义情绪标签
- [ ] 情绪历史轨迹可视化
- [ ] 基于情绪的歌单推荐

## 测试

```bash
# 类型检查通过
npm run lint

# 运行开发服务器测试
npm run dev
```

## 相关文件

- `src/types/moodEngine.ts` - 类型定义
- `src/services/moodEngine.ts` - 核心服务
- `src/stores/useMoodEngineStore.ts` - 状态管理
- `src/components/moodEngine/` - UI 组件
- `docs/adr/0002-mood-recognition-hybrid-approach.md` - 架构决策记录

## 参考

- ADR-0002: 情绪识别混合方案
- ADR-0004: 本地存储用户行为数据
- CONTEXT.md - 项目领域模型
