// src/utils/moodEngine/emotionCorrectionLearningMath.ts
// Bias local emotion inference using accumulated user corrections.

import type { EmotionTag, UserEmotionCorrection } from '../../types/moodEngine';

export type CorrectionBiasOptions = {
  /** Minimum corrections from the same original tag before biasing. */
  minSamples?: number;
  /** Required share of the winning corrected tag among those samples. */
  majorityRatio?: number;
};

/**
 * If users repeatedly correct the same local tag to another, prefer that tag.
 */
export function applyEmotionCorrectionBias(
  inferred: EmotionTag,
  corrections: UserEmotionCorrection[],
  { minSamples = 2, majorityRatio = 0.6 }: CorrectionBiasOptions = {},
): EmotionTag {
  const fromSame = corrections.filter((item) => item.originalEmotion === inferred);
  if (fromSame.length < minSamples) {
    return inferred;
  }

  const votes = new Map<EmotionTag, number>();
  for (const item of fromSame) {
    if (item.correctedEmotion === inferred) continue;
    votes.set(item.correctedEmotion, (votes.get(item.correctedEmotion) || 0) + 1);
  }

  let best: EmotionTag | null = null;
  let bestCount = 0;
  for (const [emotion, count] of votes) {
    if (count > bestCount) {
      best = emotion;
      bestCount = count;
    }
  }

  if (!best) return inferred;
  if (bestCount / fromSame.length < majorityRatio) return inferred;
  return best;
}
