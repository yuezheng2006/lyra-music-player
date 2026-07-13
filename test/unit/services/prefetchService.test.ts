import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAudioUrl = vi.fn();
const hasCachedAudio = vi.fn(async () => false);

vi.mock('@/services/musicProviders/registry', () => ({
    getProviderSongCacheKey: (_kind: string, song: { id: number; musicProvider?: string }) =>
        `audio_${song.musicProvider ?? 'netease'}_${song.id}`,
    getMusicProviderForSong: () => ({ getAudioUrl }),
    isNeteaseOnlineSong: (song?: { musicProvider?: string }) => !song?.musicProvider || song.musicProvider === 'netease',
}));

vi.mock('@/services/audioCache', () => ({
    hasCachedAudio: (...args: unknown[]) => hasCachedAudio(...(args as [])),
}));

vi.mock('@/services/netease', () => ({
    getOnlineSongCacheKey: (kind: string, song: { id: number }) => `${kind}_${song.id}`,
    isCloudSong: () => false,
    neteaseApi: {
        getLyric: vi.fn(async () => ({})),
        getProcessedLyricPayload: vi.fn(() => ({})),
    },
}));

vi.mock('@/utils/lyrics/neteaseProcessing', () => ({
    processNeteaseLyrics: vi.fn(async () => ({
        mainLrc: null,
        yrcLrc: null,
        transLrc: null,
        isPureMusic: true,
        lyrics: null,
        chorusRanges: [],
    })),
}));

vi.mock('@/utils/onlineLyricsState', () => ({
    loadOnlineLyricsState: vi.fn(async () => null),
    resolveOnlineLyrics: (_state: unknown, lyrics: unknown) => lyrics,
    saveOnlineLyricsState: vi.fn(async () => undefined),
}));

vi.mock('@/stores/useSettingsUiStore', () => ({
    useSettingsUiStore: {
        getState: () => ({
            enableAlternativeLyricSources: false,
            autoUseBestLyric: false,
            preferredAlternativeLyricSource: 'netease',
        }),
    },
}));

vi.mock('@/services/db', () => ({
    getFromCacheWithMigration: vi.fn(async () => null),
}));

vi.mock('@/utils/appPlaybackGuards', () => ({
    isLocalPlaybackSong: () => false,
    isNavidromePlaybackSong: () => false,
    isYtmPlaybackSong: () => false,
}));

import {
    __resetPrefetchCacheForTests,
    getPrefetchedData,
    prefetchNearbySongs,
    prefetchSongAudio,
} from '@/services/prefetchService';

// test/unit/services/prefetchService.test.ts
// Verifies audio-first prefetch commits URLs before lyrics work finishes.

describe('prefetchService audio-first', () => {
    beforeEach(() => {
        __resetPrefetchCacheForTests();
        getAudioUrl.mockReset();
        hasCachedAudio.mockReset();
        hasCachedAudio.mockResolvedValue(false);
    });

    it('commits the next-song audio URL as soon as the provider returns', async () => {
        getAudioUrl.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://cdn.example/next.mp3',
        });

        const song = {
            id: 42,
            name: 'Next Track',
            musicProvider: 'netease' as const,
        };

        const data = await prefetchSongAudio(song as any, 'exhigh');

        expect(data?.audioUrl).toBe('https://cdn.example/next.mp3');
        expect(getPrefetchedData(song as any, 'exhigh')?.audioUrl).toBe('https://cdn.example/next.mp3');
        expect(getAudioUrl).toHaveBeenCalledTimes(1);
    });

    it('urgently prefetches the immediate next queue song', async () => {
        getAudioUrl.mockImplementation(async (song: { id: number }) => ({
            kind: 'ok',
            audioUrl: `https://cdn.example/${song.id}.mp3`,
        }));

        const queue = [
            { id: 1, name: 'Current', musicProvider: 'netease' as const },
            { id: 2, name: 'Next', musicProvider: 'netease' as const },
            { id: 3, name: 'Later', musicProvider: 'netease' as const },
        ];

        await prefetchNearbySongs(1, queue as any, 'exhigh');

        expect(getPrefetchedData(queue[1] as any, 'exhigh')?.audioUrl).toBe('https://cdn.example/2.mp3');
    });
});
