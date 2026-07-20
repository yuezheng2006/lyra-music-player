import { describe, expect, it } from 'vitest';
import { applyEmotionCorrectionBias } from '../../../src/utils/moodEngine/emotionCorrectionLearningMath';
import {
  collectPlatformLabelCandidates,
  mapPlatformEmotionLabel,
  pickEmotionFromPlatformLabels,
} from '../../../src/utils/moodEngine/platformEmotionLabelMath';

// test/unit/moodEngine/moodEngineLearningMath.test.ts

describe('platformEmotionLabelMath', () => {
  it('maps Chinese and English labels', () => {
    expect(mapPlatformEmotionLabel('欢快')).toBe('happy');
    expect(mapPlatformEmotionLabel('Romantic Ballad')).toBe('romantic');
    expect(mapPlatformEmotionLabel('未知风格')).toBeNull();
  });

  it('votes labels and ignores pure neutral', () => {
    expect(pickEmotionFromPlatformLabels(['中性', '治愈', '治愈'])).toBe('uplifting');
  });

  it('collects short string leaves from wiki-like payloads', () => {
    const labels = collectPlatformLabelCandidates({
      data: {
        blocks: [
          { title: '情绪', creatives: [{ resources: [{ uiElement: { mainTitle: { title: '放松' } } }] }] },
          { title: '曲风', creatives: [{ resources: [{ uiElement: { mainTitle: { title: '流行' } } }] }] },
        ],
      },
    });
    expect(labels).toContain('放松');
    expect(labels).toContain('情绪');
  });
});

describe('emotionCorrectionLearningMath', () => {
  it('biases when enough consistent corrections exist', () => {
    const next = applyEmotionCorrectionBias('energetic', [
      { songId: 1, originalEmotion: 'energetic', correctedEmotion: 'happy', correctedAt: 1 },
      { songId: 2, originalEmotion: 'energetic', correctedEmotion: 'happy', correctedAt: 2 },
      { songId: 3, originalEmotion: 'energetic', correctedEmotion: 'happy', correctedAt: 3 },
    ]);
    expect(next).toBe('happy');
  });

  it('keeps inference when samples are sparse', () => {
    const next = applyEmotionCorrectionBias('sad', [
      { songId: 1, originalEmotion: 'sad', correctedEmotion: 'melancholic', correctedAt: 1 },
    ]);
    expect(next).toBe('sad');
  });
});
