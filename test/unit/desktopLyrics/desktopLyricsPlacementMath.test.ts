import { describe, expect, it } from 'vitest';
import {
    clampDesktopLyricsYFactor,
    snapDesktopLyricsYFactor,
} from '../../../src/utils/desktopLyrics/desktopLyricsPlacementMath';

// test/unit/desktopLyrics/desktopLyricsPlacementMath.test.ts
// 0–1 clamp and middle-line snap for desktop lyrics.

describe('desktopLyricsPlacementMath', () => {
    it('clamps to 0–1', () => {
        expect(clampDesktopLyricsYFactor(-0.2)).toBe(0);
        expect(clampDesktopLyricsYFactor(1.4)).toBe(1);
        expect(clampDesktopLyricsYFactor(Number.NaN)).toBe(0.76);
    });

    it('snaps values near 0.5 to the middle', () => {
        expect(snapDesktopLyricsYFactor(0.48)).toBe(0.5);
        expect(snapDesktopLyricsYFactor(0.52)).toBe(0.5);
        expect(snapDesktopLyricsYFactor(0.76)).toBe(0.76);
    });
});
