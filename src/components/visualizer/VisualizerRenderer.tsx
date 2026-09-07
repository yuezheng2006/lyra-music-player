import React from 'react';
import { DEFAULT_FUME_TUNING, type VisualizerMode } from '../../types';
import { resolveVisualizerBackgroundMode, useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { type VisualizerSharedProps } from './definition';
import { useVisualizerRegistryEntry } from './registry';
import { resolveShellGeometricBackgroundDisabled } from './resolveShellGeometricBackground';
import VisualizerCaptionOverlay from './VisualizerCaptionOverlay';
import VisualizerHarmonyOverlay from './VisualizerHarmonyOverlay';
import VisualizerShell from './VisualizerShell';
import { isCaptionLyricPresentation, resolveVisualizerLyricStageLines } from '../../utils/lyrics/lyricPresentation';

// src/components/visualizer/VisualizerRenderer.tsx
// Stable Shell host: interactive3d WebGL stays mounted; only the lyric slot swaps by mode.

interface VisualizerRendererProps extends VisualizerSharedProps {
    mode: VisualizerMode;
}

const VisualizerRenderer: React.FC<VisualizerRendererProps> = ({ mode, ...props }) => {
    const entry = useVisualizerRegistryEntry(mode);
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(props.visualizerBackgroundMode, mode);
    const storeShowHarmonySubtitle = useSettingsUiStore(state => state.showHarmonySubtitle);
    const storeHarmonySubtitleBackground = useSettingsUiStore(state => state.harmonySubtitleBackground);
    const storeSubtitleContentMode = useSettingsUiStore(state => state.subtitleContentMode);
    const storeSubtitleFontScale = useSettingsUiStore(state => state.subtitleFontScale);
    const storeShowSubtitleTranslation = useSettingsUiStore(state => state.showSubtitleTranslation);

    const fumePrefersDisabled = (props.fumeTuning ?? DEFAULT_FUME_TUNING).disableGeometricBackground;
    const disableGeometricBackground = mode === 'fume'
        ? resolveShellGeometricBackgroundDisabled(
            Boolean(props.disableGeometricBackground),
            resolvedBackgroundMode,
            fumePrefersDisabled,
        )
        : props.disableGeometricBackground;

    const isCaptions = isCaptionLyricPresentation(props.lyricPresentation);
    const stageLines = resolveVisualizerLyricStageLines(props.lines, props.lyricPresentation);

    const resolvedProps = {
        ...props,
        lines: stageLines,
        visualizerMode: mode,
        resolvedVisualizerBackgroundMode: resolvedBackgroundMode,
        disableGeometricBackground,
        mineradioStageActive: resolvedBackgroundMode === 'interactive3d',
    };

    return (
        <>
            <VisualizerShell
                theme={resolvedProps.theme}
                audioPower={resolvedProps.audioPower}
                audioBands={resolvedProps.audioBands}
                sharedProps={resolvedProps}
            >
                {entry ? entry.render(resolvedProps) : null}
            </VisualizerShell>
            {isCaptions ? (
                <VisualizerCaptionOverlay
                    showText={resolvedProps.showText ?? true}
                    lines={props.lines}
                    currentLineIndex={resolvedProps.currentLineIndex}
                    isPlayerChromeHidden={resolvedProps.isPlayerChromeHidden}
                />
            ) : (
                <VisualizerHarmonyOverlay
                    currentTime={resolvedProps.currentTime}
                    lines={resolvedProps.lines}
                    showText={resolvedProps.showText ?? true}
                    theme={resolvedProps.theme}
                    subtitleTheme={resolvedProps.subtitleTheme}
                    isPlayerChromeHidden={resolvedProps.isPlayerChromeHidden}
                    hideTranslationSubtitle={resolvedProps.hideTranslationSubtitle}
                    showSubtitleTranslation={resolvedProps.showSubtitleTranslation ?? storeShowSubtitleTranslation}
                    subtitleContentMode={resolvedProps.subtitleContentMode ?? storeSubtitleContentMode}
                    showHarmonySubtitle={resolvedProps.showHarmonySubtitle ?? storeShowHarmonySubtitle}
                    harmonySubtitleBackground={resolvedProps.harmonySubtitleBackground ?? storeHarmonySubtitleBackground}
                    subtitleFontScale={resolvedProps.subtitleFontScale ?? storeSubtitleFontScale}
                />
            )}
        </>
    );
};

export default VisualizerRenderer;
