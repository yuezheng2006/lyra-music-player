import { describe, expect, it } from 'vitest';
import { aggregateOnlinePlaylists } from '@/hooks/useAggregatedOnlinePlaylists';
import type { NeteasePlaylist } from '@/types';

const makePlaylist = (overrides: Partial<NeteasePlaylist> = {}): NeteasePlaylist => ({
    id: overrides.id ?? 1,
    name: overrides.name ?? 'Playlist',
    coverImgUrl: overrides.coverImgUrl ?? '',
    trackCount: overrides.trackCount ?? 0,
    playCount: overrides.playCount ?? 0,
    updateTime: overrides.updateTime ?? 0,
    trackUpdateTime: overrides.trackUpdateTime ?? 0,
    creator: overrides.creator ?? { userId: 0, nickname: 'u', avatarUrl: '' },
    specialType: overrides.specialType,
    musicProvider: overrides.musicProvider,
    providerPlaylistId: overrides.providerPlaylistId,
    description: overrides.description,
});

const allProviders = {
    netease: true,
    qq: true,
    qishui: true,
    coco: true,
};

describe('aggregateOnlinePlaylists', () => {
    it('merges netease and qq playlists with provider tags', () => {
        const neteasePlaylists = [makePlaylist({ id: 10, name: 'Netease A' })];
        const qqPlaylists = [makePlaylist({ id: 20, name: 'QQ A', providerPlaylistId: 'qq-20' })];

        const result = aggregateOnlinePlaylists({
            neteasePlaylists,
            qqPlaylists,
            enabledProviders: { ...allProviders, coco: false, qishui: false },
            moduleFilter: 'all',
        });

        expect(result).toHaveLength(2);
        expect(result.find(item => item.name === 'Netease A')?.musicProvider).toBe('netease');
        expect(result.find(item => item.name === 'QQ A')?.musicProvider).toBe('qq');
    });

    it('injects coco default playlist for the free peer provider', () => {
        const result = aggregateOnlinePlaylists({
            neteasePlaylists: [],
            qqPlaylists: [],
            enabledProviders: { ...allProviders, netease: false, qq: false, qishui: false },
            moduleFilter: 'all',
        });

        expect(result).toHaveLength(1);
        expect(result[0].musicProvider).toBe('coco');
        expect(result[0].specialType).toBe('provider-default');
    });

    it('injects qishui default playlist when enabled', () => {
        const result = aggregateOnlinePlaylists({
            neteasePlaylists: [],
            qqPlaylists: [],
            enabledProviders: { ...allProviders, netease: false, qq: false, coco: false },
            moduleFilter: 'all',
        });

        expect(result).toHaveLength(1);
        expect(result[0].musicProvider).toBe('qishui');
        expect(result[0].specialType).toBe('provider-default');
    });

    it('excludes coco default from liked and created module filters', () => {
        const liked = aggregateOnlinePlaylists({
            neteasePlaylists: [],
            qqPlaylists: [],
            enabledProviders: { ...allProviders, netease: false, qq: false, qishui: false },
            moduleFilter: 'liked',
        });
        const created = aggregateOnlinePlaylists({
            neteasePlaylists: [],
            qqPlaylists: [],
            enabledProviders: { ...allProviders, netease: false, qq: false, qishui: false },
            moduleFilter: 'created',
        });

        expect(liked).toEqual([]);
        expect(created).toEqual([]);
    });

    it('filters playlists by enabled providers and liked module', () => {
        const neteasePlaylists = [
            makePlaylist({ id: 1, name: '我喜欢的音乐' }),
            makePlaylist({ id: 2, name: '通勤歌单' }),
        ];
        const qqPlaylists = [makePlaylist({ id: 3, name: 'QQ 收藏', providerPlaylistId: 'qq-3' })];

        const result = aggregateOnlinePlaylists({
            neteasePlaylists,
            qqPlaylists,
            enabledProviders: { ...allProviders, qq: false, coco: false, qishui: false },
            moduleFilter: 'liked',
        });

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('我喜欢的音乐');
    });

    it('keeps cloud playlist at the front for netease after defaults', () => {
        const cloudPlaylist = makePlaylist({ id: 99, name: '云盘', specialType: 'cloud' });
        const neteasePlaylists = [makePlaylist({ id: 1, name: '自建歌单' })];

        const result = aggregateOnlinePlaylists({
            neteasePlaylists,
            qqPlaylists: [],
            cloudPlaylist,
            enabledProviders: { ...allProviders, qq: false, coco: false, qishui: false },
            moduleFilter: 'all',
        });

        expect(result[0].name).toBe('云盘');
    });
});
