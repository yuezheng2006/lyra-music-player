import { describe, expect, it } from 'vitest';
import {
    COVER_PARTICLE_POINT_SCALE_MUL,
    resolveCoverParticlePointScale,
    shouldShowCoverLoadMist,
} from '@/components/visualizer/geometric/webgl/coverParticleDisplayTuning';

describe('coverParticleDisplayTuning', () => {
    it('keeps cover particle point scale near the preset value without the old 1.48 boost', () => {
        expect(COVER_PARTICLE_POINT_SCALE_MUL).toBeLessThanOrEqual(1);
        expect(resolveCoverParticlePointScale(1)).toBe(1);
        expect(resolveCoverParticlePointScale(1.28)).toBeCloseTo(1.28);
        expect(resolveCoverParticlePointScale(1.48)).toBeLessThan(1.48 * 1.48);
    });

    it('shows loading mist only when no cover is currently displayed', () => {
        expect(shouldShowCoverLoadMist(false)).toBe(true);
        expect(shouldShowCoverLoadMist(true)).toBe(false);
    });
});
