import type { SongResult } from '../../types';
import { isRssPodcastPlaybackSong } from './rssPodcastPlayback';

// src/utils/playback/playbackLoadPriorityMath.ts
// Pure guards that keep first-audio / loading ahead of heavy visual work.

/**
 * Only providers that can return companion video should pay for a second URL resolve.
 * Netease (default / unset provider) never returns videoUrl.
 * RSS podcasts already have an enclosure URL and never ship a companion video.
 */
export const shouldResolveCompanionVideoForSong = (
    song: Pick<SongResult, 'musicProvider' | 'contentType' | 'audioUrl'> | null | undefined,
): boolean => {
    if (isRssPodcastPlaybackSong(song)) return false;
    const providerId = song?.musicProvider;
    return Boolean(providerId && providerId !== 'netease');
};

/**
 * Pause heavy visualizer backgrounds while off-player (when opted in) or while
 * the player is open but audio src is not armed yet (URL still loading).
 *
 * Home keeps a solid shell over the stage, so WebGL on home is not user-visible —
 * Electron defaults `disableHomeDynamicBackground` to save GPU. Selecting 3D from
 * the dock should navigate into the player view instead of unpausing under home.
 */
export const resolveShouldPauseVisualizerBackground = (input: {
    currentView: string;
    disableHomeDynamicBackground: boolean;
    audioSrc: string | null | undefined;
}): boolean => {
    if (input.currentView !== 'player') {
        return input.disableHomeDynamicBackground;
    }
    return !input.audioSrc;
};

/** Electron default: keep home off heavy WebGL unless the user explicitly enables it. */
export const resolveDefaultDisableHomeDynamicBackground = (input: {
    isElectron: boolean;
    stored: boolean | null;
}): boolean => {
    if (input.stored !== null) return input.stored;
    return input.isElectron;
};

/** Defer full-track beat-map decode so it cannot fight first audio buffer. */
export const ATMOSPHERE_BEATMAP_DEFER_MS = 3000;
