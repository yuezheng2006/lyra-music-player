import { describe, expect, it } from 'vitest';
import {
    GPU_RECOVERY_MAY_TOUCH_PLAYBACK,
    resolveMediaClocksFromAudioElement,
    resolveProgressFillPercent,
} from '@/utils/playback/mediaClockIsolationMath';

// Guarantees dock/lyric clocks stay independent of visualizer RAF / WebGL.

describe('mediaClockIsolationMath', () => {
    it('derives dock and lyric clocks from audio.currentTime alone', () => {
        expect(resolveMediaClocksFromAudioElement({
            audioCurrentTimeSec: 62.5,
            lyricTimelineOffsetMs: 0,
        })).toEqual({ currentTimeSec: 62.5, lyricTimeSec: 62.5 });

        expect(resolveMediaClocksFromAudioElement({
            audioCurrentTimeSec: 10,
            lyricTimelineOffsetMs: 500,
        })).toEqual({ currentTimeSec: 10, lyricTimeSec: 9.5 });
    });

    it('computes progress fill without requiring a canvas or rAF', () => {
        expect(resolveProgressFillPercent(62, 222)).toBeCloseTo(27.927, 2);
        expect(resolveProgressFillPercent(0, 222)).toBe(0);
        expect(resolveProgressFillPercent(300, 222)).toBe(100);
    });

    it('forbids GPU recovery from mutating playback', () => {
        expect(GPU_RECOVERY_MAY_TOUCH_PLAYBACK).toBe(false);
    });
});
