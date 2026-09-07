import type { CSSProperties } from 'react';
import type { Theme, VisualizerBackgroundMode, VisualizerMode } from '../../../types';
import { getLyricFontPresetById } from '../../../utils/lyricFontPresets';

// src/components/app/presentation/buildVisualizerTheme.ts

// Builds the visualizer-facing theme and deterministic geometry seed.
export const buildVisualizerTheme = ({
    appStyle,
    theme,
    lyricsFontStyle,
    lyricsCustomFontFamily,
    lyricFontPresetId,
    currentSongId,
    visualizerMode,
    visualizerBackgroundMode,
}: {
    appStyle: CSSProperties;
    theme: Theme;
    lyricsFontStyle: Theme['fontStyle'];
    lyricsCustomFontFamily: string | null;
    lyricFontPresetId?: string | null;
    currentSongId?: number | null;
    visualizerMode: VisualizerMode;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
}) => {
    void visualizerMode;
    void visualizerBackgroundMode;
    const visualizerBackgroundColor = String(appStyle['--bg-color']);
    const lyricPreset = lyricFontPresetId ? getLyricFontPresetById(lyricFontPresetId) : null;
    // Custom upload wins; otherwise lyric font presets drive the on-stage family.
    const resolvedFontFamily = lyricsCustomFontFamily?.trim()
        || lyricPreset?.fontFamily
        || undefined;
    const resolvedFontStyle: Theme['fontStyle'] = lyricPreset?.calligraphic
        ? 'serif'
        : lyricsFontStyle;

    return {
        visualizerTheme: {
            ...theme,
            primaryColor: theme.primaryColor,
            accentColor: theme.accentColor,
            secondaryColor: theme.secondaryColor,
            fontStyle: resolvedFontStyle,
            fontFamily: resolvedFontFamily,
            backgroundColor: visualizerBackgroundColor,
            lyricRhythmScaleMultiplier: theme.lyricRhythmScaleMultiplier,
            lyricGlowUsesAccent: theme.lyricGlowUsesAccent,
        },
        // Seed must not include visualizerMode — mode switches must not remount WebGL.
        visualizerGeometrySeed: currentSongId != null ? String(currentSongId) : 'geometry-stage',
    };
};
