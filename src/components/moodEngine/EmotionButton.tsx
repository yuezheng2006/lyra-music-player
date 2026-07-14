// src/components/moodEngine/EmotionButton.tsx
// Emotion Button Component - displays current emotion and opens selector
// 情绪按钮组件

import React from 'react';
import { useMoodEngineStore } from '../../stores/useMoodEngineStore';
import { getEmotionDisplayName } from '../../types/moodEngine';

interface EmotionButtonProps {
  /** 是否精简模式（仅图标） */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 情绪按钮组件
 * Shows current song emotion and allows user to correct it
 */
export const EmotionButton: React.FC<EmotionButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { currentEmotion, loading, openSelector } = useMoodEngineStore();

  if (loading) {
    return (
      <button className={`emotion-button loading ${className}`} disabled>
        <span className="emotion-icon">⏳</span>
        {!compact && <span className="emotion-text">分析中...</span>}
      </button>
    );
  }

  if (!currentEmotion) {
    return null;
  }

  const emotionName = getEmotionDisplayName(currentEmotion.emotion);

  return (
    <button
      className={`emotion-button ${className}`}
      onClick={openSelector}
      title={`当前情绪: ${emotionName} (点击修改)`}
    >
      <span className="emotion-icon">{getEmotionIcon(currentEmotion.emotion)}</span>
      {!compact && (
        <>
          <span className="emotion-text">{emotionName}</span>
          {currentEmotion.source === 'user' && (
            <span className="emotion-badge" title="用户修正">✓</span>
          )}
        </>
      )}
    </button>
  );
};

/**
 * 获取情绪图标
 * Get emotion icon
 */
function getEmotionIcon(emotion: string): string {
  const icons: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    energetic: '⚡',
    calm: '🌊',
    angry: '😠',
    romantic: '💕',
    melancholic: '😔',
    uplifting: '🌟',
    relaxed: '😌',
    tense: '😰',
    neutral: '😐',
  };
  return icons[emotion] || '🎵';
}
