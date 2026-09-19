import {
    BASS_RIPPLE_WEBGL_EFFECT,
    shouldEnableBassRippleWebGL,
} from './bassRippleWebGL';
import {
    BLOOM_WEBGL_EFFECT,
    shouldEnableBloomWebGL,
} from './bloomWebGL';
import type { Interactive3dSceneTuning } from '../../../../../types';
import type { GeometricQualityProfile } from '../../geometricQuality';
import type { CoverParticlePresetModule } from '../presets/types';

// src/components/visualizer/geometric/webgl/effects/coverParticleEffectRegistry.ts
// Maps live WebGL sub-effects (tuning keys) to module metadata and enable gates.

export type CoverParticleWebGLEffectId = 'bass-ripple' | 'bloom-particles' | 'cover-particles';

export interface CoverParticleWebGLEffectDefinition {
    id: CoverParticleWebGLEffectId;
    tuningKey: keyof Interactive3dSceneTuning;
    moduleName: string;
    implementationKind: 'webgl-runtime' | 'webgl-effect';
}

export const COVER_PARTICLE_WEBGL_EFFECTS: CoverParticleWebGLEffectDefinition[] = [
    {
        id: 'cover-particles',
        tuningKey: 'enableCoverParticles',
        moduleName: 'CoverParticleStage',
        implementationKind: 'webgl-runtime',
    },
    {
        id: BASS_RIPPLE_WEBGL_EFFECT.id,
        tuningKey: BASS_RIPPLE_WEBGL_EFFECT.tuningKey,
        moduleName: BASS_RIPPLE_WEBGL_EFFECT.moduleName,
        implementationKind: 'webgl-effect',
    },
    {
        id: BLOOM_WEBGL_EFFECT.id,
        tuningKey: BLOOM_WEBGL_EFFECT.tuningKey,
        moduleName: BLOOM_WEBGL_EFFECT.moduleName,
        implementationKind: 'webgl-effect',
    },
];

export const getCoverParticleWebGLEffectDefinition = (id: CoverParticleWebGLEffectId) =>
    COVER_PARTICLE_WEBGL_EFFECTS.find(effect => effect.id === id);

/** Resolve which live WebGL sub-effects are enabled for the current frame. */
export const resolveCoverParticleWebGLEffectEnablement = (input: {
    tuning?: Interactive3dSceneTuning;
    qualityProfile?: GeometricQualityProfile;
    presetModule: CoverParticlePresetModule;
    smartAtmosphereEnabled: boolean;
}): Record<CoverParticleWebGLEffectId, boolean> => ({
    'cover-particles': input.tuning?.enableCoverParticles !== false,
    'bass-ripple': shouldEnableBassRippleWebGL(input),
    'bloom-particles': shouldEnableBloomWebGL({
        tuning: input.tuning,
        tier: input.qualityProfile?.tier ?? 'balanced',
    }),
});
