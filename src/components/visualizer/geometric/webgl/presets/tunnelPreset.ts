import { INTERACTIVE3D_WEBGL_PRESET_INDEX } from '../mineradioPresetMap';
import { resolveCoverParticlePresetRuntime } from '../coverParticlePresetRuntime';
import type { CoverParticlePresetModule } from './types';

// src/components/visualizer/geometric/webgl/presets/tunnelPreset.ts
// Tunnel (mineradioTunnel) visual preset — helical cover pipe.

export const tunnelPreset: CoverParticlePresetModule = {
    id: 'mineradioTunnel',
    shaderPresetIndex: INTERACTIVE3D_WEBGL_PRESET_INDEX.mineradioTunnel,
    moduleName: 'tunnelPreset',
    supportsBassRipples: false,
    hidesParticlePoints: false,
    orbitBaseline: { theta: 0, phi: 0.03, radius: 6.05 },
    resolveRuntimeProfile: () => resolveCoverParticlePresetRuntime('mineradioTunnel'),
    applyUniforms: ({ uniforms }) => {
        uniforms.uEdgeEnabled.value = 1;
        uniforms.uCoverWarp.value = 1;
        uniforms.uImmersion.value = 0;
    },
    resolveStageBackground: () => 'transparent',
};
