import { describe, expect, it } from 'vitest';
import {
    clampGlobalLyricTimelineOffsetMs,
    resolveEffectiveLyricTimelineOffsetMs,
} from '@/utils/playback/globalLyricTimelineOffsetMath';

// test/unit/playback/globalLyricTimelineOffsetMath.test.ts

describe('globalLyricTimelineOffsetMath', () => {
    it('clamps device offset to ±2000ms', () => {
        expect(clampGlobalLyricTimelineOffsetMs(2500)).toBe(2000);
        expect(clampGlobalLyricTimelineOffsetMs(-2500)).toBe(-2000);
        expect(clampGlobalLyricTimelineOffsetMs(Number.NaN)).toBe(0);
    });

    it('stacks per-song and global offsets', () => {
        expect(resolveEffectiveLyricTimelineOffsetMs(80, -30)).toBe(50);
    });
});
