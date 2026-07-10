import type { SongResult } from '../types';
import { useRequestedQueueStore } from '../stores/useRequestedQueueStore';

// src/utils/seedRequestedQueueFromPlaylist.ts
// When 已点列表 is empty, copy a short window from the current playQueue — lists stay separate.

/** How many playlist songs to auto-append into an empty 已点列表. */
export const REQUESTED_QUEUE_AUTO_SEED_COUNT = 12;

/** Pick a forward window from the current playlist starting at the playing song. */
export const pickSongsToSeedRequestedQueue = ({
    playlist,
    currentSongId = null,
    limit = REQUESTED_QUEUE_AUTO_SEED_COUNT,
}: {
    playlist: SongResult[];
    currentSongId?: number | null;
    limit?: number;
}): SongResult[] => {
    if (playlist.length === 0 || limit <= 0) return [];

    const startIndex = currentSongId == null
        ? 0
        : Math.max(0, playlist.findIndex(song => song.id === currentSongId));
    const resolvedStart = startIndex >= 0 ? startIndex : 0;
    const picked: SongResult[] = [];
    const seen = new Set<number>();

    for (let offset = 0; offset < playlist.length && picked.length < limit; offset += 1) {
        const song = playlist[resolvedStart + offset];
        if (!song) break;
        if (seen.has(song.id)) continue;
        seen.add(song.id);
        picked.push(song);
    }

    return picked;
};

/**
 * If 已点列表 is empty, append a batch from the current playlist.
 * Does nothing when 已点 already has songs — keeps the two queues independent.
 */
export const ensureRequestedQueueSeededFromPlaylist = ({
    playlist,
    currentSongId = null,
    limit = REQUESTED_QUEUE_AUTO_SEED_COUNT,
}: {
    playlist: SongResult[];
    currentSongId?: number | null;
    limit?: number;
}): { changed: boolean; seededCount: number; nextQueue: SongResult[] } => {
    const store = useRequestedQueueStore.getState();
    if (store.songs.length > 0) {
        return { changed: false, seededCount: 0, nextQueue: store.songs };
    }

    const seeds = pickSongsToSeedRequestedQueue({ playlist, currentSongId, limit });
    if (seeds.length === 0) {
        return { changed: false, seededCount: 0, nextQueue: store.songs };
    }

    const result = store.addSongs(seeds, { behavior: 'append' });
    if (result.changed) {
        store.markAutoSeeded(seeds.length);
    }
    return {
        changed: result.changed,
        seededCount: result.changed ? seeds.length : 0,
        nextQueue: result.nextQueue,
    };
};
