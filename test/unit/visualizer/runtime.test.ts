import { describe, expect, it } from 'vitest';
import { getUpcomingLines } from '@/components/visualizer/runtime';

// test/unit/visualizer/runtime.test.ts
// Covers lyric lookahead for the K-song presentation before the first active line.

const lines = [
    { startTime: 5, endTime: 8, fullText: 'first', words: [] },
    { startTime: 10, endTime: 13, fullText: 'second', words: [] },
    { startTime: 15, endTime: 18, fullText: 'third', words: [] },
];

describe('visualizer runtime lookahead', () => {
    it('returns the first upcoming lines before the opening lyric becomes active', () => {
        expect(getUpcomingLines(lines, -1, 2, 2)).toEqual([
            lines[0],
            lines[1],
        ]);
    });

    it('keeps the normal next-line window once a lyric is active', () => {
        expect(getUpcomingLines(lines, 0, 2, 6)).toEqual([
            lines[1],
            lines[2],
        ]);
    });
});
