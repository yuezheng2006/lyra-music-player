import type { SongResult } from '../../types';

// src/utils/playback/playbackNeighbors.ts
// Previous / next tracks around the current song for progress-bar previews.

export type PlaybackNeighbor = {
    name: string;
    artist: string;
};

const artistLabel = (song: SongResult) => (
    (song.ar?.length ? song.ar : song.artists)?.map(item => item.name).filter(Boolean).join(', ') || ''
);

const toNeighbor = (song: SongResult | undefined): PlaybackNeighbor | null => {
    if (!song) return null;
    return { name: song.name, artist: artistLabel(song) };
};

export const resolvePlaybackNeighbors = (
    queue: readonly SongResult[],
    currentSongId: number | null | undefined,
) => {
    const currentIndex = currentSongId == null ? -1 : queue.findIndex(song => song.id === currentSongId);
    if (currentIndex < 0) {
        return { previous: toNeighbor(queue[0] ?? undefined), next: toNeighbor(queue[1]) };
    }
    return {
        previous: toNeighbor(queue[currentIndex - 1]),
        next: toNeighbor(queue[currentIndex + 1]),
    };
};

export const formatPlaybackNeighborLabel = (neighbor: PlaybackNeighbor | null, prefix: string) => {
    if (!neighbor) return '';
    return neighbor.artist ? `${prefix} ${neighbor.name} · ${neighbor.artist}` : `${prefix} ${neighbor.name}`;
};
