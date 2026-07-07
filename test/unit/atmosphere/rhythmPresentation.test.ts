import { describe, expect, it } from 'vitest';
import {
    buildRhythmPresentation,
    mapRhythmOrbitBoost,
    mapRhythmScaleBoost,
    resolvePresentationBeatPulse,
    shouldTriggerBeatBurst,
    synthesizeBeatPulseFromAudioPower,
} from '../../../src/utils/atmosphere/rhythmPresentation';

describe('rhythmPresentation', () => {
    it('falls back to audio power when beat pulse is near zero', () => {
        expect(resolvePresentationBeatPulse(0, 120)).toBeGreaterThan(0.4);
        expect(resolvePresentationBeatPulse(0.6, 0)).toBe(0.6);
    });

    it('keeps lyric and background scale curves aligned', () => {
        const rhythm = buildRhythmPresentation(0.7, 0.4, 0.9, 0.55);
        expect(rhythm.scaleBoost).toBe(mapRhythmScaleBoost(rhythm));
        expect(rhythm.orbitBoost).toBe(mapRhythmOrbitBoost(rhythm));
    });

    it('uses a shared beat crossing threshold', () => {
        expect(shouldTriggerBeatBurst(0.55, 0.4)).toBe(true);
        expect(shouldTriggerBeatBurst(0.4, 0.55)).toBe(false);
    });

    it('synthesizes a softer pulse from audio power', () => {
        expect(synthesizeBeatPulseFromAudioPower(0)).toBe(0);
        expect(synthesizeBeatPulseFromAudioPower(160)).toBeCloseTo(0.72, 2);
    });
});
