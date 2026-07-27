// src/utils/visualizer/latentBackgroundMath.ts
// Pure audio → shader speed helpers for the Latent background.

export type LatentBackgroundColorSource = 'cover-theme' | 'cover-only';

export interface LatentShaderThemeColors {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const normalizeAudio = (value: number) => Math.min(1, Math.max(0, value / 255));
const clampShaderSpeed = (value: number) => Math.min(2, Math.max(0, value));
const clampAudioAmount = (value: number) => Math.min(1, Math.max(0, value));
const easeTowards = (current: number, target: number, amount: number) => (
  current + (target - current) * amount
);

const PAUSED_SPEED_SCALE = 0.12;

/** Weighted broadband energy from five audio bands (0–255). */
export const resolveLatentBroadbandEnergy = (
  bass: number,
  lowMid: number,
  mid: number,
  vocal: number,
  treble: number,
) => {
  const broadbandEnergy = (
    normalizeAudio(bass) * 0.22
    + normalizeAudio(lowMid) * 0.18
    + normalizeAudio(mid) * 0.22
    + normalizeAudio(vocal) * 0.28
    + normalizeAudio(treble) * 0.1
  );
  return Math.pow(broadbandEnergy, 0.55);
};

/** Accents energy rises so shader speed lands on musical onsets. */
export const resolveLatentOnsetPulse = (
  currentEnergy: number,
  previousEnergy: number,
  previousPulse: number,
) => Math.max(
  previousPulse * 0.84,
  clampAudioAmount((currentEnergy - previousEnergy) * 7),
);

export const resolveLatentBeatSpeedTarget = (
  broadbandEnergy: number,
  onsetPulse: number,
) => clampAudioAmount(broadbandEnergy * 0.42 + onsetPulse * 0.85);

export const resolveLatentAudioSpeedTarget = (
  broadbandEnergy: number,
  onsetPulse: number,
  enhancedBeatResponse: boolean,
) => enhancedBeatResponse
  ? resolveLatentBeatSpeedTarget(broadbandEnergy, onsetPulse)
  : clampAudioAmount(broadbandEnergy);

export const resolveLatentShaderSpeed = (
  baseSpeed: number,
  audioSpeed: number,
  audioAmount: number,
  paused: boolean,
) => clampShaderSpeed(
  paused
    ? baseSpeed * PAUSED_SPEED_SCALE
    : easeTowards(baseSpeed, audioSpeed, audioAmount),
);

/** Approximate relative luminance from #rgb / #rrggbb. */
export const resolveHexRelativeLuminance = (hex: string): number | null => {
  const value = hex.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(value);
  const long = /^#([0-9a-f]{6})$/i.exec(value);
  let r = 0;
  let g = 0;
  let b = 0;
  if (short) {
    const [rs, gs, bs] = short[1].split('');
    r = Number.parseInt(rs + rs, 16) / 255;
    g = Number.parseInt(gs + gs, 16) / 255;
    b = Number.parseInt(bs + bs, 16) / 255;
  } else if (long) {
    const raw = long[1];
    r = Number.parseInt(raw.slice(0, 2), 16) / 255;
    g = Number.parseInt(raw.slice(2, 4), 16) / 255;
    b = Number.parseInt(raw.slice(4, 6), 16) / 255;
  } else {
    return null;
  }
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Mean cover-palette brightness in 0..1 (fallback mid-dark when empty). */
export const resolveLatentCoverBrightness = (coverColors: string[]): number => {
  const samples = coverColors
    .map(resolveHexRelativeLuminance)
    .filter((value): value is number => value != null);
  if (!samples.length) return 0.32;
  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
};

/**
 * Raise theme wash when the cover palette is bright so lyric glyphs stay readable
 * on MeshGradient / Dithering stacks.
 */
export const resolveLatentReadableOverlayOpacity = (
  baseOpacity: number,
  coverBrightness: number,
  overlayEnabled: boolean,
) => {
  if (!overlayEnabled) return 0;
  const base = Math.min(1, Math.max(0, baseOpacity));
  const boost = Math.max(0, (coverBrightness - 0.4) / 0.5) * 0.24;
  return Math.min(0.75, base + boost);
};

/** Map cover palette + theme into dithering/mesh color slots. */
export const resolveLatentShaderColors = (
  coverColors: string[],
  theme: LatentShaderThemeColors,
  colorSource: LatentBackgroundColorSource,
) => {
  const primary = coverColors[0] ?? theme.secondaryColor;
  if (colorSource === 'cover-only') {
    const secondary = coverColors[1] ?? primary;
    const tertiary = coverColors[2] ?? secondary;
    const quaternary = coverColors[3] ?? primary;
    const quinary = coverColors[4] ?? secondary;
    const senary = coverColors[5] ?? tertiary;
    return {
      ditheringBack: tertiary,
      ditheringFront: primary,
      mesh: [primary, secondary, tertiary, quaternary, quinary, senary],
    };
  }
  const secondary = coverColors[1] ?? theme.primaryColor;
  const tertiary = coverColors[2] ?? primary;
  const quaternary = coverColors[3] ?? secondary;
  return {
    ditheringBack: theme.backgroundColor,
    ditheringFront: primary,
    mesh: [primary, secondary, tertiary, quaternary, theme.backgroundColor, theme.accentColor],
  };
};
