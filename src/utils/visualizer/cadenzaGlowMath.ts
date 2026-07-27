import {
    resolveLyricVisualEffectIntensityScale,
    type LyricVisualEffectIntensity,
} from '../lyricVisualEffects';

// src/utils/visualizer/cadenzaGlowMath.ts
// Cadenza glow = per-mode tuning × global lyric effect intensity.

/** Combine Cadenza tuning glow with the shared visual-effect intensity dial. */
export const resolveCadenzaGlowIntensity = (
    tuningGlowIntensity: number,
    visualEffectIntensity: LyricVisualEffectIntensity | unknown,
): number => {
    const base = Number.isFinite(tuningGlowIntensity) ? Math.max(0, tuningGlowIntensity) : 0;
    return base * resolveLyricVisualEffectIntensityScale(visualEffectIntensity);
};
