import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING } from '@/types';
import {
    coverParticleGridForQualityTier,
} from '@/components/visualizer/geometric/webgl/buildCoverParticleGeometry';
import {
    estimateInteractive3dFrameCost,
    resolveCoverParticleGridForPreset,
    shouldEnableCoverParticleBloom,
    shouldMountAmbientForTier,
} from '@/utils/performance/interactive3dFrameCostMath';

// Guards interactive3d CPU budget after performance tightening.

describe('interactive3dFrameCostMath', () => {
    it('makes emily honor quality tier like other presets', () => {
        expect(resolveCoverParticleGridForPreset('emily', 'lite')).toBe(
            coverParticleGridForQualityTier('lite'),
        );
        expect(resolveCoverParticleGridForPreset('emily', 'balanced')).toBe(
            coverParticleGridForQualityTier('balanced'),
        );
        expect(resolveCoverParticleGridForPreset('emily', 'high')).toBe(
            coverParticleGridForQualityTier('high'),
        );
    });

    it('allows bloom only on high tier', () => {
        expect(shouldEnableCoverParticleBloom(true, 'high')).toBe(true);
        expect(shouldEnableCoverParticleBloom(true, 'balanced')).toBe(false);
        expect(shouldEnableCoverParticleBloom(true, 'lite')).toBe(false);
        expect(shouldEnableCoverParticleBloom(false, 'high')).toBe(false);
    });

    it('mounts ambient only on high tier when enabled', () => {
        expect(shouldMountAmbientForTier(true, 'high')).toBe(true);
        expect(shouldMountAmbientForTier(true, 'balanced')).toBe(false);
        expect(shouldMountAmbientForTier(true, 'lite')).toBe(false);
        expect(shouldMountAmbientForTier(false, 'high')).toBe(false);
    });

    it('keeps default high stack far below legacy emily+bloom blow-up', () => {
        const defaultHigh = estimateInteractive3dFrameCost({
            tuning: DEFAULT_INTERACTIVE3D_SCENE_TUNING,
            tier: 'high',
            ambientEnabled: false,
        });
        const liteSafe = estimateInteractive3dFrameCost({
            tuning: {
                ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
                enableBloomParticles: true,
            },
            tier: 'lite',
            ambientEnabled: true,
        });

        // high ≈ 101² without default bloom (tightened for Electron GPU helper)
        expect(defaultHigh.grid).toBe(101);
        expect(defaultHigh.bloomEnabled).toBe(false);
        expect(defaultHigh.vertexInvocations).toBe(10_201);
        expect(defaultHigh.ambientWebGLMounted).toBe(false);

        expect(liteSafe.grid).toBe(coverParticleGridForQualityTier('lite'));
        expect(liteSafe.bloomEnabled).toBe(false);
        expect(liteSafe.ambientWebGLMounted).toBe(false);
        // Legacy blow-up was ~66_978 vertex invocations; stay well under a quarter of that.
        expect(defaultHigh.vertexInvocations).toBeLessThan(16_000);
        expect(defaultHigh.relativeCost / Math.max(1, liteSafe.relativeCost)).toBeLessThan(4);
    });
});
