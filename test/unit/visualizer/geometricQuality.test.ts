import { describe, expect, it } from 'vitest';
import {
    resolveGeometricQualityProfile,
    scaleParticleTarget,
} from '@/components/visualizer/geometric/geometricQuality';

describe('geometricQuality', () => {
    it('returns lite profile for reduced motion override', () => {
        const profile = resolveGeometricQualityProfile(921600, 'lite');
        expect(profile.tier).toBe('lite');
        expect(profile.enableDomShapes).toBe(false);
        expect(profile.enableRipples).toBe(false);
    });

    it('scales particle target down for smaller viewports', () => {
        const profile = resolveGeometricQualityProfile(640 * 480, 'balanced');
        const target = scaleParticleTarget(profile, 640 * 480);
        expect(target).toBeLessThanOrEqual(profile.particleTarget);
        expect(target).toBeGreaterThanOrEqual(180);
    });

    it('high tier keeps ripples and larger burst budget', () => {
        const profile = resolveGeometricQualityProfile(1920 * 1080, 'high');
        expect(profile.enableRipples).toBe(true);
        expect(profile.maxBeatParticles).toBeGreaterThan(40);
    });
});
