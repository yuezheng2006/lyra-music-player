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

        // high = Mineradio 183² without default bloom
        expect(defaultHigh.grid).toBe(183);
        expect(defaultHigh.bloomEnabled).toBe(false);
        expect(defaultHigh.vertexInvocations).toBe(33_489);
        expect(defaultHigh.ambientWebGLMounted).toBe(false);

        expect(liteSafe.grid).toBe(coverParticleGridForQualityTier('lite'));
        expect(liteSafe.bloomEnabled).toBe(false);
        expect(liteSafe.ambientWebGLMounted).toBe(false);
        expect(defaultHigh.vertexInvocations).toBeLessThanOrEqual(33_489);
        expect(defaultHigh.relativeCost / Math.max(1, liteSafe.relativeCost)).toBeLessThan(5);
    });
});
