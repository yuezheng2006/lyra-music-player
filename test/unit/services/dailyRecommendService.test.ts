import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    fetchAggregatedDailyRecommend,
    interleaveDailyRecommendSongs,
    listTodayPicksProviders,
} from '@/services/dailyRecommendService';
import {
    dedupeSongsByTitle,
    normalizeRecommendTitle,
} from '@/services/dailyChartPicks';
import type { SongResult } from '@/types';

// test/unit/services/dailyRecommendService.test.ts

vi.mock('@/services/dailyChartPicks', async () => {
    const actual = await vi.importActual<typeof import('@/services/dailyChartPicks')>(
        '@/services/dailyChartPicks',
    );
    return {
        ...actual,
        fetchHotChartSeeds: vi.fn(),
        fetchChartMatchedPicks: vi.fn(),
    };
});

vi.mock('@/services/neteasePodcast', () => ({
    fetchDailyRecommendSongs: vi.fn(),
}));

import {
    fetchChartMatchedPicks,
    fetchHotChartSeeds,
} from '@/services/dailyChartPicks';
import { fetchDailyRecommendSongs } from '@/services/neteasePodcast';

const song = (
    provider: SongResult['musicProvider'],
    id: number,
    name: string,
): SongResult => ({
    id,
    name,
    musicProvider: provider,
    providerSongId: String(id),
    artists: [{ id: 0, name: 'A' }],
    album: { id: 0, name: 'Alb' },
    duration: 1000,
});

describe('dailyRecommendService', () => {
    it('interleaves songs across providers and soft-dedupes titles', () => {
        const merged = interleaveDailyRecommendSongs([
            {
                provider: 'netease',
                kind: 'personalized',
                songs: [song('netease', 1, '晴天'), song('netease', 2, '起风了')],
            },
            {
                provider: 'qq',
                kind: 'picks',
                songs: [song('qq', 10, '晴天'), song('qq', 11, '夜曲')],
            },
            {
                provider: 'coco',
                kind: 'picks',
                songs: [song('coco', 20, '海阔天空')],
            },
        ]);

        expect(merged.map(item => item.name)).toEqual(['晴天', '海阔天空', '起风了', '夜曲']);
        expect(merged.filter(item => normalizeRecommendTitle(item.name) === '晴天')).toHaveLength(1);
    });

    it('dedupes cover/version variants within a bucket', () => {
        expect(dedupeSongsByTitle([
            song('coco', 1, '海阔天空'),
            song('coco', 2, '海阔天空 (女版)'),
            song('coco', 3, '海阔天空（Progressive House）'),
            song('coco', 4, '起风了'),
        ]).map(item => item.name)).toEqual(['海阔天空', '起风了']);
    });

    it('skips empty buckets', () => {
        expect(interleaveDailyRecommendSongs([
            { provider: 'qishui', kind: 'picks', songs: [] },
            { provider: 'coco', kind: 'picks', songs: [song('coco', 1, 'only')] },
        ]).map(item => item.name)).toEqual(['only']);
    });

    it('lists enabled peer providers and excludes netease', () => {
        expect(listTodayPicksProviders({
            netease: true,
            qq: true,
            qishui: false,
            coco: true,
            kugou: false,
            bilibili: false,
            kuwo: false,
        })).toEqual(['qq', 'coco']);
    });

    describe('fetchAggregatedDailyRecommend', () => {
        beforeEach(() => {
            vi.mocked(fetchDailyRecommendSongs).mockReset();
            vi.mocked(fetchHotChartSeeds).mockReset();
            vi.mocked(fetchChartMatchedPicks).mockReset();
            vi.mocked(fetchHotChartSeeds).mockResolvedValue([
                { name: '晴天', artist: '周杰伦' },
            ]);
        });

        it('fetches chart picks from enabled peer providers and skips netease personalized', async () => {
            vi.mocked(fetchChartMatchedPicks).mockImplementation(async (provider) => {
                if (provider === 'qq') return [song('qq', 1, '晴天')];
                if (provider === 'coco') return [song('coco', 2, '夜曲')];
                return [];
            });

            const result = await fetchAggregatedDailyRecommend({
                netease: true,
                qq: true,
                qishui: false,
                coco: true,
                kugou: false,
                bilibili: false,
                kuwo: false,
            });

            expect(fetchDailyRecommendSongs).not.toHaveBeenCalled();
            expect(fetchHotChartSeeds).toHaveBeenCalled();
            expect(result.needLoginNetease).toBe(false);
            expect(result.sources.map(s => s.provider).sort()).toEqual(['coco', 'qq']);
            expect(result.songs.map(s => s.name).sort()).toEqual(['夜曲', '晴天']);
        });

        it('returns empty when no peer provider is enabled', async () => {
            const result = await fetchAggregatedDailyRecommend({
                netease: true,
                qq: false,
                qishui: false,
                coco: false,
                kugou: false,
                bilibili: false,
                kuwo: false,
            });

            expect(result.songs).toEqual([]);
            expect(result.sources).toEqual([]);
            expect(result.needLoginNetease).toBe(false);
            expect(fetchDailyRecommendSongs).not.toHaveBeenCalled();
            expect(fetchHotChartSeeds).not.toHaveBeenCalled();
            expect(fetchChartMatchedPicks).not.toHaveBeenCalled();
        });
    });
});
