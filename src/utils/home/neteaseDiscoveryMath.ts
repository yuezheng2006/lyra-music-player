import type { NeteasePlaylist, NeteaseUser } from '../../types';

// src/utils/home/neteaseDiscoveryMath.ts
// Pure helpers for NetEase home discovery: radar titles and liked-playlist pick.

export const splitRadarPlaylistName = (rawName: string | null | undefined) => {
    const name = (rawName ?? '').trim();
    if (!name) return { title: '', subtitle: null as string | null };
    const parts = name.split('|').map(part => part.trim()).filter(Boolean);
    if (parts.length < 2) return { title: name, subtitle: null };
    return {
        title: parts[parts.length - 1] ?? name,
        subtitle: parts.slice(0, -1).join('|') || null,
    };
};

export const resolveNeteaseLikedPlaylist = (
    playlists: readonly NeteasePlaylist[],
    user: Pick<NeteaseUser, 'userId'> | null | undefined,
): NeteasePlaylist | null => {
    const likedByName = playlists.find(playlist => (
        playlist.name === '我喜欢的音乐'
        || playlist.name.toLowerCase() === 'liked songs'
    ));
    if (likedByName) return likedByName;
    if (!user?.userId) return playlists[0] ?? null;
    return playlists.find(playlist => (
        playlist.specialType !== 'cloud'
        && playlist.specialType !== 'provider-default'
        && Number(playlist.creator?.userId) === Number(user.userId)
    )) ?? null;
};

export const pickHeartbeatSeedId = (likedIds: readonly number[], random = Math.random) => {
    if (likedIds.length === 0) return null;
    const index = Math.min(likedIds.length - 1, Math.floor(random() * likedIds.length));
    return likedIds[index] ?? null;
};
