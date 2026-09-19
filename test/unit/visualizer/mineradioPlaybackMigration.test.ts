import { describe, expect, it } from 'vitest';
import {
    DEFAULT_INTERACTIVE3D_SCENE_TUNING,
} from '../../../src/types';
import { applyMineradioVisualPreset } from '../../../src/components/visualizer/geometric/mineradioVisualPresets';
import { resolveShouldShowCoverParticleWebGL } from '../../../src/components/visualizer/geometric/webgl/coverParticleWebGLGateMath';

// Legacy CoverParticle gate — live path is R3F; WebGL only via explicit force flag.

describe('Mineradio playback migration', () => {
    it('disables legacy cover WebGL by default (R3F stage replaced it)', () => {
        expect(resolveShouldShowCoverParticleWebGL({
            tuning: DEFAULT_INTERACTIVE3D_SCENE_TUNING,
        })).toBe(false);
    });

    it('keeps Emily preset cover particles enabled for the R3F stage', () => {
        const tuned = applyMineradioVisualPreset('emily', DEFAULT_INTERACTIVE3D_SCENE_TUNING);
        expect(tuned.visualPreset).toBe('emily');
        expect(tuned.enableCoverParticles).toBe(true);
        expect(resolveShouldShowCoverParticleWebGL({ tuning: tuned })).toBe(false);
    });

    it('does not resurrect legacy WebGL on Electron without force flag', () => {
        const tuned = applyMineradioVisualPreset('emily', DEFAULT_INTERACTIVE3D_SCENE_TUNING);
        expect(resolveShouldShowCoverParticleWebGL({
            tuning: tuned,
            isElectron: true,
        })).toBe(false);
    });

    it('allows legacy CoverParticle WebGL only when forceWebGL is set', () => {
        expect(resolveShouldShowCoverParticleWebGL({
            tuning: DEFAULT_INTERACTIVE3D_SCENE_TUNING,
            forceWebGL: true,
        })).toBe(true);
    });
});
