import { INTERACTIVE3D_WEBGL_PRESET_INDEX } from '../mineradioPresetMap';
import { resolveCoverParticlePresetRuntime } from '../coverParticlePresetRuntime';
import type { CoverParticlePresetModule } from './types';

// src/components/visualizer/geometric/webgl/presets/emilyPreset.ts
// Cover (emily) visual preset — silk plane + bass ripples.

export const emilyPreset: CoverParticlePresetModule = {
    id: 'emily',
    shaderPresetIndex: INTERACTIVE3D_WEBGL_PRESET_INDEX.emily,
    moduleName: 'emilyPreset',
    supportsBassRipples: true,
    hidesParticlePoints: false,
    orbitBaseline: { theta: 0, phi: 0.08, radius: 6.6 },
    resolveRuntimeProfile: () => resolveCoverParticlePresetRuntime('emily'),
    applyUniforms: ({ uniforms }) => {
        uniforms.uEdgeEnabled.value = 0;
        uniforms.uCoverWarp.value = 1;
        uniforms.uImmersion.value = 0;
    },
    resolveStageBackground: () => (
        'radial-gradient(circle at 50% 46%, rgba(49, 57, 53, 0.16) 0%, rgba(7, 25, 34, 0.42) 58%, rgba(2, 8, 12, 0.64) 100%)'
    ),
};
