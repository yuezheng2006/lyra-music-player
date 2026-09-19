import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { buildVisualizerTheme } from '@/components/app/presentation/buildVisualizerTheme';
import { areGeometricBackgroundPropsEqual } from '@/components/visualizer/geometric/areGeometricBackgroundPropsEqual';
import { resolveAppPlayerGeometricBackgroundDisabled } from '@/utils/visualizer/resolveAppPlayerGeometricBackgroundDisabled';
import type { GeometricBackgroundProps } from '@/components/visualizer/geometric/types';
import type { Theme } from '@/types';
import { DEFAULT_THEME } from '@/components/app/root/appConstants';

// Stable WebGL host: geometry seed and particle yield must not remount interactive3d.

const baseTheme = DEFAULT_THEME as Theme;
const darkAppStyle = { '--bg-color': '#111' } as CSSProperties;

describe('stable WebGL shell host', () => {
    it('keeps geometry seed stable across lyric visualizer modes', () => {
        const classic = buildVisualizerTheme({
            appStyle: darkAppStyle,
            theme: baseTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: 42,
            visualizerMode: 'classic',
            visualizerBackgroundMode: 'interactive3d',
        });
        const monet = buildVisualizerTheme({
            appStyle: darkAppStyle,
            theme: baseTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: 42,
            visualizerMode: 'monet',
            visualizerBackgroundMode: 'interactive3d',
        });
        expect(classic.visualizerGeometrySeed).toBe('42');
        expect(monet.visualizerGeometrySeed).toBe(classic.visualizerGeometrySeed);
    });

    it('does not encode visualizerMode into the empty-song geometry seed', () => {
        const a = buildVisualizerTheme({
            appStyle: {},
            theme: baseTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: null,
            visualizerMode: 'classic',
            visualizerBackgroundMode: 'common',
        });
        const b = buildVisualizerTheme({
            appStyle: {},
            theme: baseTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: null,
            visualizerMode: 'fume',
            visualizerBackgroundMode: 'common',
        });
        expect(a.visualizerGeometrySeed).toBe('geometry-stage');
        expect(b.visualizerGeometrySeed).toBe(a.visualizerGeometrySeed);
    });

    it('never disables geometric background for interactive3d due to settings subview alone', () => {
        expect(resolveAppPlayerGeometricBackgroundDisabled({
            videoStageActive: false,
            backgroundMode: 'interactive3d',
            settingsSubviewOpen: true,
        })).toBe(false);
    });

    it('treats particlesYielded as a prop change without requiring paused', () => {
        const prev: GeometricBackgroundProps = {
            theme: baseTheme,
            audioPower: { get: () => 0 } as GeometricBackgroundProps['audioPower'],
            paused: false,
            particlesYielded: false,
        };
        const next: GeometricBackgroundProps = {
            ...prev,
            particlesYielded: true,
        };
        expect(areGeometricBackgroundPropsEqual(prev, next)).toBe(false);
        expect(areGeometricBackgroundPropsEqual(prev, { ...prev, paused: false })).toBe(true);
    });
});
