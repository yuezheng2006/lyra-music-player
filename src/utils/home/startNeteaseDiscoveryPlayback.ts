import type { SongResult } from '../../types';

// src/utils/home/startNeteaseDiscoveryPlayback.ts
// Start playback from a discovery queue; Personal FM sets isFmCall.

export const playDiscoverySongs = (
    songs: readonly SongResult[],
    playSong: (song: SongResult, queue?: SongResult[], isFmCall?: boolean) => void | Promise<void>,
    isFmCall = false,
) => {
    const first = songs[0];
    if (!first) return false;
    void playSong(first, [...songs], isFmCall);
    return true;
};
