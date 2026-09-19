import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { NeteaseUser, SongResult } from '../../../types';
import HomeSearchCard from './HomeSearchCard';
import { OFFICIAL_CHART_CATALOG, type OfficialChartId } from '../../../data/musicCharts/catalog';
import { useOfficialChartStore } from '../../../stores/useOfficialChartStore';
import { getOfficialChartDefinition } from '../../../utils/charts/officialChartMath';
import LazyCoverImage from '../../shared/LazyCoverImage';
import RemoteLoadState from '../../shared/RemoteLoadState';
import { resolveRemoteLoadStatus } from '../../../utils/ui/remoteLoadStatus';
import { resolveBrowseListRowClass, resolveHomeContentBottomPaddingClass } from './homeSurfaceStyles';
import { hasPersonalLibraryAccess } from '../../../utils/onlineLibraryAccess';
import { hasStoredNeteaseCookie } from '../../../utils/neteaseGuestMode';
import LibraryInviteRow from './LibraryInviteRow';

// src/components/app/home/ChartsSurface.tsx
// Search-first landing: chrome + hot tags + charts. Not a cover field.

type ChartsSurfaceProps = {
    isDaylight: boolean;
    user?: NeteaseUser | null;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
    onCommitSearch?: (query: string, allowEmptyChannel?: boolean) => void;
    onRefreshUser?: () => void;
};

const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) return '';
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const ChartsSurface: React.FC<ChartsSurfaceProps> = ({
    isDaylight,
    user = null,
    onPlaySong,
    onCommitSearch,
    onRefreshUser,
}) => {
    const { t } = useTranslation();
    const {
        summaries,
        selectedChartId,
        tracksByChartId,
        tracksLoading,
        tracksError,
        ensureSummariesLoaded,
        ensureChartTracksLoaded,
        selectChart,
    } = useOfficialChartStore(useShallow(state => ({
        summaries: state.summaries,
        selectedChartId: state.selectedChartId,
        tracksByChartId: state.tracksByChartId,
        tracksLoading: state.tracksLoading,
        tracksError: state.tracksError,
        ensureSummariesLoaded: state.ensureSummariesLoaded,
        ensureChartTracksLoaded: state.ensureChartTracksLoaded,
        selectChart: state.selectChart,
    })));

    useEffect(() => {
        void ensureSummariesLoaded();
        void ensureChartTracksLoaded();
    }, [ensureSummariesLoaded, ensureChartTracksLoaded]);

    const songs = tracksByChartId[selectedChartId] || [];
    const summary = summaries.find(item => item.id === selectedChartId);
    const definition = getOfficialChartDefinition(selectedChartId);
    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const rowClass = resolveBrowseListRowClass(isDaylight);
    const chipIdle = isDaylight
        ? 'bg-black/[0.04] text-black/60 hover:bg-black/[0.08]'
        : 'bg-white/[0.08] text-white/75 hover:bg-white/14';
    const chipActive = isDaylight
        ? 'bg-white text-black shadow-sm ring-1 ring-black/10'
        : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/30';

    const loadStatus = useMemo(() => {
        if (tracksLoading && songs.length === 0) return 'loading' as const;
        return resolveRemoteLoadStatus({
            loading: tracksLoading,
            settled: !tracksLoading,
            itemCount: songs.length,
            error: tracksError,
            needsAuth: false,
        });
    }, [songs.length, tracksError, tracksLoading]);

    const canPlayOfficialCharts = hasStoredNeteaseCookie();

    const openChart = (id: OfficialChartId) => {
        selectChart(id);
        void ensureChartTracksLoaded(id);
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col px-4 md:px-8">
            {onCommitSearch ? (
                <div className="mb-3 shrink-0">
                    <HomeSearchCard
                        isDaylight={isDaylight}
                        user={user}
                        onCommitSearch={onCommitSearch}
                    />
                </div>
            ) : null}
            {onRefreshUser && !hasPersonalLibraryAccess() ? (
                <div className="mb-3 shrink-0">
                    <LibraryInviteRow onRefreshUser={onRefreshUser} />
                </div>
            ) : null}
            <div className="mb-2.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-lg font-semibold tracking-tight">{t('home.chartTitle')}</div>
                    <div className={`mt-1 text-xs ${muted}`}>
                        {t(definition.themeKey)} · {summary?.name || t(definition.titleKey)}
                    </div>
                </div>
                <button
                    type="button"
                    disabled={songs.length === 0 || !canPlayOfficialCharts}
                    onClick={() => songs[0] && onPlaySong(songs[0], songs)}
                    title={!canPlayOfficialCharts ? t('status.loginRequiredToPlay') : undefined}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                        isDaylight ? 'bg-black/10 text-black hover:bg-black/15' : 'bg-white/12 text-white hover:bg-white/18'
                    }`}
                >
                    <Play size={12} fill="currentColor" />
                    {t('home.playAll')}
                </button>
            </div>

            <div className="mb-2.5 flex flex-wrap gap-1.5">
                {OFFICIAL_CHART_CATALOG.map(chart => (
                    <button
                        key={chart.id}
                        type="button"
                        onClick={() => openChart(chart.id)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            selectedChartId === chart.id ? chipActive : chipIdle
                        }`}
                    >
                        {t(chart.titleKey)}
                    </button>
                ))}
            </div>

            {loadStatus !== 'ready' ? (
                <RemoteLoadState
                    status={loadStatus}
                    isDaylight={isDaylight}
                    loadingLabel={t('home.chartLoading')}
                    emptyLabel={t('home.chartEmpty')}
                    errorLabel={tracksError && tracksError !== 'empty' ? tracksError : t('home.chartLoadFailed')}
                    onRetry={() => void ensureChartTracksLoaded(selectedChartId, { force: true })}
                />
            ) : (
                <div className={`min-h-0 flex-1 overflow-y-auto ${resolveHomeContentBottomPaddingClass(true)}`}>
                    <ul className="space-y-0.5">
                        {songs.map((song, index) => {
                            const artist = (song.artists || song.ar || []).map(item => item.name).filter(Boolean).join(' / ') || '—';
                            const album = song.album?.name || song.al?.name || '';
                            const duration = formatDuration(song.duration || song.dt);
                            return (
                                <li key={`${song.id}-${index}`}>
                                    <button
                                        type="button"
                                        onClick={() => onPlaySong(song, songs)}
                                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left ${rowClass}`}
                                    >
                                        <span className={`w-5 shrink-0 text-center text-[11px] tabular-nums ${muted}`}>
                                            {index + 1}
                                        </span>
                                        <LazyCoverImage
                                            src={song.album?.picUrl || song.al?.picUrl}
                                            placeholderLabel={song.name}
                                            placeholderArtist={artist}
                                            sizePx={88}
                                            className={`h-11 w-11 shrink-0 rounded-lg object-cover ${isDaylight ? 'bg-black/5' : 'bg-white/8'}`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">{song.name}</div>
                                            <div className={`mt-0.5 truncate text-[11px] ${muted}`}>
                                                {artist}
                                                {album ? ` · ${album}` : ''}
                                            </div>
                                        </div>
                                        {duration ? (
                                            <span className={`hidden shrink-0 text-[11px] tabular-nums sm:inline ${muted}`}>
                                                {duration}
                                            </span>
                                        ) : null}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ChartsSurface;
