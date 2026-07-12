// src/components/visualizer/geometric/webgl/coverParticleDisplayTuning.ts
// Shared display tuning for cover-particle point size and load transition.

/** Multiplier applied to per-preset pointScale. Keep ≤1 so particles stay fine-grained. */
export const COVER_PARTICLE_POINT_SCALE_MUL = 1;

export const resolveCoverParticlePointScale = (presetPointScale: number): number => (
    Math.min(Math.max(0, presetPointScale) * COVER_PARTICLE_POINT_SCALE_MUL, 2.05)
);

/**
 * Loading mist morphs the particle field into a teal/lavender cloud that reads as a
 * different 3D preset. Only show it before the first cover texture is on screen.
 */
export const shouldShowCoverLoadMist = (hasActiveCover: boolean): boolean => !hasActiveCover;
