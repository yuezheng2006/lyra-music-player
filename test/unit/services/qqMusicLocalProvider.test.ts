import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { qqMusicLocalProvider } from '@/services/musicProviders/qqMusicLocalProvider';
import { requestQQ } from '@/utils/lyrics/providers/qqLyricProvider';
import { searchQQOpenApi, resolveQQOpenAudioUrl } from '@/services/musicProviders/qqOpenApi';
import { QQ_MUSIC_COOKIE_STORAGE_KEY, QQ_MUSIC_GUID_STORAGE_KEY } from '@/services/musicProviders/qqMusicAuth';

vi.mock('@/utils/lyrics/providers/qqLyricProvider', () => ({
    fetchQQLyrics: vi.fn(),
    searchQQLyrics: vi.fn(),
    requestQQ: vi.fn(),
}));

vi.mock('@/services/musicProviders/qqOpenApi', async () => {
    const actual = await vi.importActual<typeof import('@/services/musicProviders/qqOpenApi')>('@/services/musicProviders/qqOpenApi');
    return {
        ...actual,
        searchQQOpenApi: vi.fn(),
        resolveQQOpenAudioUrl: vi.fn(),
        fetchQQOpenLyrics: vi.fn(),
    };
});

describe('qqMusicLocalProvider', () => {
    const requestQQMock = vi.mocked(requestQQ);
    const searchQQOpenApiMock = vi.mocked(searchQQOpenApi);
    const resolveQQOpenAudioUrlMock = vi.mocked(resolveQQOpenAudioUrl);
    const stubQQLogin = () => {
        const values = new Map<string, string>([
            [QQ_MUSIC_COOKIE_STORAGE_KEY, 'uin=123456789; qm_keyst=abc;'],
            [QQ_MUSIC_GUID_STORAGE_KEY, '987654321'],
        ]);
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => values.get(key) ?? null),
            setItem: vi.fn((key: string, value: string) => values.set(key, value)),
            removeItem: vi.fn((key: string) => values.delete(key)),
        });
    };

    beforeEach(() => {
        requestQQMock.mockReset();
        searchQQOpenApiMock.mockReset();
        resolveQQOpenAudioUrlMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('resolves playable audio URL from QQ vkey response', async () => {
        stubQQLogin();
        requestQQMock.mockResolvedValue({
            sip: ['https://dl.stream.qqmusic.qq.com/'],
            midurlinfo: [
                { purl: '' },
                { purl: 'M800song-mid.mp3?vkey=abc', filename: 'M800song-mid.mp3' },
            ],
        });

        const result = await qqMusicLocalProvider.getAudioUrl({
            id: 1,
            name: 'Song',
            artists: [],
            album: { id: 0, name: '' },
            duration: 1000,
            qqMid: 'song-mid',
            musicProvider: 'qq',
        }, { quality: 'exhigh' });

        expect(requestQQMock).toHaveBeenCalledWith(
            'CgiGetVkey',
            'vkey.GetVkeyServer',
            expect.objectContaining({
                filename: [
                    'M800song-mid.mp3',
                    'M500song-mid.mp3',
                    'C400song-mid.m4a',
                ],
                guid: '987654321',
                songmid: ['song-mid', 'song-mid', 'song-mid'],
                songtype: [0, 0, 0],
                uin: '123456789',
            }),
            expect.objectContaining({
                comm: expect.objectContaining({
                    authst: 'abc',
                    ct: 19,
                    format: 'json',
                    uin: '123456789',
                }),
            }),
        );
        expect(result).toEqual({
            kind: 'ok',
            audioUrl: 'https://dl.stream.qqmusic.qq.com/M800song-mid.mp3?vkey=abc',
        });
    });

    it('falls back to open API audio when QQ login is unavailable', async () => {
        resolveQQOpenAudioUrlMock.mockResolvedValue('https://example.com/hq.mp3');

        const result = await qqMusicLocalProvider.getAudioUrl({
            id: 1,
            name: 'Song',
            artists: [{ id: 1, name: 'Artist' }],
            album: { id: 0, name: '' },
            duration: 1000,
            qqMid: 'song-mid',
            musicProvider: 'qq',
        }, { quality: 'exhigh' });

        expect(requestQQMock).not.toHaveBeenCalled();
        expect(resolveQQOpenAudioUrlMock).toHaveBeenCalled();
        expect(result).toEqual({ kind: 'ok', audioUrl: 'https://example.com/hq.mp3' });
    });

    it('falls back to open API search when official search returns empty', async () => {
        const { searchQQLyrics } = await import('@/utils/lyrics/providers/qqLyricProvider');
        vi.mocked(searchQQLyrics).mockResolvedValue([]);
        searchQQOpenApiMock.mockResolvedValue({
            songs: [{
                id: 0,
                name: 'Open Song',
                artists: [{ id: 0, name: 'Artist' }],
                album: { id: 0, name: 'Album' },
                duration: 0,
                qqMid: 'open-mid',
            }],
            hasMore: false,
        });

        const result = await qqMusicLocalProvider.search('周杰伦', { limit: 10, offset: 0 });

        expect(searchQQOpenApiMock).toHaveBeenCalledWith('周杰伦', { limit: 10, offset: 0 });
        expect(result.songs[0]?.qqMid).toBe('open-mid');
        expect(result.songs[0]?.musicProvider).toBe('qq');
    });
});
