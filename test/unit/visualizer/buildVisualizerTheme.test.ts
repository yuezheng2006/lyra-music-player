import { describe, expect, it } from 'vitest';
import { buildVisualizerTheme } from '@/components/app/presentation/buildVisualizerTheme';
import { DEFAULT_THEME } from '@/components/app/root/appConstants';
import type { Theme } from '@/types';

// test/unit/visualizer/buildVisualizerTheme.test.ts

const daylightTheme: Theme = {
    name: 'Daylight Test',
    backgroundColor: '#f8f8f8',
    primaryColor: '#111111',
    accentColor: '#ff5500',
    secondaryColor: '#555555',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

describe('buildVisualizerTheme', () => {
    it('uses a dark stage theme for interactive3d even when the app theme is daylight', () => {
        const { visualizerTheme } = buildVisualizerTheme({
            appStyle: { '--bg-color': daylightTheme.backgroundColor },
            theme: daylightTheme,
            lyricsFontStyle: 'serif',
            lyricsCustomFontFamily: null,
            currentSongId: 1,
            visualizerMode: 'classic',
            visualizerBackgroundMode: 'interactive3d',
        });

        expect(visualizerTheme.backgroundColor).toBe(DEFAULT_THEME.backgroundColor);
        expect(visualizerTheme.primaryColor).toBe(daylightTheme.primaryColor);
        expect(visualizerTheme.accentColor).toBe(daylightTheme.accentColor);
        expect(visualizerTheme.secondaryColor).toBe(daylightTheme.secondaryColor);
        expect(visualizerTheme.fontStyle).toBe('serif');
    });

    it('keeps the app theme for non-interactive3d visualizer backgrounds', () => {
        const { visualizerTheme } = buildVisualizerTheme({
            appStyle: { '--bg-color': daylightTheme.backgroundColor },
            theme: daylightTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: 1,
            visualizerMode: 'classic',
            visualizerBackgroundMode: 'common',
        });

        expect(visualizerTheme.backgroundColor).toBe(daylightTheme.backgroundColor);
        expect(visualizerTheme.primaryColor).toBe(daylightTheme.primaryColor);
    });

    it('preserves lyric colors from the app theme on the interactive3d stage', () => {
        const lyricTheme: Theme = {
            ...daylightTheme,
            primaryColor: '#f8fbff',
            accentColor: '#12f7d6',
            secondaryColor: '#ff3b6b',
        };
        const { visualizerTheme } = buildVisualizerTheme({
            appStyle: { '--bg-color': lyricTheme.backgroundColor },
            theme: lyricTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: 2,
            visualizerMode: 'fume',
            visualizerBackgroundMode: 'interactive3d',
        });

        expect(visualizerTheme.backgroundColor).toBe(DEFAULT_THEME.backgroundColor);
        expect(visualizerTheme.primaryColor).toBe('#f8fbff');
        expect(visualizerTheme.accentColor).toBe('#12f7d6');
        expect(visualizerTheme.secondaryColor).toBe('#ff3b6b');
    });
});
