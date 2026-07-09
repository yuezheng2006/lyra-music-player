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
        expect(visualizerTheme.primaryColor).toBe(DEFAULT_THEME.primaryColor);
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
});
