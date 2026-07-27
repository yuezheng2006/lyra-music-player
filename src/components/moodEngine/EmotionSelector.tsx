// src/components/moodEngine/EmotionSelector.tsx
// Emotion Selector Component - UI for user to select/correct song emotion
// 情绪选择器组件

import React from 'react';
import { useMoodEngineStore } from '../../stores/useMoodEngineStore';
import {
  getAllEmotionTags,
  getEmotionDisplayName,
  type EmotionTag,
} from '../../types/moodEngine';
import './EmotionSelector.css';

interface EmotionSelectorProps {
  songId: number;
  currentEmotion?: EmotionTag;
  onClose?: () => void;
}

/**
 * 情绪选择器组件
 * Emotion selector component for user to view and correct song emotions
 */
export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  songId,
  currentEmotion,
  onClose,
}) => {
  const { correctEmotion, closeSelector } = useMoodEngineStore();
  const emotionTags = getAllEmotionTags();

  const handleSelect = async (emotion: EmotionTag) => {
    await correctEmotion(songId, emotion);
    onClose?.();
  };

  const handleClose = () => {
    closeSelector();
    onClose?.();
  };

  return (
    <>
      <button
        type="button"
        className="emotion-selector-backdrop"
        aria-label="关闭情绪选择"
        onClick={handleClose}
      />
      <div className="emotion-selector" role="dialog" aria-modal="true" aria-label="选择歌曲情绪">
        <div className="emotion-selector-header">
          <h3>选择歌曲情绪</h3>
          <button
            type="button"
            className="emotion-selector-close"
            onClick={handleClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="emotion-selector-grid">
          {emotionTags.map((emotion) => {
            const isSelected = emotion === currentEmotion;
            return (
              <button
                type="button"
                key={emotion}
                className={`emotion-tag ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(emotion)}
                data-emotion={emotion}
              >
                <span className="emotion-icon">{getEmotionIcon(emotion)}</span>
                <span className="emotion-name">{getEmotionDisplayName(emotion)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

/**
 * 获取情绪对应的图标/emoji
 * Get icon/emoji for emotion
 */
function getEmotionIcon(emotion: EmotionTag): string {
  const icons: Record<EmotionTag, string> = {
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
  return icons[emotion];
}
