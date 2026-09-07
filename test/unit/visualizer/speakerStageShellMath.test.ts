import { describe, expect, it } from 'vitest';
import {
    resolveSpeakerGlassStyle,
    resolveSpeakerParticleYield,
} from '../../../src/utils/visualizer/speakerStageShellMath';

// test/unit/visualizer/speakerStageShellMath.test.ts

describe('resolveSpeakerGlassStyle', () => {
    it('returns null when speaker is off', () => {
        expect(resolveSpeakerGlassStyle({ speakerActive: false })).toBeNull();
    });

    it('never enables full-viewport backdrop blur (CPU/GPU cost over particles)', () => {
        const full = resolveSpeakerGlassStyle({
            speakerActive: true,
            qualityTier: 'high',
            isElectron: false,
        });
        expect(full?.tier).toBe('full');
        expect(full?.useBackdropFilter).toBe(false);
        expect(full?.backdropBlurPx).toBe(0);
    });

    it('demotes Electron / lite to soft fog without blur', () => {
        const electron = resolveSpeakerGlassStyle({
            speakerActive: true,
            isElectron: true,
            qualityTier: 'high',
        });
        expect(electron?.tier).toBe('soft');
        expect(electron?.useBackdropFilter).toBe(false);
        expect(electron?.backdropBlurPx).toBe(0);
        // Must stay light enough that Particles / Plasma remain visible behind lyrics.
        expect(electron?.fogOpacity).toBeLessThanOrEqual(0.16);
        expect(electron?.vignetteOpacity).toBeLessThanOrEqual(0.28);

        const lite = resolveSpeakerGlassStyle({
            speakerActive: true,
            qualityTier: 'lite',
            isElectron: false,
        });
        expect(lite?.tier).toBe('soft');
        expect(lite?.useBackdropFilter).toBe(false);
    });

    it('respects reduced motion', () => {
        const style = resolveSpeakerGlassStyle({
            speakerActive: true,
            reducedMotion: true,
            qualityTier: 'high',
        });
        expect(style?.tier).toBe('fog');
        expect(style?.useBackdropFilter).toBe(false);
    });
});

describe('resolveSpeakerParticleYield', () => {
    it('caps bloom and rhythm when speaker is active', () => {
        const yielded = resolveSpeakerParticleYield({
            speakerActive: true,
            bloomStrength: 1.2,
            rhythmIntensity: 0.95,
        });
        expect(yielded.bloomStrength).toBeLessThanOrEqual(0.42);
        expect(yielded.rhythmIntensity).toBeLessThanOrEqual(0.55);
    });

    it('passes through when speaker is off', () => {
        const yielded = resolveSpeakerParticleYield({
            speakerActive: false,
            bloomStrength: 1.2,
            rhythmIntensity: 0.95,
        });
        expect(yielded.bloomStrength).toBe(1.2);
        expect(yielded.rhythmIntensity).toBe(0.95);
    });
});
