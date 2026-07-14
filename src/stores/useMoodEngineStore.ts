// src/stores/useMoodEngineStore.ts
// Mood Engine Store - manages emotion state and UI interaction
// 情绪引擎状态管理

import { create } from 'zustand';
import type { EmotionTag, SongEmotion } from '../types/moodEngine';
import type { MoodProfile } from '../types/atmosphere';
import { moodEngineService } from '../services/moodEngine';

interface MoodEngineState {
  /** 当前歌曲的情绪数据 */
  currentEmotion: SongEmotion | null;

  /** 是否正在加载 */
  loading: boolean;

  /** 情绪选择器是否打开 */
  selectorOpen: boolean;

  /** 更新当前歌曲的情绪 */
  updateCurrentEmotion: (songId: number, moodProfile?: MoodProfile) => Promise<void>;

  /** 用户修正情绪 */
  correctEmotion: (songId: number, newEmotion: EmotionTag) => Promise<void>;

  /** 打开情绪选择器 */
  openSelector: () => void;

  /** 关闭情绪选择器 */
  closeSelector: () => void;

  /** 清除当前情绪 */
  clearCurrent: () => void;
}

export const useMoodEngineStore = create<MoodEngineState>((set, get) => ({
  currentEmotion: null,
  loading: false,
  selectorOpen: false,

  updateCurrentEmotion: async (songId: number, moodProfile?: MoodProfile) => {
    set({ loading: true });

    try {
      const emotion = await moodEngineService.getSongEmotion(songId, moodProfile);
      set({ currentEmotion: emotion, loading: false });
    } catch (error) {
      console.error('Failed to get emotion:', error);
      set({ loading: false });
    }
  },

  correctEmotion: async (songId: number, newEmotion: EmotionTag) => {
    try {
      await moodEngineService.correctEmotion(songId, newEmotion);

      // 更新当前情绪
      const updatedEmotion: SongEmotion = {
        songId,
        emotion: newEmotion,
        source: 'user',
        confidence: 1.0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set({ currentEmotion: updatedEmotion, selectorOpen: false });
    } catch (error) {
      console.error('Failed to correct emotion:', error);
    }
  },

  openSelector: () => set({ selectorOpen: true }),
  closeSelector: () => set({ selectorOpen: false }),
  clearCurrent: () => set({ currentEmotion: null }),
}));
