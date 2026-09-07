import { describe, expect, it } from 'vitest';
import { NETEASE_HOT_CHART_PLAYLIST_ID } from '@/services/dailyChartPicks';
import { OFFICIAL_CHART_CATALOG } from '@/data/musicCharts/catalog';
import {
    isOfficialChartId,
    mapPlaylistDetailToSummary,
    markNeteaseChartSongs,
    resolveChartPreviewPlaySong,
    resolveOfficialChartId,
} from '@/utils/charts/officialChartMath';

// test/unit/charts/officialChartMath.test.ts

describe('officialChartMath', () => {
    it('keeps the hot chart id aligned with daily recommend seeds', () => {
        expect(OFFICIAL_CHART_CATALOG.find(chart => chart.id === 'hot')?.playlistId)
            .toBe(NETEASE_HOT_CHART_PLAYLIST_ID);
    });

    it('resolves unknown chart ids to hot', () => {
        expect(isOfficialChartId('soar')).toBe(true);
        expect(isOfficialChartId('radar')).toBe(false);
        expect(resolveOfficialChartId('original')).toBe('original');
        expect(resolveOfficialChartId('nope')).toBe('hot');
    });

    it('maps playlist detail into a playable summary', () => {
        const summary = mapPlaylistDetailToSummary('hot', {
            playlist: {
                id: 3778678,
                name: '云音乐热歌榜',
                coverImgUrl: 'https://example.com/hot.jpg',
                trackCount: 200,
                playCount: 9,
                tracks: [
                    { name: '海阔天空', ar: [{ name: 'Beyond' }] },
                    { name: '晴天', artists: [{ name: '周杰伦' }] },
                    { name: '  ' },
                ],
            },
        });

        expect(summary.name).toBe('云音乐热歌榜');
        expect(summary.coverUrl).toBe('https://example.com/hot.jpg');
        expect(summary.trackCount).toBe(200);
        expect(summary.previewTracks).toEqual([
            { name: '海阔天空', artist: 'Beyond' },
            { name: '晴天', artist: '周杰伦' },
        ]);
        expect(summary.playlist?.musicProvider).toBe('netease');
    });

    it('marks chart songs as netease when provider is missing', () => {
        const songs = markNeteaseChartSongs([
            { id: 1, name: '晴天' } as never,
            { id: 2, name: '', musicProvider: 'qq' } as never,
            { id: 3, name: '海阔天空', musicProvider: 'qq' } as never,
        ]);

        expect(songs.map(song => [song.name, song.musicProvider])).toEqual([
            ['晴天', 'netease'],
            ['海阔天空', 'qq'],
        ]);
    });

    it('plays the chart preview row at the matching track index', () => {
        const tracks = [
            { id: 11, name: '海阔天空' },
            { id: 22, name: '晴天' },
            { id: 33, name: '七里香' },
        ] as never;
        expect(resolveChartPreviewPlaySong(tracks, 1)?.id).toBe(22);
        expect(resolveChartPreviewPlaySong(tracks, 9)).toBeNull();
        expect(resolveChartPreviewPlaySong(tracks, -1)).toBeNull();
    });
});
