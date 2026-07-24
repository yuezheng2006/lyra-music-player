// src/utils/visualizer/coverParticleContrastMath.ts
// Theme-vs-background contrast helpers for cover-particle legibility.

export interface CoverParticleRgb {
  r: number;
  g: number;
  b: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Relative luminance for linear RGB (WCAG-style weights). */
export const getCoverParticleRelativeLuminance = (color: CoverParticleRgb): number => (
  0.2126 * clamp01(color.r) + 0.7152 * clamp01(color.g) + 0.0722 * clamp01(color.b)
);

export const getCoverParticleContrastRatio = (
  foreground: CoverParticleRgb,
  background: CoverParticleRgb,
): number => {
  const foregroundLuminance = getCoverParticleRelativeLuminance(foreground);
  const backgroundLuminance = getCoverParticleRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * How much to brighten particle emission so cover-sampled dark points stay readable
 * on a given shell background. Returns 1 when already fine; up to ~1.35 when background
 * is close to typical dark cover samples.
 */
export const resolveCoverParticleContrastLift = (
  background: CoverParticleRgb,
  minimumContrast = 3.2,
): number => {
  // Approximate a mid-dark cover sample that often disappears on dark shells.
  const sample: CoverParticleRgb = { r: 0.18, g: 0.18, b: 0.2 };
  const ratio = getCoverParticleContrastRatio(sample, background);
  if (ratio >= minimumContrast) return 1;
  const deficit = (minimumContrast - ratio) / minimumContrast;
  return 1 + clamp01(deficit) * 0.35;
};

/** Parse #rgb / #rrggbb into linear-ish 0..1 channels (good enough for lift heuristics). */
export const parseCssColorToCoverParticleRgb = (value: string | null | undefined): CoverParticleRgb | null => {
  if (!value) return null;
  const hex = value.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    const [r, g, b] = short[1].split('').map(ch => Number.parseInt(ch + ch, 16) / 255);
    return { r, g, b };
  }
  const long = /^#([0-9a-f]{6})$/i.exec(hex);
  if (long) {
    const raw = long[1];
    return {
      r: Number.parseInt(raw.slice(0, 2), 16) / 255,
      g: Number.parseInt(raw.slice(2, 4), 16) / 255,
      b: Number.parseInt(raw.slice(4, 6), 16) / 255,
    };
  }
  return null;
};
