// src/utils/lyrics/lyricsFontScaleMath.ts
// Shared lyrics font-scale default + clamp for settings / visualizers.

/** Default user-facing lyric size (was 1.0 — felt small on modern player stages). */
export const DEFAULT_LYRICS_FONT_SCALE = 1.15;

export const LYRICS_FONT_SCALE_MIN = 0.85;
export const LYRICS_FONT_SCALE_MAX = 1.4;

/** Clamp lyrics font scale into the supported settings range. */
export const clampLyricsFontScale = (
    value: number,
    fallback: number = DEFAULT_LYRICS_FONT_SCALE,
): number => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(LYRICS_FONT_SCALE_MAX, Math.max(LYRICS_FONT_SCALE_MIN, value));
};

/**
 * Fullscreen already widens the lyric plane; damp user font-scale so 115%/125%
 * does not explode on immersive stages.
 */
export const resolveImmersiveLyricsFontScale = (
    fontScale: number,
    dampen = 0.55,
): number => {
    const clamped = clampLyricsFontScale(fontScale, 1);
    const mix = Math.min(1, Math.max(0, dampen));
    return 1 + (clamped - 1) * mix;
};
