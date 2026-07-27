import type { MineradioVisualPresetId } from '../../types';

// src/utils/visualizer/coverParticleMorphMath.ts
// Preset-to-preset layout morph for shipped cover-particle styles.

/** Preset switch morph duration (smoothstep-eased in CoverNumericTween). */
export const COVER_PARTICLE_MORPH_MS = 780;

/** Shipped interactive3d layouts that can morph into each other. */
export const COVER_PARTICLE_MORPHABLE_PRESETS: readonly MineradioVisualPresetId[] = [
    'emily',
    'mineradioTunnel',
    'mineradioOrbit',
    'mineradioGalaxy',
];

const MORPHABLE = new Set<MineradioVisualPresetId>(COVER_PARTICLE_MORPHABLE_PRESETS);

/** Only the four shipped WebGL layouts participate in morph. */
export const canMorphCoverParticlePresets = (
    from: MineradioVisualPresetId | null | undefined,
    to: MineradioVisualPresetId | null | undefined,
): boolean => {
    if (!from || !to || from === to) return false;
    return MORPHABLE.has(from) && MORPHABLE.has(to);
};

/** Smoothstep ease matching CoverNumericTween / CoverColorMixTween. */
export const easeCoverParticleMorph = (t: number): number => {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
};

/** Mix two rest positions after easing morph progress. */
export const mixCoverParticleMorphPosition = (
    from: readonly [number, number, number],
    to: readonly [number, number, number],
    morphT: number,
): [number, number, number] => {
    const w = easeCoverParticleMorph(morphT);
    return [
        from[0] + (to[0] - from[0]) * w,
        from[1] + (to[1] - from[1]) * w,
        from[2] + (to[2] - from[2]) * w,
    ];
};

/** Keep morph live while tween is in flight. */
export const resolveCoverParticleMorphLive = (morphT: number, tweening: boolean): number => {
    if (!tweening) return 0;
    return morphT >= 1 ? 0 : 1;
};
