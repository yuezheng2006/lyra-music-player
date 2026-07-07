import type { BuildPlaylistShelfItemsInput, PlaylistShelfItem } from './shelfTypes';

// src/components/visualizer/geometric/shelf/buildPlaylistShelfItems.ts
// Maps current queue and playlist libraries into unified shelf card items.

const resolveSongCover = (song?: { al?: { picUrl?: string; }; album?: { picUrl?: string; }; }): string | null =>
    song?.al?.picUrl ?? song?.album?.picUrl ?? null;

/** 将播放队列与本地/网易云歌单整理为 3D 歌单架卡片数据源。 */
export const buildPlaylistShelfItems = ({
    playQueue = [],
    localPlaylists = [],
    neteasePlaylists = [],
}: BuildPlaylistShelfItemsInput): PlaylistShelfItem[] => {
    const items: PlaylistShelfItem[] = [];

    if (playQueue.length > 0) {
        items.push({
            id: 'queue:current',
            title: '当前队列',
            subtitle: `${playQueue.length} 首`,
            coverUrl: resolveSongCover(playQueue[0]),
            trackCount: playQueue.length,
            source: 'queue',
        });
    }

    for (const playlist of localPlaylists) {
        if (playlist.isFavorite) continue;
        items.push({
            id: `local:${playlist.id}`,
            title: playlist.name,
            subtitle: `${playlist.songIds.length} 首`,
            trackCount: playlist.songIds.length,
            source: 'local',
        });
    }

    for (const playlist of neteasePlaylists) {
        items.push({
            id: `netease:${playlist.id}`,
            title: playlist.name,
            subtitle: playlist.creator?.nickname ?? `${playlist.trackCount} 首`,
            coverUrl: playlist.coverImgUrl,
            trackCount: playlist.trackCount,
            source: 'netease',
        });
    }

    return items;
};

/** 生成歌单架内容签名，供 runtime 判断是否需要重建。 */
export const buildPlaylistShelfSignature = (items: PlaylistShelfItem[]): string =>
    items.map(item => `${item.id}:${item.trackCount ?? 0}:${item.title}`).join('|');
