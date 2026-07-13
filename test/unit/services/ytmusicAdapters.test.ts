import { describe, expect, it } from 'vitest';
import { buildUnifiedYtmSong, buildYtmQueue } from '@/services/playbackAdapters';
import { isYtmPlaybackSong } from '@/utils/appPlaybackGuards';
import { getYtmSongId } from '@/utils/ytmusicIds';
import { buildYtmusicPlaybackUrl, isYtmusicPlaybackUrl, isYtmusicStreamFresh } from '@/services/ytmusicService';

// test/unit/services/ytmusicAdapters.test.ts

describe('ytmusic ids and adapters', () => {
    it('hashes videoId to a stable negative id', () => {
        const a = getYtmSongId('dQw4w9WgXcQ');
        const b = getYtmSongId('dQw4w9WgXcQ');
        const c = getYtmSongId('lYBUbBu4W08');
        expect(a).toBe(b);
        expect(a).toBeLessThan(0);
        expect(a).not.toBe(c);
    });

    it('builds a YTM carrier song for Lyra playback', () => {
        const song = buildUnifiedYtmSong({
            videoId: 'dQw4w9WgXcQ',
            title: 'Never Gonna Give You Up',
            artist: 'Rick Astley',
            album: 'Whenever You Need Somebody',
            durationMs: 213000,
            coverUrl: 'https://example.com/cover.jpg',
        }, {
            streamUrl: 'http://127.0.0.1:41234/ytm/dQw4w9WgXcQ',
            streamExpireAt: Date.now() + 60_000,
        });

        expect(isYtmPlaybackSong(song)).toBe(true);
        expect(song).toMatchObject({
            name: 'Never Gonna Give You Up',
            ar: [{ name: 'Rick Astley' }],
            al: { name: 'Whenever You Need Somebody', picUrl: 'https://example.com/cover.jpg' },
            providerSongId: 'dQw4w9WgXcQ',
            ytmData: {
                videoId: 'dQw4w9WgXcQ',
                streamUrl: 'http://127.0.0.1:41234/ytm/dQw4w9WgXcQ',
            },
        });
    });

    it('preserves current song identity in YTM queues', () => {
        const current = buildUnifiedYtmSong({
            videoId: 'aaa',
            title: 'A',
            artist: 'Artist',
            durationMs: 1000,
        }, { streamUrl: 'http://127.0.0.1:41234/ytm/aaa' });
        const queue = buildYtmQueue([
            { videoId: 'aaa', title: 'A', artist: 'Artist', durationMs: 1000 },
            { videoId: 'bbb', title: 'B', artist: 'Artist', durationMs: 2000 },
        ], current);

        expect(queue[0]).toBe(current);
        expect(isYtmPlaybackSong(queue[1])).toBe(true);
    });

    it('treats protocol playback URLs as always fresh', () => {
        const playbackUrl = 'http://127.0.0.1:41234/ytm/abc';
        expect(isYtmusicPlaybackUrl(playbackUrl)).toBe(true);
        expect(isYtmusicPlaybackUrl('lyra-ytm://stream/abc')).toBe(false);
        expect(isYtmusicStreamFresh(playbackUrl, 0, Date.now())).toBe(true);
        expect(isYtmusicStreamFresh('https://x', Date.now() + 30_000, Date.now())).toBe(false);
        expect(isYtmusicStreamFresh(null, Date.now() + 120_000, Date.now())).toBe(false);
    });
});
