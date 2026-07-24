import type { Interactive3dSceneTuning, MineradioVisualPresetId } from '../../types';
import {
    coverParticleGridForQualityTier,
} from '../../components/visualizer/geometric/webgl/buildCoverParticleGeometry';
import type { GeometricQualityTier } from '../../components/visualizer/geometric/geometricQuality';
import { normalizeInteractive3dVisualPreset } from '../../components/visualizer/geometric/mineradioVisualPresets';

// src/utils/performance/interactive3dFrameCostMath.ts
// Pure cost model for interactive3d WebGL stack (cover particles + optional ambient).

export type Interactive3dFrameCostBreakdown = {
    preset: MineradioVisualPresetId;
    tier: GeometricQualityTier;
    /** Grid resolved the same way CoverParticleRuntime.rebuildCoverGeometry does. */
    grid: number;
    particleCount: number;
    bloomEnabled: boolean;
    /** Shared geometry drawn twice when bloom is on. */
    vertexInvocations: number;
    ambientWebGLMounted: boolean;
    /** Relative shader-cost units for ranking configs (not milliseconds). */
    relativeCost: number;
};

/**
 * Cover particle grid for any visual preset — always honors quality tier.
 * Emily no longer forces resolution 1.55.
 */
export const resolveCoverParticleGridForPreset = (
    _preset: MineradioVisualPresetId | unknown,
    tier: GeometricQualityTier,
): number => coverParticleGridForQualityTier(tier);

/**
 * Bloom doubles vertex invocations; only allow it on the high quality tier.
 */
export const shouldEnableCoverParticleBloom = (
    tuningEnabled: boolean | undefined,
    tier: GeometricQualityTier,
): boolean => Boolean(tuningEnabled) && tier === 'high';

/**
 * Ambient is a second WebGL + RAF; only mount on high when the user opts in.
 */
export const shouldMountAmbientForTier = (
    ambientEnabled: boolean | undefined,
    tier: GeometricQualityTier,
): boolean => Boolean(ambientEnabled) && tier === 'high';

const estimateVertexShaderWeight = (preset: MineradioVisualPresetId): number => {
    // Emily cover path: multi-octave snoise + ripple loop + cover/edge/prev textures.
    if (preset === 'emily') return 1;
    if (preset === 'mineradioVinyl' || preset === 'mineradioGalaxy') return 0.85;
    if (preset === 'quantumCube') return 0.55;
    return 0.7;
};

/**
 * Estimate per-frame relative cost for the interactive3d WebGL path.
 */
export const estimateInteractive3dFrameCost = (input: {
    tuning: Pick<
        Interactive3dSceneTuning,
        'visualPreset' | 'enableCoverParticles' | 'enableBloomParticles'
    >;
    tier: GeometricQualityTier;
    ambientEnabled?: boolean;
}): Interactive3dFrameCostBreakdown => {
    const preset = normalizeInteractive3dVisualPreset(input.tuning.visualPreset);
    const coverOn = input.tuning.enableCoverParticles !== false;
    const bloomEnabled = coverOn && shouldEnableCoverParticleBloom(
        input.tuning.enableBloomParticles,
        input.tier,
    );
    const grid = coverOn ? resolveCoverParticleGridForPreset(preset, input.tier) : 0;
    const particleCount = grid * grid;
    const vertexInvocations = particleCount * (bloomEnabled ? 2 : 1);
    const ambientWebGLMounted = shouldMountAmbientForTier(input.ambientEnabled, input.tier);
    const shaderWeight = estimateVertexShaderWeight(preset);
    const ambientWeight = ambientWebGLMounted ? particleCount * 0.35 : 0;
    const relativeCost = Math.round(vertexInvocations * shaderWeight + ambientWeight);

    return {
        preset,
        tier: input.tier,
        grid,
        particleCount,
        bloomEnabled,
        vertexInvocations,
        ambientWebGLMounted,
        relativeCost,
    };
};
