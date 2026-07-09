import type React from 'react';
import { LocalLibraryGroup, LocalSong, NeteasePlaylist, SongResult } from '../../../types';
import { navidromeApi, getNavidromeConfig } from '../../../services/navidromeService';
import { fetchQQPlaylistTracks } from '../../../services/musicProviders/qqMusicLibrary';
import { buildLocalQueue, buildNavidromeQueue } from '../../../services/playbackAdapters';
import { SubsonicSong } from '../../../types/navidrome';
import { isBlob } from '../../../utils/blobGuards';

// src/components/app/home/gridViewCollectionAdapters.ts
// Converts home-surface collections into small GridView descriptors and resolves non-Netease tracks outside GridView.

export type GridViewCollectionSource = 'netease' | 'qq' | 'local' | 'navidrome';
export type NavidromeGridViewCollectionType = 'album' | 'playlist' | 'artist' | 'random' | 'favorites';

export interface BaseGridViewCollectionDescriptor {
    source: GridViewCollectionSource;
    id: string | number;
    name: string;
    type: string;
    coverUrl?: string;
    coverImgUrl?: string;
    picUrl?: string;
    description?: string;
    trackCount?: number;
    albumArtist?: string;
    albumYear?: number;
    albumGenre?: string;
    albumDuration?: number;
    albumCompany?: string;
    albumPublishTime?: number;
    returnToPlayerOnClose?: boolean;
    musicProvider?: 'netease' | 'qq' | 'qishui' | 'coco';
    providerPlaylistId?: string;
}

export interface LocalGridViewCollectionDescriptor extends BaseGridViewCollectionDescriptor {
    source: 'local';
    type: LocalLibraryGroup['type'];
    id: string;
    songIds: string[];
    playlistId?: string;
    isVirtual?: boolean;
}

export interface NavidromeGridViewCollectionDescriptor extends BaseGridViewCollectionDescriptor {
    source: 'navidrome';
    type: NavidromeGridViewCollectionType;
    id: string;
    editable?: boolean;
}

export interface QQGridViewCollectionDescriptor extends BaseGridViewCollectionDescriptor {
    source: 'qq';
    type: 'playlist';
    providerPlaylistId: string;
    musicProvider: 'qq';
    raw?: NeteasePlaylist;
}

export type GridViewCollectionDescriptor =
    | (BaseGridViewCollectionDescriptor & { source: 'netease'; raw?: any; })
    | QQGridViewCollectionDescriptor
    | LocalGridViewCollectionDescriptor
    | NavidromeGridViewCollectionDescriptor;

const getDisplayName = (name: React.ReactNode) => (
    typeof name === 'string' || typeof name === 'number'
        ? String(name)
        : ''
);

export const createNeteaseGridViewCollection = (collection: any): GridViewCollectionDescriptor => ({
    ...collection,
    source: 'netease',
    musicProvider: 'netease',
    albumArtist: collection.type === 'album'
        ? collection.raw?.artists?.map((artist: { name?: string }) => artist.name).filter(Boolean).join(' / ') || collection.description
        : collection.albumArtist,
    albumPublishTime: collection.type === 'album' ? collection.raw?.publishTime : collection.albumPublishTime,
    albumCompany: collection.type === 'album' ? collection.raw?.company : collection.albumCompany,
});

export const createQQGridViewCollection = (playlist: NeteasePlaylist): QQGridViewCollectionDescriptor => {
    const providerPlaylistId = String(playlist.providerPlaylistId || '').trim();
    if (!providerPlaylistId) {
        throw new Error('QQ playlist is missing providerPlaylistId');
    }

    return {
        source: 'qq',
        id: playlist.id,
        name: playlist.name,
        type: 'playlist',
        coverUrl: playlist.coverImgUrl,
        coverImgUrl: playlist.coverImgUrl,
        description: playlist.creator?.nickname || 'QQ 音乐',
        trackCount: playlist.trackCount,
        musicProvider: 'qq',
        providerPlaylistId,
        raw: playlist,
    };
};

export const createOnlinePlaylistGridViewCollection = (playlist: NeteasePlaylist): GridViewCollectionDescriptor => {
    if (playlist.musicProvider === 'qq') {
        return createQQGridViewCollection(playlist);
    }
    return createNeteaseGridViewCollection({
        ...playlist,
        type: 'playlist',
        coverUrl: playlist.coverImgUrl,
        description: playlist.creator?.nickname || '歌单',
        raw: playlist,
    });
};

export const createLocalGridViewCollection = (group: LocalLibraryGroup): LocalGridViewCollectionDescriptor => ({
    source: 'local',
    id: group.id,
    name: group.name,
    type: group.type,
    coverUrl: typeof group.coverUrl === 'string' ? group.coverUrl : undefined,
    description: group.description,
    trackCount: group.trackCount ?? group.songs.length,
    songIds: group.songs.map(song => song.id),
    playlistId: group.playlistId,
    isVirtual: group.isVirtual,
});

