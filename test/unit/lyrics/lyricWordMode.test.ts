import { describe, expect, it } from 'vitest';
import {
    KARAOKE_WAITING_WORD_OPACITY,
    parseLyricWordMode,
    resolveLyricRailAfterCount,
    resolveLyricWordAnimateKey,
    resolveUpcomingLyricLines,
    resolveWaitingWordPresentation,
    shouldShowUpcomingLyrics,
    shouldUseKaraokeWipe,
} from '@/utils/lyrics/lyricWordMode';

// test/unit/lyrics/lyricWordMode.test.ts
// Covers default / karaoke / ktv lyric-word policy.

const lines = [
    { startTime: 1, endTime: 2, fullText: 'a', words: [] },
    { startTime: 3, endTime: 4, fullText: 'b', words: [] },
];

describe('lyricWordMode', () => {
    it('parses known modes and falls back to default', () => {
        expect(parseLyricWordMode('karaoke')).toBe('karaoke');
        expect(parseLyricWordMode('ktv')).toBe('ktv');
        expect(parseLyricWordMode('default')).toBe('default');
        expect(parseLyricWordMode('nope')).toBe('default');
    });

    it('hides upcoming lines in default mode and shows them in karaoke/ktv', () => {
        expect(shouldShowUpcomingLyrics('default')).toBe(false);
        expect(shouldShowUpcomingLyrics('karaoke')).toBe(true);
        expect(shouldShowUpcomingLyrics('ktv')).toBe(true);
        expect(resolveUpcomingLyricLines(lines, 'default')).toEqual([]);
        expect(resolveUpcomingLyricLines(lines, 'karaoke')).toEqual(lines);
        expect(resolveUpcomingLyricLines(lines, 'ktv')).toEqual(lines);
        expect(resolveLyricRailAfterCount('default')).toBe(0);
        expect(resolveLyricRailAfterCount('karaoke')).toBe(2);
        expect(resolveLyricRailAfterCount('ktv')).toBe(2);
        expect(resolveLyricRailAfterCount('karaoke', 3)).toBe(3);
    });

    it('enables traditional wipe only in ktv mode', () => {
        expect(shouldUseKaraokeWipe('default')).toBe(false);
        expect(shouldUseKaraokeWipe('karaoke')).toBe(false);
        expect(shouldUseKaraokeWipe('ktv')).toBe(true);
    });

    it('previews waiting in-line words in karaoke and ktv', () => {
        expect(resolveWaitingWordPresentation('default')).toEqual({
            opacity: 0,
            blurPx: 10,
            parkAtRest: false,
        });
        expect(resolveWaitingWordPresentation('karaoke')).toEqual({
            opacity: KARAOKE_WAITING_WORD_OPACITY,
            blurPx: 0,
            parkAtRest: true,
        });
        expect(resolveWaitingWordPresentation('ktv')).toEqual({
            opacity: KARAOKE_WAITING_WORD_OPACITY,
            blurPx: 0,
            parkAtRest: true,
        });
    });

    it('changes Framer waiting animate key when lyric word mode toggles', () => {
        expect(resolveLyricWordAnimateKey('waiting', 'default')).toBe('waiting-default');
        expect(resolveLyricWordAnimateKey('waiting', 'karaoke')).toBe('waiting-karaoke');
        expect(resolveLyricWordAnimateKey('waiting', 'ktv')).toBe('waiting-karaoke');
        expect(resolveLyricWordAnimateKey('active', 'karaoke')).toBe('active');
        expect(resolveLyricWordAnimateKey('passed', 'default')).toBe('passed');
    });
});
