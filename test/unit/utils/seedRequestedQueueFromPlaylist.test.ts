import { describe, expect, it } from 'vitest';
import {
    pickSongsToSeedRequestedQueue,
    REQUESTED_QUEUE_AUTO_SEED_COUNT,
} from '@/utils/seedRequestedQueueFromPlaylist';
import type { SongResult } from '@/types';

// test/unit/utils/seedRequestedQueueFromPlaylist.test.ts

const song = (id: number): SongResult => ({
    id,
    name: `Song ${id}`,
    artists: [{ id: 1, name: 'Artist' }],
    album: { id: 1, name: 'Album' },
    duration: 180000,
});

describe('pickSongsToSeedRequestedQueue', () => {
    it('takes a forward window from the current song', () => {
        const playlist = [1, 2, 3, 4, 5, 6].map(song);
        const picked = pickSongsToSeedRequestedQueue({
            playlist,
            currentSongId: 3,
            limit: 3,
        });
        expect(picked.map(item => item.id)).toEqual([3, 4, 5]);
    });

    it('does not wrap around the playlist', () => {
        const playlist = [1, 2, 3].map(song);
        const picked = pickSongsToSeedRequestedQueue({
            playlist,
            currentSongId: 2,
            limit: 10,
        });
        expect(picked.map(item => item.id)).toEqual([2, 3]);
    });

    it('starts from the beginning when current song is missing', () => {
        const playlist = [1, 2, 3, 4].map(song);
        const picked = pickSongsToSeedRequestedQueue({
            playlist,
            currentSongId: 99,
            limit: 2,
        });
        expect(picked.map(item => item.id)).toEqual([1, 2]);
    });

    it('uses the default seed count', () => {
        const playlist = Array.from({ length: 20 }, (_, index) => song(index + 1));
        const picked = pickSongsToSeedRequestedQueue({
            playlist,
            currentSongId: 1,
        });
        expect(picked).toHaveLength(REQUESTED_QUEUE_AUTO_SEED_COUNT);
        expect(picked[0]?.id).toBe(1);
        expect(picked.at(-1)?.id).toBe(REQUESTED_QUEUE_AUTO_SEED_COUNT);
    });
});
