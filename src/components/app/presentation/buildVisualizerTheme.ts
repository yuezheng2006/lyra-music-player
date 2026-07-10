import type { CSSProperties } from 'react';
import type { Theme, VisualizerBackgroundMode, VisualizerMode } from '../../../types';
import { DEFAULT_THEME } from '../root/appConstants';
import { resolveVisualizerBackgroundMode } from '../../../stores/useSettingsUiStore';

// src/components/app/presentation/buildVisualizerTheme.ts

// Builds the visualizer-facing theme and deterministic geometry seed.
export const buildVisualizerTheme = ({
    appStyle,
    theme,
    lyricsFontStyle,
    lyricsCustomFontFamily,
    currentSongId,
    visualizerMode,
    visualizerBackgroundMode,
}: {
    appStyle: CSSProperties;
    theme: Theme;
    lyricsFontStyle: Theme['fontStyle'];
    lyricsCustomFontFamily: string | null;
    currentSongId?: number | null;
    visualizerMode: VisualizerMode;
    visualizerBackgroundMode: VisualizerBackgroundMode | null;
}) => {
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(visualizerBackgroundMode, visualizerMode);
    const useDarkInteractive3dStage = resolvedBackgroundMode === 'interactive3d';
    const visualizerBackgroundColor = useDarkInteractive3dStage
        ? DEFAULT_THEME.backgroundColor
        : String(appStyle['--bg-color']);
    return {
        visualizerTheme: {
            // Interactive3d keeps a dark stage wash, but lyric text colors must stay on the
            // active app theme so preset chips / on-stage lyrics stay in sync.
            ...(useDarkInteractive3dStage ? DEFAULT_THEME : theme),
            primaryColor: theme.primaryColor,
            accentColor: theme.accentColor,
            secondaryColor: theme.secondaryColor,
            fontStyle: lyricsFontStyle,
            fontFamily: lyricsCustomFontFamily ?? undefined,
            backgroundColor: visualizerBackgroundColor,
            lyricRhythmScaleMultiplier: theme.lyricRhythmScaleMultiplier,
            lyricGlowUsesAccent: theme.lyricGlowUsesAccent,
        },
        visualizerGeometrySeed: currentSongId ?? `geometry-${visualizerMode}`,
    };
};
