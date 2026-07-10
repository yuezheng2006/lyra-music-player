import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { qqMusicProvider } from '@/services/musicProviders/qqMusicProvider';
import { qqMusicLocalProvider } from '@/services/musicProviders/qqMusicLocalProvider';
import {
    requestSidecarAudioUrl,
    requestSidecarLyrics,
    requestSidecarSearch,
} from '@/services/musicProviders/sidecarProviderClient';

vi.mock('@/services/musicProviders/sidecarProviderClient', () => ({
    requestSidecarSearch: vi.fn(),
    requestSidecarAudioUrl: vi.fn(),
    requestSidecarLyrics: vi.fn(),
}));

vi.mock('@/services/musicProviders/qqMusicLocalProvider', () => ({
    qqMusicLocalProvider: {
        id: 'qq',
        search: vi.fn(),
        getAudioUrl: vi.fn(),
        getLyrics: vi.fn(),
    },
}));

describe('qqMusicProvider', () => {
    const requestSidecarSearchMock = vi.mocked(requestSidecarSearch);
    const requestSidecarAudioUrlMock = vi.mocked(requestSidecarAudioUrl);
    const requestSidecarLyricsMock = vi.mocked(requestSidecarLyrics);
    const localSearchMock = vi.mocked(qqMusicLocalProvider.search);
    const localAudioMock = vi.mocked(qqMusicLocalProvider.getAudioUrl);
    const localLyricsMock = vi.mocked(qqMusicLocalProvider.getLyrics);

    beforeEach(() => {
        requestSidecarSearchMock.mockReset();
        requestSidecarAudioUrlMock.mockReset();
        requestSidecarLyricsMock.mockReset();
        localSearchMock.mockReset();
        localAudioMock.mockReset();
        localLyricsMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('uses sidecar search results when available', async () => {
        requestSidecarSearchMock.mockResolvedValue({
            songs: [{
                id: 1,
                name: 'Sidecar Song',
                artists: [{ id: 1, name: 'Artist' }],
                album: { id: 0, name: 'Album' },
                duration: 1000,
                qqMid: 'sidecar-mid',
            }],
            hasMore: false,
        });

        const result = await qqMusicProvider.search('周杰伦', { limit: 10, offset: 0 });

        expect(requestSidecarSearchMock).toHaveBeenCalledWith('qq', '周杰伦', { limit: 10, offset: 0 });
        expect(localSearchMock).not.toHaveBeenCalled();
        expect(result.songs[0]).toEqual(expect.objectContaining({
            musicProvider: 'qq',
            providerSongId: 'sidecar-mid',
        }));
    });

    it('falls back to local search when sidecar returns empty', async () => {
        requestSidecarSearchMock.mockResolvedValue({ songs: [], hasMore: false });
        localSearchMock.mockResolvedValue({
            songs: [{
                id: 2,
                name: 'Local Song',
                artists: [{ id: 1, name: 'Artist' }],
                album: { id: 0, name: 'Album' },
                duration: 1000,
                qqMid: 'local-mid',
                musicProvider: 'qq',
                providerSongId: 'local-mid',
            }],
            hasMore: false,
        });

        const result = await qqMusicProvider.search('周杰伦', { limit: 10, offset: 0 });

        expect(localSearchMock).toHaveBeenCalledWith('周杰伦', { limit: 10, offset: 0 });
        expect(result.songs[0]?.qqMid).toBe('local-mid');
    });

    it('uses sidecar audio URL when available', async () => {
        requestSidecarAudioUrlMock.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://example.com/sidecar.mp3',
        });

        const result = await qqMusicProvider.getAudioUrl({
            id: 1,
            name: 'Song',
            artists: [],
            album: { id: 0, name: '' },
            duration: 1000,
            qqMid: 'song-mid',
            musicProvider: 'qq',
        }, { quality: 'exhigh' });

        expect(localAudioMock).not.toHaveBeenCalled();
        expect(result).toEqual({
            kind: 'ok',
            audioUrl: 'https://example.com/sidecar.mp3',
        });
    });

    it('does not double-hit local audio when sidecar already resolved unavailable', async () => {
        requestSidecarAudioUrlMock.mockResolvedValue({ kind: 'unavailable' });

        const result = await qqMusicProvider.getAudioUrl({
            id: 1,
            name: 'Song',
            artists: [],
            album: { id: 0, name: '' },
            duration: 1000,
            qqMid: 'song-mid',
            musicProvider: 'qq',
        }, { quality: 'exhigh' });

        expect(localAudioMock).not.toHaveBeenCalled();
        expect(result).toEqual({ kind: 'unavailable' });
    });

    it('falls back to local audio when sidecar transport fails', async () => {
        requestSidecarAudioUrlMock.mockRejectedValue(new Error('sidecar down'));
        localAudioMock.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://example.com/local.mp3',
        });

        const result = await qqMusicProvider.getAudioUrl({
            id: 1,
            name: 'Song',
            artists: [],
            album: { id: 0, name: '' },
            duration: 1000,
            qqMid: 'song-mid',
            musicProvider: 'qq',
        }, { quality: 'exhigh' });

        expect(localAudioMock).toHaveBeenCalled();
        expect(result).toEqual({
            kind: 'ok',
            audioUrl: 'https://example.com/local.mp3',
        });
    });

    it('falls back to local lyrics when sidecar returns null', async () => {
        requestSidecarLyricsMock.mockResolvedValue(null);
        localLyricsMock.mockResolvedValue({ lines: [], isWordByWord: true });

        const result = await qqMusicProvider.getLyrics({
            id: 1,
            name: 'Song',
            artists: [],
            album: { id: 0, name: '' },
            duration: 1000,
            qqMid: 'song-mid',
            musicProvider: 'qq',
        });

        expect(localLyricsMock).toHaveBeenCalled();
        expect(result).toEqual({ lines: [], isWordByWord: true });
    });
});
