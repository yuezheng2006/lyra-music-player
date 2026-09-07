import { describe, expect, it } from 'vitest';
import type { PlayHistoryEntry } from '@/services/playHistoryService';
import { pickRecentListenEntries, songFromPlayHistoryEntry } from '@/utils/home/recentListenMath';

// test/unit/home/recentListenMath.test.ts

const entry = (songId: string, playedAt: number, extra?: Partial<PlayHistoryEntry>): PlayHistoryEntry => ({
    songId,
    songName: `Song ${songId}`,
    artist: 'Artist',
    playedAt,
    date: '2026-08-31',
    source: 'netease',
    ...extra,
});

describe('recentListenMath', () => {
    it('keeps unique songs in recency order', () => {
        const picked = pickRecentListenEntries([
            entry('a', 4),
            entry('a', 3),
            entry('b', 2),
            entry('c', 1),
        ], { limit: 3 });
        expect(picked.map(item => item.songId)).toEqual(['a', 'b', 'c']);
    });

    it('prefers songs off the listening desk, then fills', () => {
        const picked = pickRecentListenEntries([
            entry('desk-1', 5),
            entry('keep', 4),
            entry('desk-2', 3),
            entry('other', 2),
        ], { limit: 3, excludeSongIds: ['desk-1', 'desk-2'] });
        expect(picked.map(item => item.songId)).toEqual(['keep', 'other', 'desk-1']);
    });

    it('rebuilds a playable song from a snapshot or fallback fields', () => {
        const fromSnapshot = songFromPlayHistoryEntry(entry('1', 1, {
            songSnapshot: { id: 1, name: 'Snap', ytmData: { videoId: 'v', streamUrl: 'stale' } },
        }));
        expect(fromSnapshot.name).toBe('Snap');
        expect((fromSnapshot as { ytmData?: { streamUrl?: string } }).ytmData?.streamUrl).toBeUndefined();

        const fromFields = songFromPlayHistoryEntry(entry('2', 1, {
            songName: 'Fallback',
            artist: 'A, B',
            album: 'Album',
            coverUrl: 'https://example.com/c.jpg',
        }));
        expect(fromFields.name).toBe('Fallback');
        expect(fromFields.artists?.map(artist => artist.name)).toEqual(['A', 'B']);
        expect(fromFields.album?.name).toBe('Album');
    });
});
