import type { NeteasePlaylist, SongResult } from '../../types';
import {
    DEFAULT_OFFICIAL_CHART_ID,
    OFFICIAL_CHART_CATALOG,
    type OfficialChartId,
} from '../../data/musicCharts/catalog';

// src/utils/charts/officialChartMath.ts
// Normalize official chart playlist payloads into summaries and playable songs.

export type OfficialChartPreviewTrack = {
    name: string;
    artist: string;
};

export type OfficialChartSummary = {
    id: OfficialChartId;
    playlistId: number;
    name: string;
    coverUrl: string;
    trackCount: number;
    previewTracks: OfficialChartPreviewTrack[];
    playlist: NeteasePlaylist | null;
};

type PlaylistTrackLike = {
    name?: string;
    ar?: Array<{ name?: string }>;
    artists?: Array<{ name?: string }>;
};

type PlaylistDetailLike = {
    playlist?: {
        id?: number;
        name?: string;
        coverImgUrl?: string;
        trackCount?: number;
        playCount?: number;
        updateTime?: number;
        trackUpdateTime?: number;
        description?: string;
        creator?: NeteasePlaylist['creator'];
        tracks?: PlaylistTrackLike[];
    };
};

const resolveArtistLabel = (track: PlaylistTrackLike): string => {
    const names = (track.ar || track.artists || [])
        .map(artist => artist?.name)
        .filter((name): name is string => Boolean(name));
    return names.join(' / ');
};

export const isOfficialChartId = (value: string | null | undefined): value is OfficialChartId =>
    OFFICIAL_CHART_CATALOG.some(chart => chart.id === value);

export const resolveOfficialChartId = (value: string | null | undefined): OfficialChartId =>
    isOfficialChartId(value) ? value : DEFAULT_OFFICIAL_CHART_ID;

export const getOfficialChartDefinition = (id: OfficialChartId) =>
    OFFICIAL_CHART_CATALOG.find(chart => chart.id === id) ?? OFFICIAL_CHART_CATALOG[2];

export const mapPlaylistDetailToSummary = (
    id: OfficialChartId,
    detail: PlaylistDetailLike | null | undefined,
): OfficialChartSummary => {
    const definition = getOfficialChartDefinition(id);
    const playlist = detail?.playlist;
    const tracks = Array.isArray(playlist?.tracks) ? playlist.tracks : [];
    const previewTracks = tracks.slice(0, 3).map(track => ({
        name: String(track?.name || '').trim(),
        artist: resolveArtistLabel(track),
    })).filter(track => track.name);

    const playlistId = Number(playlist?.id) || definition.playlistId;
    const coverUrl = String(playlist?.coverImgUrl || '').trim();
    const name = String(playlist?.name || '').trim();
    const creator = playlist?.creator;

    return {
        id,
        playlistId,
        name,
        coverUrl,
        trackCount: Number(playlist?.trackCount) || tracks.length,
        previewTracks,
        playlist: playlist && name
            ? {
                id: playlistId,
                name,
                coverImgUrl: coverUrl,
                trackCount: Number(playlist.trackCount) || tracks.length,
                playCount: Number(playlist.playCount) || 0,
                updateTime: Number(playlist.updateTime) || 0,
                trackUpdateTime: Number(playlist.trackUpdateTime) || 0,
                creator: creator || {
                    userId: 0,
                    nickname: 'NetEase',
                    avatarUrl: '',
                },
                description: playlist.description,
                musicProvider: 'netease',
            }
            : null,
    };
};

export const markNeteaseChartSongs = (songs: SongResult[] | null | undefined): SongResult[] => {
    if (!Array.isArray(songs)) return [];
    return songs
        .filter(song => song && String(song.name || '').trim())
        .map(song => ({
            ...song,
            musicProvider: song.musicProvider || 'netease',
        }));
};

export const resolveChartPreviewPlaySong = (
    tracks: readonly SongResult[],
    previewIndex: number,
): SongResult | null => {
    if (!Number.isInteger(previewIndex) || previewIndex < 0) return null;
    return tracks[previewIndex] ?? null;
};
