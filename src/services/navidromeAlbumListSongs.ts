import type { NavidromeConfig, SubsonicSong } from '../types/navidrome';
import { navidromeApi } from './navidromeService';

// src/services/navidromeAlbumListSongs.ts
// Flattens Subsonic album lists (newest / recent) into playable tracks.

const DEFAULT_ALBUM_LIMIT = 16;

export const loadNavidromeAlbumListSongs = async (
    config: NavidromeConfig,
    type: 'newest' | 'recent',
    albumLimit = DEFAULT_ALBUM_LIMIT,
): Promise<SubsonicSong[]> => {
    const albums = await navidromeApi.getAlbumList2(config, type, albumLimit);
    if (albums.length === 0) {
        return [];
    }

    const albumDetails = await Promise.all(albums.map(album => navidromeApi.getAlbum(config, album.id)));
    return albumDetails.flatMap(album => album?.song || []);
};
