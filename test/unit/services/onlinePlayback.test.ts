import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCachedAudioBlob = vi.fn(async () => null as Blob | null);
const getAudioUrl = vi.fn();

vi.mock('@/services/audioCache', () => ({
    getCachedAudioBlob: (...args: unknown[]) => getCachedAudioBlob(...(args as [])),
}));

vi.mock('@/services/musicProviders/registry', () => ({
    getProviderSongCacheKey: (_kind: string, song: { id: number; musicProvider?: string }) =>
        `audio_${song.musicProvider ?? 'netease'}_${song.id}`,
    getMusicProviderForSong: () => ({ getAudioUrl }),
    isNeteaseOnlineSong: (song?: { musicProvider?: string }) => !song?.musicProvider || song.musicProvider === 'netease',
}));

vi.mock('@/services/prefetchService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/services/prefetchService')>();
    return {
        ...actual,
        isUrlValid: () => true,
        updatePrefetchedAudioUrl: vi.fn(),
    };
});

import { loadOnlineSongAudioSource } from '@/services/onlinePlayback';
import type { PrefetchedSongData } from '@/services/prefetchService';

// test/unit/services/onlinePlayback.test.ts
// Ensures Bilibili dual-stream videoSrc survives prefetch and cached-audio paths.

describe('loadOnlineSongAudioSource video companion', () => {
    const bilibiliSong = {
        id: 9001,
        name: 'Bilibili Track',
        musicProvider: 'bilibili' as const,
    };

    beforeEach(() => {
        getCachedAudioBlob.mockReset();
        getCachedAudioBlob.mockResolvedValue(null);
        getAudioUrl.mockReset();
    });

    it('returns prefetched videoSrc together with prefetched audio', async () => {
        const prefetched: PrefetchedSongData = {
            songKey: 'audio_bilibili_9001',
            songId: 9001,
            audioUrl: 'https://cdn.example/audio.m4s',
            audioUrlFetchedAt: Date.now(),
            audioUrlQuality: 'standard',
            videoUrl: 'https://cdn.example/video.m4s',
            lyrics: null,
            lyricRaw: null,
            coverUrl: null,
        };

        const result = await loadOnlineSongAudioSource(bilibiliSong as any, 'standard', prefetched);

        expect(result).toEqual({
            kind: 'ok',
            audioSrc: 'https://cdn.example/audio.m4s',
            videoSrc: 'https://cdn.example/video.m4s',
        });
        expect(getAudioUrl).not.toHaveBeenCalled();
    });

    it('fetches companion video when audio blob is cached but prefetch has no videoUrl', async () => {
        getCachedAudioBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mp4' }));
        getAudioUrl.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://cdn.example/audio.m4s',
            videoUrl: 'https://cdn.example/video.m4s',
        });

        // Prefetch marked as disk-cached so blob path is used (streaming URL takes priority otherwise).
        const prefetched: PrefetchedSongData = {
            songKey: 'audio_bilibili_9001',
            songId: 9001,
            audioUrl: 'CACHED_IN_DB',
            audioUrlFetchedAt: Date.now(),
            audioUrlQuality: 'standard',
            videoUrl: null,
            lyrics: null,
            lyricRaw: null,
            coverUrl: null,
        };

        const result = await loadOnlineSongAudioSource(bilibiliSong as any, 'standard', prefetched);

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') {
            return;
        }
        expect(result.audioSrc.startsWith('blob:')).toBe(true);
        expect(result.videoSrc).toBe('https://cdn.example/video.m4s');
        expect(getAudioUrl).toHaveBeenCalledTimes(1);
    });

    it('falls back to provider fetch for prefetched audio missing legacy videoUrl', async () => {
        getAudioUrl.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://cdn.example/audio.m4s',
            videoUrl: 'http://cdn.example/video.m4s',
        });

        const prefetched: PrefetchedSongData = {
            songKey: 'audio_bilibili_9001',
            songId: 9001,
            audioUrl: 'https://cdn.example/audio.m4s',
            audioUrlFetchedAt: Date.now(),
            audioUrlQuality: 'standard',
            videoUrl: null,
            lyrics: null,
            lyricRaw: null,
            coverUrl: null,
        };

        const result = await loadOnlineSongAudioSource(bilibiliSong as any, 'standard', prefetched);

        expect(result).toEqual({
            kind: 'ok',
            audioSrc: 'https://cdn.example/audio.m4s',
            videoSrc: 'https://cdn.example/video.m4s',
        });
        expect(getAudioUrl).toHaveBeenCalledTimes(1);
    });

    it('returns both streams from a fresh provider fetch', async () => {
        getAudioUrl.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://cdn.example/audio.m4s',
            videoUrl: 'https://cdn.example/video.m4s',
        });

        const result = await loadOnlineSongAudioSource(bilibiliSong as any, 'standard', null);

        expect(result).toEqual({
            kind: 'ok',
            audioSrc: 'https://cdn.example/audio.m4s',
            videoSrc: 'https://cdn.example/video.m4s',
        });
    });

    it('omits videoSrc when provider only returns muxed audio', async () => {
        getAudioUrl.mockResolvedValue({
            kind: 'ok',
            audioUrl: 'https://cdn.example/clip.mp4',
            videoUrl: null,
        });

        const result = await loadOnlineSongAudioSource(bilibiliSong as any, 'standard', null);

        expect(result).toEqual({
            kind: 'ok',
            audioSrc: 'https://cdn.example/clip.mp4',
        });
    });

    it('prefers valid prefetch URL before reading Electron audio blob cache', async () => {
        getCachedAudioBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' }));
        const neteaseSong = { id: 42, name: 'Netease Track' };
        const prefetched: PrefetchedSongData = {
            songKey: 'audio_42',
            songId: 42,
            audioUrl: 'https://cdn.example/prefetch.mp3',
            audioUrlFetchedAt: Date.now(),
            audioUrlQuality: 'exhigh',
            videoUrl: null,
            lyrics: null,
            lyricRaw: null,
            coverUrl: null,
        };

        const result = await loadOnlineSongAudioSource(neteaseSong as any, 'exhigh', prefetched);

        expect(result).toEqual({
            kind: 'ok',
            audioSrc: 'https://cdn.example/prefetch.mp3',
        });
        expect(getCachedAudioBlob).not.toHaveBeenCalled();
        expect(getAudioUrl).not.toHaveBeenCalled();
    });

    it('does not call getAudioUrl for companion video on Netease cache hits', async () => {
        getCachedAudioBlob.mockResolvedValue(new Blob(['audio'], { type: 'audio/mpeg' }));
        const neteaseSong = { id: 43, name: 'Netease Track' };

        const result = await loadOnlineSongAudioSource(neteaseSong as any, 'exhigh', null);

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;
        expect(result.audioSrc.startsWith('blob:')).toBe(true);
        expect(result.videoSrc).toBeUndefined();
        expect(getAudioUrl).not.toHaveBeenCalled();
    });
});
