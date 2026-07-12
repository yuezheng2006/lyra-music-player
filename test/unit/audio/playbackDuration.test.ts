import { describe, expect, it } from 'vitest';
import {
    formatTime,
    resolvePlaybackDurationSec,
    resolveSongDurationSec,
} from '@/utils/appPlaybackHelpers';

// test/unit/audio/playbackDuration.test.ts

describe('playback duration helpers', () => {
    it('formats non-finite times as 00:00', () => {
        expect(formatTime(Number.NaN)).toBe('00:00');
        expect(formatTime(Number.POSITIVE_INFINITY)).toBe('00:00');
        expect(formatTime(125)).toBe('02:05');
    });

    it('converts catalog millisecond duration to seconds', () => {
        expect(resolveSongDurationSec({ duration: 245000, dt: 0 })).toBe(245);
        expect(resolveSongDurationSec({ duration: 0, dt: 181000 })).toBe(181);
        expect(resolveSongDurationSec(null)).toBe(0);
    });

    it('prefers finite media duration over catalog fallback', () => {
        expect(resolvePlaybackDurationSec(200.5, 180)).toBe(200.5);
        expect(resolvePlaybackDurationSec(Number.NaN, 180)).toBe(180);
        expect(resolvePlaybackDurationSec(Number.POSITIVE_INFINITY, 180)).toBe(180);
        expect(resolvePlaybackDurationSec(0, 0)).toBe(0);
    });
});
