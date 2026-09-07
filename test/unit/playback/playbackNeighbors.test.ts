import { describe, expect, it } from 'vitest';
import { formatPlaybackNeighborLabel, resolvePlaybackNeighbors } from '../../../src/utils/playback/playbackNeighbors';
import type { SongResult } from '../../../src/types';

// test/unit/playback/playbackNeighbors.test.ts

const song = (id: number, name: string): SongResult => ({
    id,
    name,
    artists: [{ id, name: `Artist ${id}` }],
    album: { id, name: 'A' },
    duration: 1,
});

describe('resolvePlaybackNeighbors', () => {
    const queue = [song(1, 'One'), song(2, 'Two'), song(3, 'Three')];

    it('returns previous and next around the current song', () => {
        expect(resolvePlaybackNeighbors(queue, 2)).toEqual({
            previous: { name: 'One', artist: 'Artist 1' },
            next: { name: 'Three', artist: 'Artist 3' },
        });
    });

    it('formats a neighbor label', () => {
        expect(formatPlaybackNeighborLabel({ name: 'Two', artist: 'A' }, 'Up next')).toBe('Up next Two · A');
    });
});
