import { describe, expect, it } from 'vitest';
import {
    COVER_PARTICLE_RIPPLE_MAX,
    createCoverParticleBandTracker,
    resolveCoverParticleRippleSlotIndex,
    stepCoverParticleBandTracker,
} from '../../../src/utils/visualizer/coverParticleBandTrackerMath';

describe('coverParticleBandTrackerMath', () => {
    it('fires a single onset when transient crosses the high edge', () => {
        const tracker = createCoverParticleBandTracker();
        const quiet: boolean[] = [];
        for (let i = 0; i < 20; i += 1) {
            quiet.push(stepCoverParticleBandTracker(tracker, 0.1, 0.05).onset);
        }
        expect(quiet.some(Boolean)).toBe(false);

        const hit = stepCoverParticleBandTracker(tracker, 0.95, 0.05);
        expect(hit.onset).toBe(true);

        // Stays armed through the peak without re-firing.
        const sustain = stepCoverParticleBandTracker(tracker, 0.9, 0.05);
        expect(sustain.onset).toBe(false);
    });

    it('maps band cursors into private slot ranges', () => {
        expect(resolveCoverParticleRippleSlotIndex(0, 0)).toBe(0);
        expect(resolveCoverParticleRippleSlotIndex(0, 3)).toBe(3);
        expect(resolveCoverParticleRippleSlotIndex(1, 0)).toBe(4);
        expect(resolveCoverParticleRippleSlotIndex(2, 1)).toBe(9);
        expect(COVER_PARTICLE_RIPPLE_MAX).toBe(12);
    });
});
