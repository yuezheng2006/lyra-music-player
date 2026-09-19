import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { SongResult } from '../../../types';
import { useOfficialChartStore } from '../../../stores/useOfficialChartStore';
import { useSearchNavigationStore } from '../../../stores/useSearchNavigationStore';
import { OFFICIAL_CHART_CATALOG, type OfficialChartId } from '../../../data/musicCharts/catalog';
import {
    getOfficialChartDefinition,
    resolveChartPreviewPlaySong,
} from '../../../utils/charts/officialChartMath';
import HomeChartPreviewCard from './HomeChartPreviewCard';
import HomeShelfHeader from './HomeShelfHeader';

// src/components/app/home/HomeChartPreviewShelf.tsx
// Official chart Top 3 cards; a row plays, chrome opens the charts surface.

type HomeChartPreviewShelfProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
};

type PlayingRow = {
    chartId: OfficialChartId;
    index: number;
};

const HomeChartPreviewShelf: React.FC<HomeChartPreviewShelfProps> = ({
    isDaylight,
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const setHomeViewTab = useSearchNavigationStore(state => state.setHomeViewTab);
    const [playingRow, setPlayingRow] = useState<PlayingRow | null>(null);
    const {
        summaries,
        summariesLoading,
        ensureSummariesLoaded,
        ensureChartTracksLoaded,
        selectChart,
    } = useOfficialChartStore(useShallow(state => ({
        summaries: state.summaries,
        summariesLoading: state.summariesLoading,
        ensureSummariesLoaded: state.ensureSummariesLoaded,
        ensureChartTracksLoaded: state.ensureChartTracksLoaded,
        selectChart: state.selectChart,
    })));

    useEffect(() => {
        void ensureSummariesLoaded();
    }, [ensureSummariesLoaded]);

    const hasPreview = summaries.some(summary => summary.previewTracks.length > 0);
    if (!hasPreview && !summariesLoading) return null;

    const openChart = (id: OfficialChartId) => {
        selectChart(id);
        setHomeViewTab('charts');
    };

    const playPreviewRow = async (chartId: OfficialChartId, index: number) => {
        setPlayingRow({ chartId, index });
        try {
            await ensureChartTracksLoaded(chartId);
            const tracks = useOfficialChartStore.getState().tracksByChartId[chartId] ?? [];
            const song = resolveChartPreviewPlaySong(tracks, index);
            if (!song) {
                openChart(chartId);
                return;
            }
            void onPlaySong(song, [...tracks]);
        } finally {
            setPlayingRow(null);
        }
    };

    return (
        <section className="mt-3 shrink-0" data-app-ui-surface="home-chart-preview">
            <HomeShelfHeader
                title={t('home.chartPicksTitle')}
                subtitle={t('home.chartSubtitle')}
                isDaylight={isDaylight}
                onOpenAll={() => setHomeViewTab('charts')}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {OFFICIAL_CHART_CATALOG.map((chart) => {
                    const summary = summaries.find(item => item.id === chart.id);
                    const definition = getOfficialChartDefinition(chart.id);
                    return (
                        <HomeChartPreviewCard
                            key={chart.id}
                            isDaylight={isDaylight}
                            title={summary?.name || t(definition.titleKey)}
                            themeLabel={t(definition.themeKey)}
                            coverUrl={summary?.coverUrl}
                            tracks={summary?.previewTracks ?? []}
                            loading={summariesLoading}
                            playingIndex={playingRow?.chartId === chart.id ? playingRow.index : null}
                            onOpenChart={() => openChart(chart.id)}
                            onPlayRow={(index) => { void playPreviewRow(chart.id, index); }}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default HomeChartPreviewShelf;
