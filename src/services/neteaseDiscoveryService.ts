import type { NeteaseUser, SongResult } from '../types';
import { NETEASE_RADAR_PLAYLISTS, type NeteaseRadarPlaylistId } from '../data/neteaseDiscovery/radarPlaylists';
import { pickHeartbeatSeedId, splitRadarPlaylistName } from '../utils/home/neteaseDiscoveryMath';
import { neteaseApi } from './netease';

// src/services/neteaseDiscoveryService.ts
// Sidecar-backed helpers for Personal FM, heartbeat mode, and radar playlists.

export type NeteaseRadarShelfItem = {
    id: NeteaseRadarPlaylistId;
    title: string;
    subtitle: string | null;
    coverUrl: string;
    fallbackTitleKey: string;
};

const asSongList = (value: unknown): SongResult[] => (
    Array.isArray(value) ? value.filter(Boolean) as SongResult[] : []
);

export const extractIntelligenceSongs = (payload: unknown): SongResult[] => {
    const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    const rows = asSongList(body.data);
    if (rows.length === 0) return asSongList(body.songs);
    return rows.map(row => {
        const nested = (row as SongResult & { songInfo?: SongResult }).songInfo;
        return nested ?? row;
    });
};

export const fetchPersonalFmSongs = async (): Promise<SongResult[]> => {
    const res = await neteaseApi.getPersonalFm();
    return asSongList(res?.data);
};

export const fetchHeartbeatSongs = async (input: {
    user: Pick<NeteaseUser, 'userId'>;
    likedPlaylistId: number;
    seedSongId?: number | null;
}): Promise<SongResult[]> => {
    const liked = await neteaseApi.getLikedSongs(input.user.userId);
    const likedIds = Array.isArray(liked?.ids)
        ? (liked.ids as number[]).map(Number).filter(Number.isFinite)
        : asSongList(liked?.data).map(song => Number(song.id)).filter(Number.isFinite);
    const seed = input.seedSongId && likedIds.includes(input.seedSongId)
        ? input.seedSongId
        : pickHeartbeatSeedId(likedIds);
    if (!seed) {
        const fallback = await neteaseApi.getPlaylistTracks(input.likedPlaylistId, 80, 0);
        return asSongList(fallback?.songs);
    }
    try {
        const intelligence = await neteaseApi.getPlaymodeIntelligenceList(seed, input.likedPlaylistId);
        const songs = extractIntelligenceSongs(intelligence);
        if (songs.length > 0) return songs;
    } catch {
        // Sidecar may not expose intelligence; fall through to liked playlist.
    }
    const fallback = await neteaseApi.getPlaylistTracks(input.likedPlaylistId, 80, 0);
    return asSongList(fallback?.songs);
};

export const fetchRadarShelfItems = async (): Promise<NeteaseRadarShelfItem[]> => {
    const items = await Promise.all(NETEASE_RADAR_PLAYLISTS.map(async definition => {
        try {
            const res = await neteaseApi.getPlaylistDetail(definition.id);
            const playlist = res?.playlist;
            if (!playlist) return null;
            const split = splitRadarPlaylistName(playlist.name);
            return {
                id: definition.id,
                title: split.title || playlist.name,
                subtitle: split.subtitle,
                coverUrl: playlist.coverImgUrl || '',
                fallbackTitleKey: definition.fallbackTitleKey,
            } satisfies NeteaseRadarShelfItem;
        } catch {
            return null;
        }
    }));
    return items.filter((item): item is NeteaseRadarShelfItem => Boolean(item));
};

export const fetchRadarPlaylistSongs = async (playlistId: number): Promise<SongResult[]> => {
    const detail = await neteaseApi.getPlaylistDetail(playlistId);
    const tracks = asSongList(detail?.playlist?.tracks);
    if (tracks.length > 0) return tracks;
    const page = await neteaseApi.getPlaylistTracks(playlistId, 80, 0);
    return asSongList(page?.songs);
};
