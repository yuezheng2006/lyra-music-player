// src/utils/lyricEffectPacks.ts
// Lyric effect packs: yehuo / neon / glitch presentation (not visualizer modes).

import type { LyricVisualEffectIntensity } from './lyricVisualEffects';

export type LyricEffectPackId = 'none' | 'yehuo' | 'neon' | 'glitch';

export const LYRIC_EFFECT_PACK_STORAGE_KEY = 'lyric_effect_pack_id';
export const DEFAULT_LYRIC_EFFECT_PACK_ID: LyricEffectPackId = 'none';

export const LYRIC_EFFECT_PACK_IDS: LyricEffectPackId[] = ['none', 'yehuo', 'neon', 'glitch'];

export type LyricEffectPackSuggestion = {
  fontPresetId?: string;
  colorPresetId?: string;
};

export type ResolvedLyricEffectPack = {
  id: LyricEffectPackId;
  echo: boolean;
  echoScale: number;
  echoOpacity: number;
  glowBoost: number;
  neonScan: boolean;
  glitch: boolean;
  glitchOffsetPx: number;
  suggestion: LyricEffectPackSuggestion;
};

/** Bias toward restraint so packs stay garnish over lyrics. */
const INTENSITY_SCALE: Record<LyricVisualEffectIntensity, number> = {
  subtle: 0.42,
  normal: 0.68,
  strong: 0.85,
  extreme: 1,
};

const isLyricEffectPackId = (value: unknown): value is LyricEffectPackId => (
  value === 'none' || value === 'yehuo' || value === 'neon' || value === 'glitch'
);

export const parseLyricEffectPackId = (value: unknown): LyricEffectPackId => (
  isLyricEffectPackId(value) ? value : DEFAULT_LYRIC_EFFECT_PACK_ID
);

export const getLyricEffectPackSuggestion = (packId: LyricEffectPackId): LyricEffectPackSuggestion => {
  if (packId === 'yehuo') {
    return { fontPresetId: 'yehuo-brush', colorPresetId: 'dazibao-red' };
  }
  return {};
};

/**
 * Resolve pack presentation numbers from pack id + shared intensity.
 */
export function resolveLyricEffectPack(
  packId: LyricEffectPackId | unknown,
  intensity: LyricVisualEffectIntensity = 'strong',
): ResolvedLyricEffectPack {
  const id = parseLyricEffectPackId(packId);
  const scale = INTENSITY_SCALE[intensity] ?? 1;
  const suggestion = getLyricEffectPackSuggestion(id);

  if (id === 'none') {
    return {
      id,
      echo: false,
      echoScale: 1,
      echoOpacity: 0,
      glowBoost: 0,
      neonScan: false,
      glitch: false,
      glitchOffsetPx: 0,
      suggestion,
    };
  }

  if (id === 'yehuo') {
    return {
      id,
      echo: true,
      // Dual-layer stays readable: modest scale / opacity only.
      echoScale: 1.04 + 0.04 * scale,
      echoOpacity: 0.14 + 0.08 * scale,
      glowBoost: 0.2 * scale,
      neonScan: false,
      glitch: false,
      glitchOffsetPx: 0,
      suggestion,
    };
  }

  if (id === 'neon') {
    return {
      id,
      echo: false,
      echoScale: 1,
      echoOpacity: 0,
      glowBoost: 0.32 + 0.2 * scale,
      neonScan: true,
      glitch: false,
      glitchOffsetPx: 0,
      suggestion,
    };
  }

  // glitch — tiny RGB offset; never obscures glyphs.
  return {
    id,
    echo: false,
    echoScale: 1,
    echoOpacity: 0,
    glowBoost: 0.08 * scale,
    neonScan: false,
    glitch: true,
    glitchOffsetPx: 0.6 + 0.9 * scale,
    suggestion,
  };
}
