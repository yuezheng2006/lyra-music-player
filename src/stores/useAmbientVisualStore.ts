// src/stores/useAmbientVisualStore.ts
// Ambient Visual Store - manages visual strategy state
// 主视觉氛围状态管理

import { create } from 'zustand';
import type { VisualStrategyType } from '../types/visualStrategy';
import type { EmotionTag } from '../types/moodEngine';
import { getVisualStrategyForEmotion } from '../types/moodEngine';
import { DEFAULT_AMBIENT_TRANSITION_DURATION } from '../utils/atmosphere/ambientVisualTransition';

export const AMBIENT_VISUAL_ENABLED_STORAGE_KEY = 'lyra_ambient_visual_enabled';

const readStoredEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(AMBIENT_VISUAL_ENABLED_STORAGE_KEY);
  if (raw === null) return true;
  return raw === '1' || raw === 'true';
};

interface AmbientVisualState {
  /** 当前激活的视觉策略 */
  currentStrategy: VisualStrategyType | null;

  /** 是否启用主视觉氛围 */
  enabled: boolean;

  /** 是否正在过渡 */
  isTransitioning: boolean;

  /** Cross-fade 时长（秒） */
  transitionDuration: number;

  /** 设置当前策略 */
  setStrategy: (strategy: VisualStrategyType) => void;

  /** 根据情绪设置策略（单一映射源：getVisualStrategyForEmotion） */
  setStrategyByEmotion: (emotion: EmotionTag) => void;

  /** 启用/禁用主视觉 */
  setEnabled: (enabled: boolean) => void;

  /** 设置过渡状态 */
  setTransitioning: (transitioning: boolean) => void;

  /** 设置过渡时长 */
  setTransitionDuration: (durationSec: number) => void;
}

export const useAmbientVisualStore = create<AmbientVisualState>((set) => ({
  currentStrategy: null,
  enabled: readStoredEnabled(),
  isTransitioning: false,
  transitionDuration: DEFAULT_AMBIENT_TRANSITION_DURATION,

  setStrategy: (strategy) => set({ currentStrategy: strategy }),

  setStrategyByEmotion: (emotion) => {
    set({ currentStrategy: getVisualStrategyForEmotion(emotion) });
  },

  setEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AMBIENT_VISUAL_ENABLED_STORAGE_KEY, enabled ? '1' : '0');
    }
    set({ enabled });
  },

  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  setTransitionDuration: (durationSec) => set({
    transitionDuration: Math.max(0.05, durationSec),
  }),
}));
