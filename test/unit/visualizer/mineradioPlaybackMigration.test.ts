import { describe, expect, it } from 'vitest';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
} from '../../../src/types';
import { applyMineradioVisualPreset } from '../../../src/components/visualizer/geometric/mineradioVisualPresets';
import { resolveShouldShowCoverParticleWebGL } from '../../../src/components/visualizer/geometric/webgl/coverParticleWebGLGateMath';

// Cover WebGL gate module — preset changes stay here, not in React stage/store.

describe('Mineradio playback migration', () => {
    it('enables Emily cover WebGL with default tuning', () => {
        expect(resolveShouldShowCoverParticleWebGL({
            tuning: DEFAULT_INTERACTIVE3D_SCENE_TUNING,
        })).toBe(true);
    });

    it('applies Emily preset with cover particles enabled', () => {
        const tuned = applyMineradioVisualPreset('emily', DEFAULT_INTERACTIVE3D_SCENE_TUNING);
        expect(tuned.visualPreset).toBe('emily');
        expect(tuned.enableCoverParticles).toBe(true);
        expect(resolveShouldShowCoverParticleWebGL({ tuning: tuned })).toBe(true);
    });

    it('keeps cover-particle WebGL available on Electron (lite ceiling handles cost)', () => {
        const tuned = applyMineradioVisualPreset('emily', DEFAULT_INTERACTIVE3D_SCENE_TUNING);
        expect(resolveShouldShowCoverParticleWebGL({
            tuning: tuned,
            isElectron: true,
        })).toBe(true);
    });
});
