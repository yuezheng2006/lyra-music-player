import { describe, expect, it } from 'vitest';
import {
    getCoverParticleContrastRatio,
    parseCssColorToCoverParticleRgb,
    resolveCoverParticleContrastLift,
} from '../../../src/utils/visualizer/coverParticleContrastMath';

describe('coverParticleContrastMath', () => {
    it('parses hex colors', () => {
        expect(parseCssColorToCoverParticleRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(parseCssColorToCoverParticleRgb('#ffffff')).toEqual({ r: 1, g: 1, b: 1 });
        expect(parseCssColorToCoverParticleRgb('not-a-color')).toBeNull();
    });

    it('lifts emission on dark backgrounds and leaves light ones alone', () => {
        const darkLift = resolveCoverParticleContrastLift({ r: 0.03, g: 0.04, b: 0.05 });
        const lightLift = resolveCoverParticleContrastLift({ r: 0.92, g: 0.93, b: 0.94 });
        expect(darkLift).toBeGreaterThan(1);
        expect(lightLift).toBe(1);
        expect(getCoverParticleContrastRatio(
            { r: 1, g: 1, b: 1 },
            { r: 0, g: 0, b: 0 },
        )).toBeGreaterThan(10);
    });
});
