import { describe, expect, it } from 'vitest';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
} from '../../../src/types';
import { applyMineradioVisualPreset } from '../../../src/components/visualizer/geometric/mineradioVisualPresets';
import { shouldShowCoverParticleWebGL } from '../../../src/components/visualizer/geometric/webgl/CoverParticleWebGLStage';

describe('Mineradio playback migration', () => {
    it('enables Emily cover WebGL with default tuning', () => {
        expect(shouldShowCoverParticleWebGL(DEFAULT_INTERACTIVE3D_SCENE_TUNING)).toBe(true);
    });

    it('applies Emily preset with cover particles enabled', () => {
        const tuned = applyMineradioVisualPreset('emily', DEFAULT_INTERACTIVE3D_SCENE_TUNING);
        expect(tuned.visualPreset).toBe('emily');
        expect(tuned.enableCoverParticles).toBe(true);
        expect(shouldShowCoverParticleWebGL(tuned)).toBe(true);
    });
});
