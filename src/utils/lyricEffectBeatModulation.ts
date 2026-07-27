import type { LyricVisualEffectIntensity } from './lyricVisualEffects';
import type { LyricEffectPackId } from './lyricEffectPacks';
import { clamp01, clampRange } from './atmosphere/math';

// src/utils/lyricEffectBeatModulation.ts
// Map atmosphere beatPulse → subtle pack multipliers (garnish only; lyrics stay primary).

/** Peak multipliers stay near 1 so packs never upstage glyphs. */
export const LYRIC_PACK_BEAT_PEAK = {
  echo: 1.12,
  glow: 1.14,
  glitch: 1.12,
  scan: 1.1,
} as const;

/** Chorus may lift peaks a hair — still garnish, never a hero flash. */
export const LYRIC_PACK_BEAT_CHORUS_PEAK = {
  echo: 1.15,
  glow: 1.16,
  glitch: 1.14,
  scan: 1.12,
} as const;

/** Weak-beat floor: slight breathe-down, not a flash cut. */
export const LYRIC_PACK_BEAT_FLOOR = 0.97;

const INTENSITY_GAIN: Record<LyricVisualEffectIntensity, number> = {
  subtle: 0.45,
  normal: 0.65,
  strong: 0.82,
  extreme: 1,
};

export type LyricEffectBeatModulation = {
  echoMul: number;
  glowMul: number;
  glitchMul: number;
  scanMul: number;
};

const INERT_MODULATION: LyricEffectBeatModulation = {
  echoMul: 1,
  glowMul: 1,
  glitchMul: 1,
  scanMul: 1,
};

/**
 * Blend smoothed groove pulse with a short onset spike so lyric packs lock to hits
 * without waiting for the slow atmosphere release envelope.
 * Still clamped — does not raise pack peaks by itself.
 */
export function resolveLyricBeatDrive(pulse: number, onset = 0): number {
  const p = clamp01(pulse);
  const o = clamp01(onset);
  // Prefer onset when it leads; keep a groove floor so weak bars still breathe.
  const lead = Math.max(0, o - p);
  return clamp01(p * 0.62 + o * 0.48 + lead * 0.28);
}

/**
 * Soft-knee beat amount: strong hits approach 1, weak sits near 0 with short visual punch.
 * Atmosphere already applies release smoothing; this only shapes presentation.
 */
export function shapeLyricEffectBeatAmount(beatPulse: number): number {
  const p = clamp01(beatPulse);
  if (p < 0.02) return 0;
  // Gentle curve: avoid a hard step at mid pulse; keep headroom for restraint.
  return Math.pow(p, 0.9);
}

function modulateAxis(
  amount: number,
  gain: number,
  peak: number,
): number {
  const span = Math.max(0, peak - 1);
  const lifted = 1 + amount * span * gain;
  // Weak beats breathe slightly below 1; strong stay within peak.
  const breathed = LYRIC_PACK_BEAT_FLOOR + (lifted - LYRIC_PACK_BEAT_FLOOR) * (0.35 + 0.65 * amount);
  return clampRange(breathed, LYRIC_PACK_BEAT_FLOOR, peak);
}

export type ResolveLyricEffectBeatModulationOptions = {
  /** Active line is chorus — tiny extra lift within chorus peaks. */
  isChorus?: boolean;
};

/**
 * Resolve garnish multipliers from beat + pack + shared intensity.
 * `none` is always inert (all 1). Peaks stay ~1.0–1.16 even on chorus.
 */
export function resolveLyricEffectBeatModulation(
  beatPulse: number,
  packId: LyricEffectPackId | unknown,
  intensity: LyricVisualEffectIntensity = 'strong',
  options?: ResolveLyricEffectBeatModulationOptions,
): LyricEffectBeatModulation {
  if (packId !== 'yehuo' && packId !== 'neon' && packId !== 'glitch') {
    return INERT_MODULATION;
  }

  const amount = shapeLyricEffectBeatAmount(beatPulse);
  const gain = (INTENSITY_GAIN[intensity] ?? INTENSITY_GAIN.strong)
    * (options?.isChorus ? 1.08 : 1);
  const peaks = options?.isChorus ? LYRIC_PACK_BEAT_CHORUS_PEAK : LYRIC_PACK_BEAT_PEAK;

  if (packId === 'yehuo') {
    return {
      echoMul: modulateAxis(amount, gain, peaks.echo),
      glowMul: modulateAxis(amount, gain * 0.85, peaks.glow),
      glitchMul: 1,
      scanMul: 1,
    };
  }

  if (packId === 'neon') {
    return {
      echoMul: 1,
      glowMul: modulateAxis(amount, gain, peaks.glow),
      glitchMul: 1,
      scanMul: modulateAxis(amount, gain, peaks.scan),
    };
  }

  // glitch — tiny RGB / offset only
  return {
    echoMul: 1,
    glowMul: modulateAxis(amount, gain * 0.5, options?.isChorus ? 1.1 : 1.08),
    glitchMul: modulateAxis(amount, gain, peaks.glitch),
    scanMul: 1,
  };
}

/** CSS custom properties written by the dazibao stage RAF host. */
export const LYRIC_PACK_BEAT_CSS_VARS = {
  echoMul: '--lyric-pack-echo-mul',
  glowMul: '--lyric-pack-glow-mul',
  glitchMul: '--lyric-pack-glitch-mul',
  scanMul: '--lyric-pack-scan-mul',
} as const;

export function writeLyricEffectBeatCssVars(
  host: HTMLElement,
  modulation: LyricEffectBeatModulation,
): void {
  host.style.setProperty(LYRIC_PACK_BEAT_CSS_VARS.echoMul, modulation.echoMul.toFixed(3));
  host.style.setProperty(LYRIC_PACK_BEAT_CSS_VARS.glowMul, modulation.glowMul.toFixed(3));
  host.style.setProperty(LYRIC_PACK_BEAT_CSS_VARS.glitchMul, modulation.glitchMul.toFixed(3));
  host.style.setProperty(LYRIC_PACK_BEAT_CSS_VARS.scanMul, modulation.scanMul.toFixed(3));
}

export function clearLyricEffectBeatCssVars(host: HTMLElement): void {
  host.style.removeProperty(LYRIC_PACK_BEAT_CSS_VARS.echoMul);
  host.style.removeProperty(LYRIC_PACK_BEAT_CSS_VARS.glowMul);
  host.style.removeProperty(LYRIC_PACK_BEAT_CSS_VARS.glitchMul);
  host.style.removeProperty(LYRIC_PACK_BEAT_CSS_VARS.scanMul);
}
