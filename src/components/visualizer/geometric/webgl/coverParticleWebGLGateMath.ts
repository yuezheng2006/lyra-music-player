import type { Interactive3dSceneTuning } from '../../../../types';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import { shouldRenderMineradioWebGL } from './mineradioPresetMap';

// src/components/visualizer/geometric/webgl/coverParticleWebGLGateMath.ts
// Pure gate for whether cover-particle WebGL may mount. Preset/cost changes stay here.

export const resolveShouldShowCoverParticleWebGL = (input: {
    tuning?: Interactive3dSceneTuning;
    isElectron?: boolean;
}): boolean => {
    void input.isElectron;
    const preset = normalizeInteractive3dVisualPreset(input.tuning?.visualPreset);
    const enabled = input.tuning?.enableCoverParticles ?? true;
    return shouldRenderMineradioWebGL(preset, enabled);
};
