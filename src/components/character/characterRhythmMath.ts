import type { BeatEvent, BeatMap } from '../../types/atmosphere';
import type { EmotionTag } from '../../types/moodEngine';
import type { CharacterActionId } from '../../types/character';
import { classifyAmbientRhythmTier } from '../../utils/atmosphere/ambientVisualRhythm';

// src/components/character/characterRhythmMath.ts
// Emotion / BPM / beat-strength helpers for Ticket 08 character drive.

/**
 * Map mood-engine emotion tags onto preset character actions.
 */
export function resolveCharacterActionForEmotion(emotion: EmotionTag): CharacterActionId {
  switch (emotion) {
    case 'happy':
    case 'uplifting':
      return 'dance-fast';
    case 'energetic':
    case 'angry':
      return 'cheer';
    case 'sad':
    case 'melancholic':
      return 'sad';
    case 'calm':
    case 'relaxed':
    case 'romantic':
      return 'dance-slow';
    case 'tense':
      return 'dance-fast';
    case 'neutral':
    default:
      return 'idle';
  }
}

/**
 * Infer BPM from beatMap.gridStep (seconds per beat).
 */
export function resolveBpmFromBeatMap(beatMap: BeatMap | null | undefined): number | null {
  const step = beatMap?.gridStep;
  if (step == null || !(step > 0.05) || !(step < 2.5)) return null;
  const bpm = 60 / step;
  if (!Number.isFinite(bpm)) return null;
  return Math.min(220, Math.max(40, bpm));
}

/**
 * Map BeatEvent.strength (0–1) onto a one-shot emphasis scale boost.
 * Strong beats → larger amplitude; weak beats stay subtle.
 */
export function resolveBeatEmphasis(strength: number, tier: ReturnType<typeof classifyAmbientRhythmTier>): number {
  const s = Math.min(1, Math.max(0, strength));
  const tierBoost = tier === 'phrase' ? 1.35 : tier === 'bar' ? 1.15 : 1;
  return 1 + s * 0.22 * tierBoost;
}

/**
 * Choose whether a rhythm tier should also switch action (phrase only by default).
 */
export function shouldSwitchActionOnRhythmTier(
  tier: ReturnType<typeof classifyAmbientRhythmTier>,
): boolean {
  return tier === 'phrase';
}

/**
 * On phrase accents, briefly prefer a more energetic action for upbeat moods.
 */
export function resolvePhraseAccentAction(
  baseAction: CharacterActionId,
): CharacterActionId {
  if (baseAction === 'dance-slow' || baseAction === 'idle') return 'dance-fast';
  if (baseAction === 'dance-fast') return 'cheer';
  return baseAction;
}

/**
 * Classify + resolve emphasis for a single BeatEvent.
 */
export function resolveCharacterBeatResponse(event: BeatEvent): {
  tier: ReturnType<typeof classifyAmbientRhythmTier>;
  emphasis: number;
  switchAction: boolean;
} {
  const tier = classifyAmbientRhythmTier(event);
  return {
    tier,
    emphasis: resolveBeatEmphasis(event.strength ?? 0.5, tier),
    switchAction: shouldSwitchActionOnRhythmTier(tier),
  };
}
