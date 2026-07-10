import { describe, expect, it } from 'vitest';
import { resolveClampFontPx } from '@/components/visualizer/monet/monetLyricsModel';

// test/unit/visualizer/resolveClampFontPx.test.ts
// Monet fonts must track the lyric column, not the full window.

describe('resolveClampFontPx', () => {
    it('sizes from the measured lyric column when provided', () => {
        const fromColumn = resolveClampFontPx(1.2, 5.2, 2.1, 480);
        const fromWideWindow = resolveClampFontPx(1.2, 5.2, 2.1, 1600);

        expect(fromColumn).toBeCloseTo(24.96, 1);
        expect(fromWideWindow).toBeCloseTo(33.6, 1);
        expect(fromColumn).toBeLessThan(fromWideWindow);
    });

    it('clamps to min/max rem bounds', () => {
        expect(resolveClampFontPx(1.2, 5.2, 2.1, 80)).toBeCloseTo(19.2, 1);
        expect(resolveClampFontPx(1.2, 5.2, 2.1, 4000)).toBeCloseTo(33.6, 1);
    });
});
