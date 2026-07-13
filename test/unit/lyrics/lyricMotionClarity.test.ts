import { describe, expect, it } from 'vitest';
import { LYRIC_MOTION_BLUR_PX, lyricBlurFilter } from '@/utils/lyrics/lyricMotionClarity';

// test/unit/lyrics/lyricMotionClarity.test.ts

describe('lyricMotionClarity', () => {
    it('keeps waiting glyphs optically sharp', () => {
        expect(LYRIC_MOTION_BLUR_PX.waiting).toBe(0);
        expect(lyricBlurFilter(LYRIC_MOTION_BLUR_PX.waiting)).toBe('none');
    });

    it('caps enter/exit blur below the old muddy 10–20px range', () => {
        expect(LYRIC_MOTION_BLUR_PX.enter).toBeLessThanOrEqual(3);
        expect(LYRIC_MOTION_BLUR_PX.exit).toBeLessThanOrEqual(6);
        expect(LYRIC_MOTION_BLUR_PX.exitFast).toBeLessThanOrEqual(4);
        expect(lyricBlurFilter(LYRIC_MOTION_BLUR_PX.exit)).toBe('blur(5px)');
    });
});
