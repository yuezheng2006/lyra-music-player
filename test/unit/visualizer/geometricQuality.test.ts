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
        expect(target).toBeGreaterThanOrEqual(160);
    });

    it('high tier keeps ripples and larger burst budget', () => {
        const profile = resolveGeometricQualityProfile(1920 * 1080, 'high');
        expect(profile.enableRipples).toBe(true);
        expect(profile.maxBeatParticles).toBeGreaterThan(30);
        expect(profile.frameSkip).toBeGreaterThanOrEqual(2);
        expect(profile.devicePixelRatioCap).toBeLessThanOrEqual(1.25);
    });

    it('balanced/lite skip frames for CPU headroom', () => {
        expect(resolveGeometricQualityProfile(921600, 'balanced').frameSkip).toBeGreaterThanOrEqual(2);
        expect(resolveGeometricQualityProfile(921600, 'lite').frameSkip).toBeGreaterThanOrEqual(8);
    });

    it('keeps the lite WebGL retry profile sparse', () => {
        const profile = resolveGeometricQualityProfile(921600, 'lite');
        expect(profile.devicePixelRatioCap).toBe(1);
        expect(profile.particleTarget).toBeLessThanOrEqual(72);
        expect(profile.maxBeatParticles).toBeLessThanOrEqual(4);
        expect(profile.enableRipples).toBe(false);
    });
});
