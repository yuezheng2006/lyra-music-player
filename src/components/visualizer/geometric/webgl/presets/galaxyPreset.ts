import { INTERACTIVE3D_WEBGL_PRESET_INDEX } from '../mineradioPresetMap';
import { resolveCoverParticlePresetRuntime } from '../coverParticlePresetRuntime';
import type { CoverParticlePresetModule } from './types';

// src/components/visualizer/geometric/webgl/presets/galaxyPreset.ts
// Galaxy (mineradioGalaxy) visual preset — dust field + cover color stream.

export const galaxyPreset: CoverParticlePresetModule = {
    id: 'mineradioGalaxy',
    shaderPresetIndex: INTERACTIVE3D_WEBGL_PRESET_INDEX.mineradioGalaxy,
    moduleName: 'galaxyPreset',
    supportsBassRipples: false,
    hidesParticlePoints: false,
    orbitBaseline: { theta: -0.52, phi: 0.34, radius: 9.2 },
    resolveRuntimeProfile: () => resolveCoverParticlePresetRuntime('mineradioGalaxy'),
    applyUniforms: ({ uniforms }) => {
        uniforms.uEdgeEnabled.value = 1;
        uniforms.uCoverWarp.value = 1;
        uniforms.uImmersion.value = 0;
    },
    resolveStageBackground: () => 'transparent',
};
