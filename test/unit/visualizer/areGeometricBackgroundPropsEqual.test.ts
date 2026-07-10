import { describe, expect, it } from 'vitest';
import { areGeometricBackgroundPropsEqual } from '@/components/visualizer/geometric/areGeometricBackgroundPropsEqual';
import type { GeometricBackgroundProps } from '@/components/visualizer/geometric/types';
import type { Line, Theme } from '@/types';

const theme: Theme = {
    name: 'fixture',
    backgroundColor: '#0f172a',
    primaryColor: '#ffffff',
    secondaryColor: '#94a3b8',
    accentColor: '#38bdf8',
    fontStyle: 'sans',
    fontFamily: 'sans-serif',
    animationIntensity: 'normal',
    wordColors: [],
    lyricsIcons: [],
};

const audioPower = { get: () => 0 } as GeometricBackgroundProps['audioPower'];

const buildProps = (overrides: Partial<GeometricBackgroundProps> = {}): GeometricBackgroundProps => ({
    theme,
    audioPower,
    lines: [],
    showLyrics: true,
    playing: true,
    ...overrides,
});

describe('areGeometricBackgroundPropsEqual', () => {
    it('re-renders when lyric lines reference changes', () => {
        const previous = buildProps();
        const nextLines: Line[] = [{ startTime: 0, endTime: 1, fullText: 'hello', words: [] }];
        const next = buildProps({ lines: nextLines });

        expect(areGeometricBackgroundPropsEqual(previous, next)).toBe(false);
    });

    it('re-renders when showLyrics toggles', () => {
        const previous = buildProps({ showLyrics: true });
        const next = buildProps({ showLyrics: false });

        expect(areGeometricBackgroundPropsEqual(previous, next)).toBe(false);
    });

    it('re-renders when playing toggles', () => {
        const previous = buildProps({ playing: true });
        const next = buildProps({ playing: false });

        expect(areGeometricBackgroundPropsEqual(previous, next)).toBe(false);
    });
});
