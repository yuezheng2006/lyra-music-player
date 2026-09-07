import { create } from 'zustand';
import {
    DEFAULT_OFFICIAL_CHART_ID,
    OFFICIAL_CHART_CATALOG,
    type OfficialChartId,
} from '../data/musicCharts/catalog';
import {
    fetchOfficialChartSummaries,
    fetchOfficialChartTracks,
} from '../services/officialChartService';
import type { SongResult } from '../types';
import { resolveOfficialChartId, type OfficialChartSummary } from '../utils/charts/officialChartMath';

// src/stores/useOfficialChartStore.ts
// Cached official chart summaries and selected chart tracks.

const CACHE_TTL_MS = 30 * 60 * 1000;

type OfficialChartState = {
    summaries: OfficialChartSummary[];
    selectedChartId: OfficialChartId;
    tracksByChartId: Partial<Record<OfficialChartId, SongResult[]>>;
    summariesLoading: boolean;
    summariesSettled: boolean;
    summariesError: string | null;
    tracksLoading: boolean;
    tracksError: string | null;
    fetchedAt: number;
    inflightSummaries: Promise<void> | null;
    inflightTracks: Partial<Record<OfficialChartId, Promise<void>>>;
    selectChart: (id: OfficialChartId) => void;
    ensureSummariesLoaded: (options?: { force?: boolean }) => Promise<void>;
    ensureChartTracksLoaded: (id?: OfficialChartId, options?: { force?: boolean }) => Promise<void>;
};

export const useOfficialChartStore = create<OfficialChartState>((set, get) => ({
    summaries: OFFICIAL_CHART_CATALOG.map(chart => ({
        id: chart.id,
        playlistId: chart.playlistId,
        name: '',
        coverUrl: '',
        trackCount: 0,
        previewTracks: [],
        playlist: null,
    })),
    selectedChartId: DEFAULT_OFFICIAL_CHART_ID,
    tracksByChartId: {},
    summariesLoading: false,
    summariesSettled: false,
    summariesError: null,
    tracksLoading: false,
    tracksError: null,
    fetchedAt: 0,
    inflightSummaries: null,
    inflightTracks: {},
    selectChart: (id) => {
        set({ selectedChartId: resolveOfficialChartId(id) });
    },
    ensureSummariesLoaded: async (options) => {
        const state = get();
        const fresh = Date.now() - state.fetchedAt < CACHE_TTL_MS
            && state.summariesSettled
            && state.summaries.some(summary => summary.coverUrl || summary.previewTracks.length > 0);
        if (!options?.force && fresh) return;
        if (state.inflightSummaries) {
            await state.inflightSummaries;
            return;
        }

        const request = (async () => {
            set({ summariesLoading: true, summariesError: null });
            try {
                const summaries = await fetchOfficialChartSummaries();
                set({
                    summaries,
                    summariesLoading: false,
                    summariesSettled: true,
                    summariesError: summaries.every(summary => !summary.coverUrl && summary.previewTracks.length === 0)
                        ? 'empty'
                        : null,
                    fetchedAt: Date.now(),
                    inflightSummaries: null,
                });
            } catch (error) {
                set({
                    summariesLoading: false,
                    summariesSettled: true,
                    summariesError: error instanceof Error ? error.message : 'failed',
                    inflightSummaries: null,
                });
            }
        })();

        set({ inflightSummaries: request });
        await request;
    },
    ensureChartTracksLoaded: async (id, options) => {
        const chartId = resolveOfficialChartId(id ?? get().selectedChartId);
        const state = get();
        if (!options?.force && (state.tracksByChartId[chartId]?.length || 0) > 0) {
            set({ selectedChartId: chartId });
            return;
        }
        const existing = state.inflightTracks[chartId];
        if (existing) {
            set({ selectedChartId: chartId });
            await existing;
            return;
        }

        const request = (async () => {
            set({ selectedChartId: chartId, tracksLoading: true, tracksError: null });
            try {
                const tracks = await fetchOfficialChartTracks(chartId);
                set(current => ({
                    tracksByChartId: { ...current.tracksByChartId, [chartId]: tracks },
                    tracksLoading: false,
                    tracksError: tracks.length === 0 ? 'empty' : null,
                    inflightTracks: { ...current.inflightTracks, [chartId]: undefined },
                }));
            } catch (error) {
                set(current => ({
                    tracksLoading: false,
                    tracksError: error instanceof Error ? error.message : 'failed',
                    inflightTracks: { ...current.inflightTracks, [chartId]: undefined },
                }));
            }
        })();

        set(current => ({
            selectedChartId: chartId,
            inflightTracks: { ...current.inflightTracks, [chartId]: request },
        }));
        await request;
    },
}));
