import { describe, expect, it } from 'vitest';
import {
    COVER_PARTICLE_POINT_SCALE_MUL,
    resolveCoverParticlePointScale,
    resolveCoverSwapDepthHold,
    shouldHoldCoverThroughLoadFailure,
    shouldHoldCoverThroughNullUrl,
    shouldShowCoverLoadMist,
} from '@/components/visualizer/geometric/webgl/coverParticleDisplayTuning';

// test/unit/visualizer/coverParticleDisplayTuning.test.ts

describe('coverParticleDisplayTuning', () => {
    it('keeps cover particle point scale near the preset value without the old 1.48 boost', () => {
        expect(COVER_PARTICLE_POINT_SCALE_MUL).toBeLessThanOrEqual(1);
        expect(resolveCoverParticlePointScale(1)).toBe(1);
        expect(resolveCoverParticlePointScale(1.28)).toBeCloseTo(1.28);
        expect(resolveCoverParticlePointScale(1.48)).toBeLessThan(1.48 * 1.48);
    });

    it('shows loading mist only for empty cold starts without a pending cover url', () => {
        expect(shouldShowCoverLoadMist(false)).toBe(true);
        expect(shouldShowCoverLoadMist(true)).toBe(false);
        expect(shouldShowCoverLoadMist(false, true)).toBe(false);
        expect(shouldShowCoverLoadMist(true, true)).toBe(false);
    });

    it('holds the live cover through transient null urls and load failures', () => {
        expect(shouldHoldCoverThroughNullUrl(true)).toBe(true);
        expect(shouldHoldCoverThroughNullUrl(false)).toBe(false);
        expect(shouldHoldCoverThroughLoadFailure(true)).toBe(true);
        expect(shouldHoldCoverThroughLoadFailure(false)).toBe(false);
    });

    it('keeps depth elevated during cover swaps', () => {
        expect(resolveCoverSwapDepthHold(0.9)).toBeGreaterThanOrEqual(0.85);
        expect(resolveCoverSwapDepthHold(0.3)).toBeGreaterThanOrEqual(0.2);
        expect(resolveCoverSwapDepthHold(0)).toBe(0.2);
    });
});
