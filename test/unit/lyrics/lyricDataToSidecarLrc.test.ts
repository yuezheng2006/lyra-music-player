import { describe, expect, it } from 'vitest';
import type { LyricData } from '@/types';
import {
    formatLrcTimestamp,
    lyricDataToSidecarLrc,
} from '@/utils/lyrics/lyricDataToSidecarLrc';

// test/unit/lyrics/lyricDataToSidecarLrc.test.ts

describe('lyricDataToSidecarLrc', () => {
    it('formats mm:ss.xx timestamps', () => {
        expect(formatLrcTimestamp(0)).toBe('[00:00.00]');
        expect(formatLrcTimestamp(65.2)).toBe('[01:05.20]');
        expect(formatLrcTimestamp(59.999)).toBe('[01:00.00]');
    });

    it('serializes lines and translations', () => {
        const lyrics: LyricData = {
            lines: [
                {
                    words: [{ text: '好一朵', startTime: 1, endTime: 2 }],
                    startTime: 1.5,
                    endTime: 3,
                    fullText: '好一朵美丽的茉莉花',
                    translation: 'A beautiful jasmine flower',
                },
            ],
        };
        const { lrc, translationLrc } = lyricDataToSidecarLrc(lyrics);
        expect(lrc).toBe('[00:01.50]好一朵美丽的茉莉花\n');
        expect(translationLrc).toBe('[00:01.50]A beautiful jasmine flower\n');
    });

    it('returns empty strings without lines', () => {
        expect(lyricDataToSidecarLrc(null)).toEqual({ lrc: '', translationLrc: '' });
    });
});
