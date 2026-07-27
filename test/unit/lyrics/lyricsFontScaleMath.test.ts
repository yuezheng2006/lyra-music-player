import { describe, expect, it } from 'vitest';
import {
    clampLyricsFontScale,
    DEFAULT_LYRICS_FONT_SCALE,
    LYRICS_FONT_SCALE_MAX,
    LYRICS_FONT_SCALE_MIN,
    resolveImmersiveLyricsFontScale,
} from '@/utils/lyrics/lyricsFontScaleMath';

// test/unit/lyrics/lyricsFontScaleMath.test.ts

describe('lyricsFontScaleMath', () => {
    it('defaults above the old 1.0 baseline', () => {
        expect(DEFAULT_LYRICS_FONT_SCALE).toBeGreaterThan(1);
    });

    it('clamps into the supported settings range', () => {
        expect(clampLyricsFontScale(0.5)).toBe(LYRICS_FONT_SCALE_MIN);
        expect(clampLyricsFontScale(2)).toBe(LYRICS_FONT_SCALE_MAX);
        expect(clampLyricsFontScale(1.15)).toBe(1.15);
        expect(clampLyricsFontScale(Number.NaN)).toBe(DEFAULT_LYRICS_FONT_SCALE);
    });

    it('damps user font-scale on immersive / fullscreen stages', () => {
        expect(resolveImmersiveLyricsFontScale(1)).toBe(1);
        expect(resolveImmersiveLyricsFontScale(1.25)).toBeCloseTo(1 + 0.25 * 0.55, 5);
        expect(resolveImmersiveLyricsFontScale(1.25)).toBeLessThan(1.25);
    });
});
