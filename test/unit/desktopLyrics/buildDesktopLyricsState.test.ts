import { describe, expect, it } from 'vitest';
import { PlayerState } from '../../../src/types';
import type { LyricData, Theme } from '../../../src/types';
import { buildDesktopLyricsState } from '../../../src/utils/desktopLyrics/buildDesktopLyricsState';

// test/unit/desktopLyrics/buildDesktopLyricsState.test.ts
// Verifies lyric line mapping for the desktop overlay payload.

const theme: Theme = {
    name: 'test',
    backgroundColor: '#000000',
    primaryColor: '#f6fdff',
    accentColor: '#fff0b8',
    secondaryColor: '#a8f6ff',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

const lyrics: LyricData = {
    lines: [
        {
            startTime: 10,
            endTime: 14,
            fullText: '第一句歌词',
            words: [],
        },
    ],
};

describe('buildDesktopLyricsState', () => {
    it('maps the active line, progress, and theme colors', () => {
        const payload = buildDesktopLyricsState({
            lyrics,
            currentLineIndex: 0,
            currentTimeSec: 12,
            durationSec: 180,
            playerState: PlayerState.PLAYING,
            theme,
            lyricsFontScale: 1,
            lyricsCustomFontFamily: null,
            fallbackTitle: 'Fallback',
        });

        expect(payload.text).toBe('第一句歌词');
        expect(payload.progress).toBeGreaterThan(0.4);
        expect(payload.progress).toBeLessThan(0.6);
        expect(payload.playing).toBe(true);
        expect(payload.colors).toEqual({
            primary: '#f6fdff',
            secondary: '#a8f6ff',
            highlight: '#fff0b8',
            glow: '#fff0b8',
        });
    });

    it('falls back to the song title when no active lyric line exists', () => {
        const payload = buildDesktopLyricsState({
            lyrics,
            currentLineIndex: -1,
            currentTimeSec: 0,
            durationSec: 180,
            playerState: PlayerState.PAUSED,
            theme,
            lyricsFontScale: 1,
            lyricsCustomFontFamily: null,
            fallbackTitle: '夜曲',
        });

        expect(payload.text).toBe('夜曲');
        expect(payload.playing).toBe(false);
    });
});
