import { describe, expect, it } from 'vitest';
import { interleaveDailyRecommendSongs } from '@/services/dailyRecommendService';
import {
    dedupeSongsByTitle,
    normalizeRecommendTitle,
} from '@/services/dailyChartPicks';
import type { SongResult } from '@/types';

// test/unit/services/dailyRecommendService.test.ts

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
});
