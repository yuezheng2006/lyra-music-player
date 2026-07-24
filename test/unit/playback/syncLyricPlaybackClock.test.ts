import { describe, expect, it } from 'vitest';
import {
    resolveLyricLineIndexForTime,
    resolveLyricPlaybackTimes,
} from '@/utils/playback/syncLyricPlaybackClock';
import type { LyricData } from '@/types';

// Guards lyric clock math used by RAF + audio timeupdate backup.

describe('syncLyricPlaybackClock', () => {
    it('applies lyric timeline offset in seconds', () => {
        expect(resolveLyricPlaybackTimes({
            audioCurrentTimeSec: 12.5,
            lyricTimelineOffsetMs: 500,
        })).toEqual({
            currentTimeSec: 12.5,
            lyricTimeSec: 12,
        });
    });

    it('resolves active lyric line from lyric time', () => {
        const lyrics = {
            lines: [
                { startTime: 0, endTime: 5, text: 'a', words: [] },
                { startTime: 5, endTime: 10, text: 'b', words: [] },
                { startTime: 10, endTime: 15, text: 'c', words: [] },
            ],
        } as unknown as LyricData;

        expect(resolveLyricLineIndexForTime(lyrics, 0)).toBe(0);
        expect(resolveLyricLineIndexForTime(lyrics, 5.2)).toBe(1);
        expect(resolveLyricLineIndexForTime(lyrics, 11)).toBe(2);
        expect(resolveLyricLineIndexForTime(null, 3)).toBe(-1);
    });
});
