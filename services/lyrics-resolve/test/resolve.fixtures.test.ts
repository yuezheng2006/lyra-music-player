import { describe, expect, it, vi } from 'vitest';
import { LyricsResolveCache } from '../src/cache';
import { resolveLyrics } from '../src/resolve/resolveLyrics';
import type { LrclibSourcePort } from '../src/providers/lrclibProvider';
import type { AmllSourcePort, LyricSourcePort, ResolveCandidate } from '../src/providers/types';
import type { LyricData } from '@lyra/types';

const wordByWord: LyricData = {
    lines: [{
        words: [{ text: '你好', startTime: 0, endTime: 1 }],
        startTime: 0,
        endTime: 1,
        fullText: '你好',
    }],
    isWordByWord: true,
};

const lineSynced: LyricData = {
    lines: [{
        words: [{ text: '你好', startTime: 0, endTime: 1 }],
        startTime: 0,
        endTime: 1,
        fullText: '你好',
    }],
    isWordByWord: false,
};

function candidate(partial: Partial<ResolveCandidate> = {}): ResolveCandidate {
    return {
        id: 101,
        name: 'Song Title',
        artists: [{ id: 1, name: 'Artist Name' }],
        album: { id: 2, name: 'Album Name' },
        duration: 200000,
        dt: 200000,
        ...partial,
    };
}

function mockPort(
    id: 'netease' | 'qq' | 'kugou',
    searchResult: ResolveCandidate[],
    fetchResult: Awaited<ReturnType<LyricSourcePort['fetchLyrics']>>,
): LyricSourcePort {
    return {
        id,
        search: vi.fn().mockResolvedValue(searchResult),
        fetchLyrics: vi.fn().mockResolvedValue(fetchResult),
    };
}

describe('resolveLyrics fixtures', () => {
    const request = {
        title: 'Song Title',
        artist: 'Artist Name',
        album: 'Album Name',
        durationMs: 200000,
    };

    it('returns matched word-by-word lyrics from netease', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: wordByWord });
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const result = await resolveLyrics(request, {
            providers: { netease },
            amll,
        });
        expect(result.status).toBe('matched');
        expect(result.provenance?.source).toBe('netease');
        expect(result.lyrics?.isWordByWord).toBe(true);
        expect(result.fingerprint).toBeTruthy();
    });

    it('returns pure_music when netease marks instrumental', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: null, isPureMusic: true });
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const result = await resolveLyrics(request, {
            providers: { netease },
            amll,
        });
        expect(result.status).toBe('pure_music');
        expect(result.lyrics).toBeNull();
        expect(amll.fetchByPlatformId).not.toHaveBeenCalled();
    });

    it('falls through to amll after non word-by-word netease lyrics', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: lineSynced });
        const amll: AmllSourcePort = {
            fetchByPlatformId: vi.fn().mockResolvedValue(wordByWord),
        };
        const result = await resolveLyrics(request, {
            providers: { netease },
            amll,
        });
        expect(result.status).toBe('matched');
        expect(result.provenance?.source).toBe('amll');
        expect(result.provenance?.amllPlatform).toBe('ncm');
    });

    it('returns not_found when domestic and lrclib both miss', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: lineSynced });
        const qq = mockPort('qq', [candidate({ id: 202, qqMid: 'mid' })], { lyrics: lineSynced });
        const kugou = mockPort('kugou', [candidate({ id: 303, kgHash: 'hash' })], { lyrics: null });
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const lrclib: LrclibSourcePort = { fetch: vi.fn().mockResolvedValue({ lyrics: null }) };
        const result = await resolveLyrics(request, {
            providers: { netease, qq, kugou },
            amll,
            lrclib,
        });
        expect(result.status).toBe('not_found');
        expect(result.lyrics).toBeNull();
        expect(lrclib.fetch).toHaveBeenCalledOnce();
    });

    it('falls back to lrclib line-synced lyrics after domestic miss', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: lineSynced });
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const lrclib: LrclibSourcePort = {
            fetch: vi.fn().mockResolvedValue({ lyrics: lineSynced, platformId: '42' }),
        };
        const result = await resolveLyrics(request, {
            providers: { netease },
            amll,
            lrclib,
        });
        expect(result.status).toBe('matched');
        expect(result.provenance?.source).toBe('lrclib');
        expect(result.provenance?.platformId).toBe('42');
        expect(result.lyrics?.isWordByWord).toBe(false);
    });

    it('prefers lrclib first when preferredSource is lrclib', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: wordByWord });
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const lrclib: LrclibSourcePort = {
            fetch: vi.fn().mockResolvedValue({ lyrics: lineSynced, platformId: '7' }),
        };
        const result = await resolveLyrics(
            { ...request, hints: { preferredSource: 'lrclib' } },
            { providers: { netease }, amll, lrclib },
        );
        expect(result.status).toBe('matched');
        expect(result.provenance?.source).toBe('lrclib');
        expect(netease.search).not.toHaveBeenCalled();
    });

    it('respects overall timeout and returns not_found', async () => {
        const slowNetease: LyricSourcePort = {
            id: 'netease',
            search: () => new Promise(() => {}),
            fetchLyrics: async () => ({ lyrics: null }),
        };
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const result = await resolveLyrics(
            { ...request, policy: { timeoutMs: 50 } },
            { providers: { netease: slowNetease }, amll },
        );
        expect(result.status).toBe('not_found');
        expect(result.elapsedMs).toBeLessThan(2000);
    });

    it('serves cached matched responses on the second call', async () => {
        const netease = mockPort('netease', [candidate()], { lyrics: wordByWord });
        const amll: AmllSourcePort = { fetchByPlatformId: vi.fn().mockResolvedValue(null) };
        const cache = new LyricsResolveCache();
        const first = await resolveLyrics(request, { providers: { netease }, amll, cache });
        const second = await resolveLyrics(request, { providers: { netease }, amll, cache });
        expect(first.status).toBe('matched');
        expect(second.provenance?.cacheHit).toBe(true);
        expect(netease.search).toHaveBeenCalledTimes(1);
        expect(netease.fetchLyrics).toHaveBeenCalledTimes(1);
    });
});
