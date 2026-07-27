import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCachedAudioBlob = vi.fn(async () => null as Blob | null);
const getAudioUrl = vi.fn();
const setVideoSrc = vi.fn();
const setAudioSrc = vi.fn();

vi.mock('@/services/audioCache', () => ({
    getCachedAudioBlob: (...args: unknown[]) => getCachedAudioBlob(...(args as [])),
}));

vi.mock('@/services/coverCache', () => ({
    getCachedCoverUrl: vi.fn(async () => null),
}));

vi.mock('@/services/db', () => ({
    getFromCacheWithMigration: vi.fn(async () => ({
        lines: [{ fullText: 'cached lyric', startTimeMs: 0, endTimeMs: 1000, words: [] }],
        isWordByWord: false,
    })),
    getLocalSongs: vi.fn(async () => []),
}));

vi.mock('@/services/musicProviders/registry', () => ({
    getProviderSongCacheKey: (_kind: string, song: { id: number; musicProvider?: string }) =>
        `audio_${song.musicProvider ?? 'netease'}_${song.id}`,
    getMusicProviderForSong: () => ({ getAudioUrl }),
    isNeteaseOnlineSong: (song?: { musicProvider?: string }) => !song?.musicProvider || song.musicProvider === 'netease',
}));

vi.mock('@/utils/onlineLyricsState', () => ({
    loadOnlineLyricsState: vi.fn(async () => null),
    resolveOnlineLyrics: (_state: unknown, lyrics: unknown) => lyrics,
}));

vi.mock('@/utils/appPlaybackGuards', () => ({
    isLocalPlaybackSong: () => false,
    isNavidromePlaybackSong: () => false,
    isYtmPlaybackSong: () => false,
}));

vi.mock('@/stores/useSettingsUiStore', () => ({
    useSettingsUiStore: { getState: () => ({}) },
}));

import { restorePlaybackSourceForSong } from '@/components/app/playback/restorePlaybackSource';

// test/unit/playback/restorePlaybackSource.test.ts
// Cached-audio restore must still arm bilibili videoSrc for the muted video stage.

describe('restorePlaybackSourceForSong bilibili video restore', () => {
    const bilibiliSong = {
        id: 8801,
        name: 'Bilibili Restore',
        musicProvider: 'bilibili' as const,
    };

    beforeEach(() => {
        getCachedAudioBlob.mockReset();
        getAudioUrl.mockReset();
        setVideoSrc.mockReset();
        setAudioSrc.mockReset();
    });

    it('sets videoSrc when restoring from cached audio blob', async () => {
        getCachedAudioBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mp4' }));
        getAudioUrl.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://cdn.example/audio.m4s',
            videoUrl: 'https://cdn.example/video.m4s',
        });

        const blobUrlRef = { current: null as string | null };
        const currentOnlineAudioUrlFetchedAtRef = { current: 123 };

        const ok = await restorePlaybackSourceForSong(bilibiliSong as any, {
            audioQuality: 'standard',
            blobUrlRef,
            currentOnlineAudioUrlFetchedAtRef,
            setCurrentSong: vi.fn(),
            setCachedCoverUrl: vi.fn(),
            setAudioSrc,
            setVideoSrc,
            setLyrics: vi.fn(),
            setStatusMsg: vi.fn(),
        });

        expect(ok).toBe(true);
        expect(setAudioSrc).toHaveBeenCalledWith(expect.stringMatching(/^blob:/));
        expect(setVideoSrc).toHaveBeenCalledWith('https://cdn.example/video.m4s');
        expect(getAudioUrl).toHaveBeenCalledTimes(1);
    });

    it('clears videoSrc for netease cached-audio restore', async () => {
        getCachedAudioBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' }));

        const neteaseSong = {
            id: 100,
            name: 'Netease Track',
            musicProvider: 'netease' as const,
        };

        const ok = await restorePlaybackSourceForSong(neteaseSong as any, {
            audioQuality: 'exhigh',
            blobUrlRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: null },
            setCurrentSong: vi.fn(),
            setCachedCoverUrl: vi.fn(),
            setAudioSrc,
            setVideoSrc,
            setLyrics: vi.fn(),
            setStatusMsg: vi.fn(),
        });

        expect(ok).toBe(true);
        expect(setVideoSrc).toHaveBeenCalledWith(null);
        expect(getAudioUrl).not.toHaveBeenCalled();
    });
});
