// src/components/visualizer/geometric/webgl/coverParticleDisplayTuning.ts
// Shared display tuning for cover-particle point size and load transition.

/** Multiplier applied to per-preset pointScale. Keep ≤1 so particles stay fine-grained. */
export const COVER_PARTICLE_POINT_SCALE_MUL = 1;

export const resolveCoverParticlePointScale = (presetPointScale: number): number => (
    Math.min(Math.max(0, presetPointScale) * COVER_PARTICLE_POINT_SCALE_MUL, 2.05)
);

/**
 * Loading mist is a teal/lavender unordered cloud. Only use it for a true empty
 * cold start (no live cover AND no cover URL currently being loaded).
 * Track changes always have a pending URL or an active cover — never mist.
 */
export const shouldShowCoverLoadMist = (
    hasActiveCover: boolean,
    hasPendingCoverUrl = false,
): boolean => !hasActiveCover && !hasPendingCoverUrl;

/**
 * Transient null coverUrl on track change must not tear down the live particle field.
 */
export const shouldHoldCoverThroughNullUrl = (hasActiveCover: boolean): boolean => hasActiveCover;

/**
 * Failed next-cover fetch should keep the previous cover mounted.
 */
export const shouldHoldCoverThroughLoadFailure = (hasActiveCover: boolean): boolean => hasActiveCover;

/**
 * While swapping covers, keep depth elevated so the field does not flatten into scatter.
 */
export const resolveCoverSwapDepthHold = (currentDepth: number): number => (
    currentDepth > 0.5 ? Math.max(currentDepth, 0.85) : Math.max(currentDepth, 0.2)
);
