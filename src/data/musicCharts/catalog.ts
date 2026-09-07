import { NETEASE_HOT_CHART_PLAYLIST_ID } from '../../services/dailyChartPicks';

// src/data/musicCharts/catalog.ts
// Public NetEase official chart playlists used as Lyra's first-class charts surface.

export const OFFICIAL_CHART_IDS = ['soar', 'new', 'hot', 'original'] as const;

export type OfficialChartId = (typeof OFFICIAL_CHART_IDS)[number];

export type OfficialChartDefinition = {
    id: OfficialChartId;
    playlistId: number;
    titleKey: string;
    themeKey: string;
};

/** Official public chart IDs; hot chart matches daily recommend seeds. */
export const OFFICIAL_CHART_CATALOG: readonly OfficialChartDefinition[] = [
    { id: 'soar', playlistId: 19723756, titleKey: 'home.chartSoar', themeKey: 'home.chartThemeSoar' },
    { id: 'new', playlistId: 3779629, titleKey: 'home.chartNew', themeKey: 'home.chartThemeNew' },
    { id: 'hot', playlistId: NETEASE_HOT_CHART_PLAYLIST_ID, titleKey: 'home.chartHot', themeKey: 'home.chartThemeHot' },
    { id: 'original', playlistId: 2884035, titleKey: 'home.chartOriginal', themeKey: 'home.chartThemeOriginal' },
];

export const DEFAULT_OFFICIAL_CHART_ID: OfficialChartId = 'hot';
