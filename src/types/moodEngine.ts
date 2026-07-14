// src/types/moodEngine.ts
// Types for the Mood Engine - hybrid emotion recognition system

import type { MoodProfile } from './atmosphere';

/**
 * 情绪标签 - 用于描述歌曲的情绪类型
 * Emotion tags used to describe song mood
 */
export type EmotionTag =
  | 'happy'      // 快乐
  | 'sad'        // 悲伤
  | 'energetic'  // 激昂
  | 'calm'       // 舒缓
  | 'angry'      // 愤怒
  | 'romantic'   // 浪漫
  | 'melancholic' // 忧郁
  | 'uplifting'  // 振奋
  | 'relaxed'    // 放松
  | 'tense'      // 紧张
  | 'neutral';   // 中性

/**
 * 情绪数据来源
 * Source of emotion data
 */
export type EmotionSource =
  | 'api'        // 来自音乐平台API
  | 'local'      // 本地分析
  | 'user';      // 用户修正

/**
 * 歌曲情绪信息
 * Song emotion information
 */
export interface SongEmotion {
  /** 歌曲ID */
  songId: number;
  /** 情绪标签 */
  emotion: EmotionTag;
  /** 数据来源 */
  source: EmotionSource;
  /** 置信度 (0-1) */
  confidence: number;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
}

/**
 * 用户情绪修正记录
 * User emotion correction record
 */
export interface UserEmotionCorrection {
  /** 歌曲ID */
  songId: number;
  /** 原始情绪 */
  originalEmotion: EmotionTag;
  /** 修正后的情绪 */
  correctedEmotion: EmotionTag;
  /** 修正时间戳 */
  correctedAt: number;
}

/**
 * 情绪到视觉策略的映射
 * Emotion to visual strategy mapping
 */
export type VisualStrategyType = 'particle' | 'wave' | 'geometry';

export interface EmotionVisualMapping {
  emotion: EmotionTag;
  strategy: VisualStrategyType;
  /** 视觉参数调整 */
  params?: {
    speed?: number;
    intensity?: number;
    colorTone?: 'bright' | 'dark' | 'neutral';
  };
}

/**
 * 从 MoodProfile 推断情绪标签
 * Infer emotion tag from MoodProfile
 */
export function inferEmotionFromMoodProfile(mood: MoodProfile): EmotionTag {
  const { energy, aggression, brightness, warmth, stability } = mood;

  // 高能量 + 高侵略性 = 激昂/愤怒
  if (energy > 0.7 && aggression > 0.6) {
    return 'energetic';
  }

  // 高能量 + 高亮度 = 快乐/振奋
  if (energy > 0.6 && brightness > 0.6) {
    return 'happy';
  }

  // 低能量 + 低亮度 = 悲伤/忧郁
  if (energy < 0.3 && brightness < 0.4) {
    return 'sad';
  }

  // 低能量 + 高稳定性 + 高温暖度 = 舒缓/放松
  if (energy < 0.4 && stability > 0.6 && warmth > 0.5) {
    return 'calm';
  }

  // 高温暖度 + 中等能量 = 浪漫
  if (warmth > 0.7 && energy > 0.4 && energy < 0.7) {
    return 'romantic';
  }

  // 低稳定性 + 中高能量 = 紧张
  if (stability < 0.4 && energy > 0.5) {
    return 'tense';
  }

  // 默认中性
  return 'neutral';
}

/**
 * 获取情绪对应的视觉策略
 * Get visual strategy for emotion
 */
export function getVisualStrategyForEmotion(emotion: EmotionTag): VisualStrategyType {
  switch (emotion) {
    case 'happy':
    case 'energetic':
    case 'uplifting':
      return 'particle';

    case 'sad':
    case 'calm':
    case 'melancholic':
    case 'relaxed':
      return 'wave';

    case 'neutral':
    case 'romantic':
    case 'angry':
    case 'tense':
    default:
      return 'geometry';
  }
}

/**
 * 获取情绪的中文显示名称
 * Get Chinese display name for emotion
 */
export function getEmotionDisplayName(emotion: EmotionTag): string {
  const names: Record<EmotionTag, string> = {
    happy: '快乐',
    sad: '悲伤',
    energetic: '激昂',
    calm: '舒缓',
    angry: '愤怒',
    romantic: '浪漫',
    melancholic: '忧郁',
    uplifting: '振奋',
    relaxed: '放松',
    tense: '紧张',
    neutral: '中性',
  };
  return names[emotion];
}

/**
 * 获取所有可用的情绪标签
 * Get all available emotion tags
 */
export function getAllEmotionTags(): EmotionTag[] {
  return [
    'happy',
    'sad',
    'energetic',
    'calm',
    'angry',
    'romantic',
    'melancholic',
    'uplifting',
    'relaxed',
    'tense',
    'neutral',
  ];
}
