import { describe, expect, it } from 'vitest';
import { shouldSkipCoverParticleFrameWhileYielded } from '../../../src/utils/visualizer/coverParticleYieldFramePolicy';

// test/unit/visualizer/coverParticleYieldFramePolicy.test.ts

describe('shouldSkipCoverParticleFrameWhileYielded', () => {
    it('keeps painting while not paused', () => {
        expect(shouldSkipCoverParticleFrameWhileYielded({
            paused: false,
            morphLive: false,
        })).toBe(false);
    });

    it('skips ticks while yielded with no morph', () => {
        expect(shouldSkipCoverParticleFrameWhileYielded({
            paused: true,
            morphLive: false,
        })).toBe(true);
    });

    it('keeps painting a live preset morph under yield', () => {
        expect(shouldSkipCoverParticleFrameWhileYielded({
            paused: true,
            morphLive: true,
        })).toBe(false);
    });
});
