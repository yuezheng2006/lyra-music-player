// src/stores/useMoodEngineStore.ts
// Mood Engine Store - manages emotion state and UI interaction
// 情绪引擎状态管理

import { create } from 'zustand';
import {
  buildEmotionCorrectionNotice,
  type EmotionTag,
  type SongEmotion,
} from '../types/moodEngine';
import type { MoodProfile } from '../types/atmosphere';
import { moodEngineService, type GetSongEmotionOptions } from '../services/moodEngine';
import { useAmbientVisualStore } from './useAmbientVisualStore';

interface MoodEngineState {
  /** 当前歌曲的情绪数据 */
  currentEmotion: SongEmotion | null;

  /** 是否正在加载 */
  loading: boolean;

  /** 情绪选择器是否打开 */
  selectorOpen: boolean;

  /** Brief UX copy after user correction (cleared by EmotionButton). */
  correctionNotice: string | null;

  /** Bumped on each successful correction so chrome can flash. */
  correctionPulseAt: number;

  /** 更新当前歌曲的情绪 */
  updateCurrentEmotion: (
    songId: number,
    moodProfile?: MoodProfile,
    options?: GetSongEmotionOptions,
  ) => Promise<void>;

  /** 用户修正情绪 */
  correctEmotion: (songId: number, newEmotion: EmotionTag) => Promise<void>;

  /** Clear the post-correction status line */
  clearCorrectionNotice: () => void;

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
  correctionNotice: null,
  correctionPulseAt: 0,

  updateCurrentEmotion: async (songId, moodProfile, options) => {
    set({ loading: true });

    try {
      const emotion = await moodEngineService.getSongEmotion(songId, moodProfile, options);
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
        createdAt: get().currentEmotion?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      // Correction implies the user wants a visible mood shift — turn ambient on if off.
      const ambientStore = useAmbientVisualStore.getState();
      const ambientWasEnabled = ambientStore.enabled;
      if (!ambientWasEnabled) {
        ambientStore.setEnabled(true);
      }

      set({
        currentEmotion: updatedEmotion,
        selectorOpen: false,
        correctionNotice: buildEmotionCorrectionNotice(newEmotion, true, {
          ambientJustEnabled: !ambientWasEnabled,
        }),
        correctionPulseAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to correct emotion:', error);
    }
  },

  clearCorrectionNotice: () => set({ correctionNotice: null }),
  openSelector: () => set({ selectorOpen: true }),
  closeSelector: () => set({ selectorOpen: false }),
  clearCurrent: () => set({ currentEmotion: null, correctionNotice: null }),
}));
