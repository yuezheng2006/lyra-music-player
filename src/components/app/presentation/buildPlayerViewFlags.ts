import { resolveShouldPauseVisualizerBackground } from '../../../utils/playback/playbackLoadPriorityMath';

// src/components/app/presentation/buildPlayerViewFlags.ts
// Builds top-level player-view booleans used by the shell, overlays, and docked player bar.

export const buildPlayerViewFlags = ({
    currentView,
    disableHomeDynamicBackground,
    hidePlayerTranslationSubtitle,
    hidePlayerRightPanelButton,
    isNowPlayingControlDisabled,
    activePlaybackContext,
    stageActiveEntryKind,
    audioSrc,
    duration,
    hasCurrentSong = false,
}: {
    currentView: string;
    disableHomeDynamicBackground: boolean;
    hidePlayerTranslationSubtitle: boolean;
    hidePlayerRightPanelButton: boolean;
    isNowPlayingControlDisabled: boolean;
    activePlaybackContext: 'main' | 'stage';
    stageActiveEntryKind: string | null;
    audioSrc: string | null;
    duration: number;
    /** Session restore may leave a song without audioSrc; play should still be clickable. */
    hasCurrentSong?: boolean;
}) => {
    const isPlayerView = currentView === 'player';
    return {
        isPlayerView,
        // Pause WebGL while URL loads / on home when opted in — keeps click-to-play ahead of GPU.
        shouldPauseVisualizerBackground: resolveShouldPauseVisualizerBackground({
            currentView,
            disableHomeDynamicBackground,
            audioSrc,
        }),
        // Docked bar visibility is owned by autoHidePlayerChrome / H key only.
        shouldHidePlayerProgressBar: false,
        shouldHidePlayerTranslationSubtitle: isPlayerView && hidePlayerTranslationSubtitle,
        shouldHidePlayerRightPanelButton: isPlayerView && hidePlayerRightPanelButton,
        canToggleCurrentPlayback: !isNowPlayingControlDisabled && Boolean(
            audioSrc
            || hasCurrentSong
            || (activePlaybackContext === 'stage' && stageActiveEntryKind === 'lyrics' && duration > 0),
        ),
    };
};
