import { describe, expect, it } from 'vitest';
import { YTMUSIC_HOME_CHIPS_CN, YTMUSIC_HOME_SEED_QUERIES } from '@/utils/ytmusicHomeChips';
import { mapYtmusicListItemToTrack } from '@/utils/ytmusicHomeMapping';

// test/unit/services/ytmusicHome.test.ts

describe('ytmusic home chips and mapping', () => {
    it('defaults chips to domestic / Mandarin discovery labels', () => {
        expect(YTMUSIC_HOME_CHIPS_CN.length).toBeGreaterThanOrEqual(6);
        expect(YTMUSIC_HOME_CHIPS_CN).toEqual(expect.arrayContaining(['周杰伦', '林俊杰', '华语流行']));
        expect(YTMUSIC_HOME_SEED_QUERIES).toEqual(['周杰伦', '林俊杰', '邓紫棋']);
    });

    it('exposes empty peek caches before any fetch', async () => {
        const { peekYtmusicHomeShelvesCache, peekYtmusicPlaylistCache } = await import('@/services/ytmusicService');
        expect(peekYtmusicHomeShelvesCache()).toBeNull();
        expect(peekYtmusicPlaylistCache('x')).toBeNull();
    });

    it('maps playlist list items to YtmSearchTrack', () => {
        const track = mapYtmusicListItemToTrack({
            id: 'lp-EO5I60KA',
            title: 'Thinking out Loud',
            authors: [{ name: 'Ed Sheeran' }],
            duration: { seconds: 290 },
            thumbnails: [{ url: 'https://example.com/a.jpg' }, { url: 'https://example.com/b.jpg' }],
        });

        expect(track).toEqual({
            videoId: 'lp-EO5I60KA',
            title: 'Thinking out Loud',
            artist: 'Ed Sheeran',
            album: null,
            durationMs: 290_000,
            coverUrl: 'https://example.com/b.jpg',
        });
    });

    it('returns null when video id is missing', () => {
        expect(mapYtmusicListItemToTrack({ title: 'x' })).toBeNull();
    });
});