export const createNavidromeGridViewCollection = (
    item: {
        id: string | number;
        name: React.ReactNode;
        coverUrl?: string;
        description?: string;
        trackCount?: number;
        albumArtist?: string;
        albumYear?: number;
        albumGenre?: string;
        albumDuration?: number;
    },
    type: NavidromeGridViewCollectionType
): NavidromeGridViewCollectionDescriptor => ({
    source: 'navidrome',
    id: String(item.id),
    name: getDisplayName(item.name),
    type,
    coverUrl: item.coverUrl,
    description: item.description,
    trackCount: item.trackCount,
    albumArtist: item.albumArtist,
    albumYear: item.albumYear,
    albumGenre: item.albumGenre,
    albumDuration: item.albumDuration,
    editable: Boolean((item as { editable?: boolean }).editable),
});

export const refreshLocalGridViewCollection = (
    descriptor: LocalGridViewCollectionDescriptor,
    localSongs: LocalSong[]
): LocalGridViewCollectionDescriptor => {
    if (descriptor.playlistId || descriptor.type !== 'folder') {
        return descriptor;
    }

    const refreshedSongs = descriptor.isVirtual
        ? localSongs
        : localSongs.filter(song => song.folderName === descriptor.name);

    return {
        ...descriptor,
        songIds: refreshedSongs.map(song => song.id),
        trackCount: refreshedSongs.length,
    };
};

// Rebuilds a local GridView queue from descriptor ids while preserving descriptor order.
export const resolveLocalGridViewTracks = (
    descriptor: LocalGridViewCollectionDescriptor,
    localSongs: LocalSong[]
): SongResult[] => {
    const songsById = new Map(localSongs.map(song => [song.id, song]));
    const orderedSongs = descriptor.songIds
        .map(songId => songsById.get(songId))
        .filter((song): song is LocalSong => Boolean(song));

    return buildLocalQueue(orderedSongs) as SongResult[];
};

const getLocalGridViewCoverSource = (songs: LocalSong[]): Blob | string | undefined => {
    const sortedSongs = [...songs].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    const preferredSong = sortedSongs.find(song => {
        const hasEmbeddedCover = isBlob(song.embeddedCover);
        if (song.useOnlineCover) {
            return song.matchedCoverUrl || hasEmbeddedCover;
        }
        return hasEmbeddedCover || song.matchedCoverUrl;
    });

    if (!preferredSong) {
        return undefined;
    }

    const embeddedCover = isBlob(preferredSong.embeddedCover) ? preferredSong.embeddedCover : undefined;
    if (preferredSong.useOnlineCover) {
        return preferredSong.matchedCoverUrl || embeddedCover;
    }

    return embeddedCover || preferredSong.matchedCoverUrl;
};

export const resolveLocalGridViewCoverSource = (
    descriptor: LocalGridViewCollectionDescriptor,
    localSongs: LocalSong[]
): Blob | string | undefined => {
    const songsById = new Map(localSongs.map(song => [song.id, song]));
    const orderedSongs = descriptor.songIds
        .map(songId => songsById.get(songId))
        .filter((song): song is LocalSong => Boolean(song));

    return getLocalGridViewCoverSource(orderedSongs);
};

// Loads Navidrome tracks for GridView without moving Navidrome service logic into GridView itself.
export const resolveNavidromeGridViewTracks = async (
    descriptor: NavidromeGridViewCollectionDescriptor
): Promise<SongResult[]> => {
    const config = getNavidromeConfig();
    if (!config) {
        return [];
    }

    let subsonicSongs: SubsonicSong[] = [];

    if (descriptor.type === 'album') {
        const albumDetail = await navidromeApi.getAlbum(config, descriptor.id);
        subsonicSongs = albumDetail?.song || [];
    } else if (descriptor.type === 'playlist') {
        const playlistDetail = await navidromeApi.getPlaylist(config, descriptor.id);
        subsonicSongs = playlistDetail?.entry || [];
    } else if (descriptor.type === 'artist') {
        const artistDetail = await navidromeApi.getArtist(config, descriptor.id);
        const albums = artistDetail?.album || [];
        const albumResults = await Promise.all(albums.map(album => navidromeApi.getAlbum(config, album.id)));
        subsonicSongs = albumResults.flatMap(album => album?.song || []);
    } else if (descriptor.type === 'random') {
        subsonicSongs = await navidromeApi.getRandomSongs(config, 100);
    } else if (descriptor.type === 'favorites') {
        subsonicSongs = await navidromeApi.getStarred2(config);
    }

    const navidromeSongs = subsonicSongs.map(song => navidromeApi.toNavidromeSong(config, song));
    return buildNavidromeQueue(navidromeSongs);
};

export const resolveQQGridViewTracks = async (
    descriptor: QQGridViewCollectionDescriptor
): Promise<SongResult[]> => fetchQQPlaylistTracks(descriptor.providerPlaylistId);

export const isLocalGridViewCollection = (
    collection: GridViewCollectionDescriptor
): collection is LocalGridViewCollectionDescriptor => collection.source === 'local';

export const isNavidromeGridViewCollection = (
    collection: GridViewCollectionDescriptor
): collection is NavidromeGridViewCollectionDescriptor => collection.source === 'navidrome';

export const isQQGridViewCollection = (
    collection: GridViewCollectionDescriptor
): collection is QQGridViewCollectionDescriptor => collection.source === 'qq';

export const isNeteaseGridViewCollection = (
    collection: GridViewCollectionDescriptor
) => collection.source === 'netease';
