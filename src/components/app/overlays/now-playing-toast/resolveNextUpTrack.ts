import type { SongResult } from '../../../../types';
import { getPlaybackSongKey, isStagePlaybackSong } from '../../../../utils/appPlaybackGuards';

// src/components/app/overlays/now-playing-toast/resolveNextUpTrack.ts

type ResolveNextUpTrackParams = {
    playQueue: SongResult[];
    song: SongResult | null;
    loopMode: 'off' | 'all' | 'one';
    isFmMode: boolean;
    isStageActive: boolean;
    fallbackToQueueHead?: boolean;
};

/** The track a natural track-end would advance to, or null when nothing resolvable. */
export const resolveNextUpTrack = ({
    playQueue,
    song,
    loopMode,
    isFmMode,
    isStageActive,
    fallbackToQueueHead = false,
}: ResolveNextUpTrackParams): SongResult | null => {
    if (!song || playQueue.length === 0 || isStageActive || isStagePlaybackSong(song) || loopMode === 'one') {
        return null;
    }

    const songKey = getPlaybackSongKey(song);
    const currentIndex = playQueue.findIndex(item => getPlaybackSongKey(item) === songKey);
    if (isFmMode && currentIndex >= 0 && currentIndex >= playQueue.length - 1) {
        return null;
    }

    if (currentIndex < 0) {
        return fallbackToQueueHead ? playQueue[0] ?? null : null;
    }
    if (currentIndex < playQueue.length - 1) {
        return playQueue[currentIndex + 1] ?? null;
    }
    return loopMode === 'all' ? playQueue[0] ?? null : null;
};
