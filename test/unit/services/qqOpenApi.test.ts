import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildQQOpenDetailKeyword,
    fetchQQOpenSongDetail,
    mapQQOpenSearchItem,
    pickQQOpenAudioUrl,
    resolveQQOpenAudioUrl,
    searchQQOpenApi,
} from '@/services/musicProviders/qqOpenApi';

describe('qqOpenApi', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('maps open search items into QQ songs', () => {
        const song = mapQQOpenSearchItem({
            song_mid: '001abc',
            song_title: 'Test Song',
            singer_name: 'Artist',
        });

        expect(song).toEqual({
            id: 0,
            name: 'Test Song',
            artists: [{ id: 0, name: 'Artist' }],
            album: { id: 0, name: 'Unknown Album' },
            duration: 0,
            qqMid: '001abc',
            qqMediaMid: '001abc',
            musicProvider: 'qq',
            providerSongId: '001abc',
        });
    });

    it('builds detail keyword from song title and artists', () => {
        expect(buildQQOpenDetailKeyword({
            name: '晴天',
            artists: [{ id: 1, name: '周杰伦' }],
        })).toBe('晴天 周杰伦');
    });

    it('picks preferred open audio quality', () => {
        const url = pickQQOpenAudioUrl({
            song_mid: '001abc',
            song_play_url_sq: 'https://example.com/sq.flac',
            song_play_url_hq: 'https://example.com/hq.mp3',
        }, 'exhigh');

        expect(url).toBe('https://example.com/hq.mp3');
    });

    it('searches songs through the open API payload', async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ([
                { song_mid: '001abc', song_title: 'Song A', singer_name: 'Artist A' },
                { song_mid: '002def', song_title: 'Song B', singer_name: 'Artist B' },
            ]),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await searchQQOpenApi('周杰伦', { limit: 1, offset: 0 });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining(encodeURIComponent('https://tang.api.s01s.cn/music_open_api.php')),
            expect.objectContaining({ credentials: 'omit' }),
        );
        expect(result.songs).toHaveLength(1);
        expect(result.songs[0]?.qqMid).toBe('001abc');
        expect(result.hasMore).toBe(true);
    });

    it('resolves playable audio URL from open song detail', async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({
                song_mid: '001abc',
                song_play_url_hq: 'http://example.com/hq.mp3',
            }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const audioUrl = await resolveQQOpenAudioUrl({
            id: 1,
            name: 'Song',
            artists: [{ id: 1, name: 'Artist' }],
            album: { id: 0, name: 'Album' },
            duration: 0,
            qqMid: '001abc',
            musicProvider: 'qq',
        }, 'exhigh');

        expect(fetchMock).toHaveBeenCalled();
        expect(audioUrl).toBe('https://example.com/hq.mp3');
    });

    it('returns null when open detail payload is invalid', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({ invalid: true }),
        })));

        const detail = await fetchQQOpenSongDetail('周杰伦', '001abc');
        expect(detail).toBeNull();
    });
});
