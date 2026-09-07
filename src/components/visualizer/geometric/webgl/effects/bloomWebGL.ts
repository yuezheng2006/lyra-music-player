import type * as THREE from 'three';
import type { Interactive3dSceneTuning } from '../../../../../types';
import type { GeometricQualityTier } from '../../geometricQuality';
import { shouldEnableCoverParticleBloom } from '../../../../../utils/performance/interactive3dFrameCostMath';
import type { CoverParticleUniforms } from '../coverParticleMaterials';
import type { CoverParticlePresetModule } from '../presets/types';

// src/components/visualizer/geometric/webgl/effects/bloomWebGL.ts
// WebGL bloom pass strength + point visibility for cover particles.

export const BLOOM_WEBGL_EFFECT = {
    id: 'bloom-particles' as const,
    tuningKey: 'enableBloomParticles' as const,
    moduleName: 'bloomWebGL',
};

export const shouldEnableBloomWebGL = (input: {
    tuning?: Interactive3dSceneTuning;
    tier: GeometricQualityTier;
}): boolean => shouldEnableCoverParticleBloom(
    input.tuning?.enableBloomParticles,
    input.tier,
);

/** Resolve bloom strength and update bloomPoints / uniforms. */
export const applyBloomWebGL = (input: {
    tuning?: Interactive3dSceneTuning;
    tier: GeometricQualityTier;
    smartAtmosphereEnabled: boolean;
    presetModule: CoverParticlePresetModule;
    uniforms: CoverParticleUniforms;
    bloomPoints: THREE.Points | null;
    coverPoints: THREE.Points | null;
}): number => {
    const bloomEnabled = shouldEnableBloomWebGL({
        tuning: input.tuning,
        tier: input.tier,
    });
    const bloomStrength = bloomEnabled
        ? Math.min((input.tuning?.bloomStrength ?? 0.62) * 1.22, 1.6)
            * (input.smartAtmosphereEnabled ? 1 : 0.38)
        : 0;
    input.uniforms.uBloomStrength.value = bloomStrength;
    const hidePoints = input.presetModule.hidesParticlePoints;
    if (input.bloomPoints) {
        input.bloomPoints.visible = !hidePoints && bloomStrength > 0.01;
    }
    if (input.coverPoints) {
        input.coverPoints.visible = !hidePoints;
    }
    return bloomStrength;
};
