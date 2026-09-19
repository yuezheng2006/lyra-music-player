import { OFFICIAL_CHART_CATALOG, type OfficialChartId } from '../data/musicCharts/catalog';
import { neteaseApi } from './netease';
import {
    markNeteaseChartSongs,
    mapPlaylistDetailToSummary,
    type OfficialChartSummary,
} from '../utils/charts/officialChartMath';
import type { SongResult } from '../types';

// src/services/officialChartService.ts
// Load official NetEase chart summaries and track lists.

export const fetchOfficialChartSummary = async (id: OfficialChartId): Promise<OfficialChartSummary> => {
    const definition = OFFICIAL_CHART_CATALOG.find(chart => chart.id === id);
    if (!definition) {
        return mapPlaylistDetailToSummary(id, null);
    }
    try {
        const detail = await neteaseApi.getPlaylistDetail(definition.playlistId);
        return mapPlaylistDetailToSummary(id, detail);
    } catch (error) {
        console.warn(`[officialChart] summary failed for ${id}`, error);
        return mapPlaylistDetailToSummary(id, null);
    }
};

export const fetchOfficialChartSummaries = async (): Promise<OfficialChartSummary[]> => {
    const results = await Promise.all(OFFICIAL_CHART_CATALOG.map(chart => fetchOfficialChartSummary(chart.id)));
    return results;
};

export const fetchOfficialChartTracks = async (id: OfficialChartId): Promise<SongResult[]> => {
    const definition = OFFICIAL_CHART_CATALOG.find(chart => chart.id === id);
    if (!definition) return [];
    try {
        const res = await neteaseApi.getPlaylistTracks(definition.playlistId, 80, 0);
        const songs = markNeteaseChartSongs(res?.songs);
        if (songs.length > 0) return songs;
    } catch (error) {
        console.warn(`[officialChart] tracks failed for ${id}, falling back to playlist detail`, error);
    }
    const detail = await neteaseApi.getPlaylistDetail(definition.playlistId);
    return markNeteaseChartSongs(detail?.playlist?.tracks);
};
