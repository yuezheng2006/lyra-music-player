import { describe, expect, it } from 'vitest';
import { buildQueueListRows } from '../../../src/utils/queue/queueSectionMath';
import type { SongResult } from '../../../src/types';

// test/unit/queue/queueSectionMath.test.ts
// Now-playing / up-next row split for the queue panel.

const song = (id: number, name: string): SongResult => ({
    id,
    name,
    artists: [{ id, name: 'A' }],
    album: { id, name: 'B' },
    duration: 1000,
});

describe('buildQueueListRows', () => {
    const queue = [song(1, 'One'), song(2, 'Two'), song(3, 'Three')];

    it('puts the current song under now playing and the rest under up next', () => {
        const rows = buildQueueListRows(queue, 2);
        expect(rows.map(row => row.kind === 'header' ? row.titleKey : row.song.name)).toEqual([
            'queue.played',
            'One',
            'queue.nowPlaying',
            'Two',
            'queue.upNext',
            'Three',
        ]);
    });

    it('treats the whole queue as up next when nothing is current', () => {
        const rows = buildQueueListRows(queue, null);
        expect(rows[0]).toMatchObject({ kind: 'header', titleKey: 'queue.upNext' });
        expect(rows.filter(row => row.kind === 'song')).toHaveLength(3);
    });
});
