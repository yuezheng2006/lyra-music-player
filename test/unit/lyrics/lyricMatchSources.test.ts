import { beforeEach, describe, expect, it, vi } from 'vitest';
import { neteaseApi } from '@/services/netease';
import { getMusicProvider } from '@/services/musicProviders/registry';
import { fetchAmllDbLyrics } from '@/utils/lyrics/providers/amllDbProvider';
import { searchAmllDbLyricCandidates } from '@/utils/lyrics/lyricMatchSources';

// test/unit/lyrics/lyricMatchSources.test.ts
// Covers source-specific lyric matching orchestration.

vi.mock('@/services/netease', () => ({
    neteaseApi: {
        cloudSearch: vi.fn(),
        getLyric: vi.fn(),
    }
}));

vi.mock('@/services/musicProviders/registry', () => ({
    getMusicProvider: vi.fn(),
}));

vi.mock('@/utils/lyrics/neteaseProcessing', () => ({
    fetchNeteaseChorusRanges: vi.fn(),
    processNeteaseLyrics: vi.fn(),
}));

vi.mock('@/utils/lyrics/providers/kugouLyricProvider', () => ({
    searchKugouLyrics: vi.fn(),
    fetchKugouLyrics: vi.fn(),
}));

vi.mock('@/utils/lyrics/providers/amllDbProvider', () => ({
    fetchAmllDbLyrics: vi.fn(),
}));

vi.mock('@/utils/lyrics/chorusEffects', () => ({
    applyNeteaseChorusByTime: vi.fn((lyrics) => lyrics),
}));

describe('lyricMatchSources', () => {
    const cloudSearchMock = vi.mocked(neteaseApi.cloudSearch);
    const getMusicProviderMock = vi.mocked(getMusicProvider);
    const fetchAmllDbLyricsMock = vi.mocked(fetchAmllDbLyrics);

    beforeEach(() => {
        vi.resetAllMocks();
        getMusicProviderMock.mockReturnValue({
            id: 'qq',
            search: vi.fn(async () => ({ songs: [], hasMore: false })),
            getAudioUrl: vi.fn(),
            getLyrics: vi.fn(),
        });
    });

    it('probes AMLLDB candidates concurrently', async () => {
        const deferred: Array<{
            resolve: (value: { lines: []; isWordByWord: true } | null) => void;
        }> = [];

        cloudSearchMock.mockResolvedValue({
            result: {
                songs: [
                    { id: 101, name: 'Song Title', dt: 200000, ar: [{ name: 'Artist Name' }] },
                    { id: 102, name: 'Song Title', dt: 200000, ar: [{ name: 'Artist Name' }] },
                ],
            },
        });
        fetchAmllDbLyricsMock.mockImplementation(() => {
            let resolve!: (value: { lines: []; isWordByWord: true } | null) => void;
            const promise = new Promise<{ lines: []; isWordByWord: true } | null>((res) => {
                resolve = res;
            });
            deferred.push({ resolve });
            return promise;
        });

        const searchPromise = searchAmllDbLyricCandidates('Song Title - Artist Name', {
            title: 'Song Title',
            artist: 'Artist Name',
            durationMs: 200000,
        });
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(fetchAmllDbLyricsMock).toHaveBeenCalledTimes(2);

        deferred[0].resolve(null);
        deferred[1].resolve({ lines: [], isWordByWord: true });
        const results = await searchPromise;

        expect(results.map(result => result.id)).toEqual([102]);
    });
});
