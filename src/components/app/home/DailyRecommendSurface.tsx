import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Play } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { OnlineMusicProviderId, SongResult } from '../../../types';
import type { NeteaseUser } from '../../../types';
import {
    ONLINE_LIBRARY_PROVIDER_IDS,
    useOnlineLibraryFilterStore,
    type OnlineLibraryProviderId,
} from '../../../stores/useOnlineLibraryFilterStore';
import {
    serializeDailyRecommendProviderKey,
    useDailyRecommendStore,
} from '../../../stores/useDailyRecommendStore';
import { ProviderIconBadge } from './ProviderIconBadge';
import LazyCoverImage from '../../shared/LazyCoverImage';
import { resolveBrowseListRowClass, resolveHomeContentBottomPaddingClass } from './homeSurfaceStyles';

// src/components/app/home/DailyRecommendSurface.tsx
// Multi-source daily recommend — reads app-level preloaded cache.

type DailyRecommendSurfaceProps = {
    user: NeteaseUser | null;
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
    onRefreshUser?: () => void;
};

type SourceFilter = 'all' | OnlineLibraryProviderId;

const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) return '';
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const DailyRecommendSurface: React.FC<DailyRecommendSurfaceProps> = ({
    isDaylight,
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const playlistProviders = useOnlineLibraryFilterStore(state => state.playlistProviders);
    const providerKey = serializeDailyRecommendProviderKey(playlistProviders);
    const {
        sources,
        songs,
        loading,
        settled,
        error,
        ensureLoaded,
    } = useDailyRecommendStore(useShallow(state => ({
        sources: state.sources,
        songs: state.songs,
        loading: state.loading,
        settled: state.settled,
        error: state.error,
        ensureLoaded: state.ensureLoaded,
    })));
    const storeProviderKey = useDailyRecommendStore(state => state.providerKey);
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

    useEffect(() => {
        void ensureLoaded();
    }, [ensureLoaded, providerKey]);

    const availableFilters = useMemo(() => {
        const withSongs = sources.filter(s => s.songs.length > 0);
        return withSongs.map(s => s.provider as OnlineLibraryProviderId);
    }, [sources]);

    const attemptedProviders = useMemo(
        () => sources.map(s => s.provider as OnlineLibraryProviderId),
        [sources],
    );

    const filteredSongs = useMemo(() => {
        if (sourceFilter === 'all') return songs;
        return songs.filter(song => (song.musicProvider || 'netease') === sourceFilter);
    }, [songs, sourceFilter]);

    const sourceCounts = useMemo(() => {
        const counts: Partial<Record<OnlineMusicProviderId, number>> = {};
        for (const bucket of sources) {
            counts[bucket.provider] = bucket.songs.length;
        }
        return counts;
    }, [sources]);

    const failedSources = useMemo(
        () => sources.filter(s => s.songs.length === 0 && s.error && s.error !== 'need-login'),
        [sources],
    );

    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const rowClass = resolveBrowseListRowClass(isDaylight);
    const chipIdle = isDaylight
        ? 'bg-black/[0.04] text-black/60 hover:bg-black/[0.08]'
        : 'bg-white/[0.08] text-white/75 hover:bg-white/14';
    const chipActive = isDaylight
        ? 'bg-white text-black shadow-sm ring-1 ring-black/10'
        : 'bg-white text-zinc-950 shadow-sm ring-1 ring-white/30';

    const neteaseNeedLogin = sources.some(s => s.provider === 'netease' && s.error === 'need-login');
    const playQueue = filteredSongs.length > 0 ? filteredSongs : songs;
    const showSourceChips = attemptedProviders.length > 1 || availableFilters.length > 1;
    const cacheMatches = storeProviderKey === providerKey;
    const stillHydrating = (!cacheMatches || (loading && songs.length === 0));
    const isSyncing = cacheMatches && !settled && songs.length > 0;

    if (stillHydrating) {
        return (
            <div className={`flex h-full items-center justify-center gap-2 text-sm ${muted}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('home.dailyRecommendLoading')}
            </div>
        );
    }

    if (settled && songs.length === 0) {
        return (
            <div className={`flex h-full flex-col items-center justify-center gap-3 px-6 text-sm ${muted}`}>
                <div>
                    {neteaseNeedLogin && availableFilters.length === 0
                        ? t('home.dailyRecommendLoginRequired')
                        : (error || t('home.dailyRecommendEmpty'))}
                </div>
                <button
                    type="button"
                    onClick={() => void ensureLoaded({ force: true })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        isDaylight ? 'bg-black/10 text-black hover:bg-black/15' : 'bg-white/12 text-white hover:bg-white/18'
                    }`}
                >
                    {t('home.dailyRecommendRetry')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 w-full flex-col px-4 md:px-8">
            <div className="mb-2.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold tracking-tight">{t('home.dailyRecommendTitle')}</div>
                        {isSyncing ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] ${muted}`}>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {t('home.dailyRecommendSyncing')}
                            </span>
                        ) : null}
                    </div>
                    <div className={`mt-1 text-xs ${muted}`}>
                        {t('home.dailyRecommendSubtitleMulti', {
                            count: filteredSongs.length,
                            sources: availableFilters.length,
                        })}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => playQueue[0] && onPlaySong(playQueue[0], playQueue)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        isDaylight ? 'bg-black/10 text-black hover:bg-black/15' : 'bg-white/12 text-white hover:bg-white/18'
                    }`}
                >
                    <Play size={12} fill="currentColor" />
                    {t('home.playAll')}
                </button>
            </div>

            {showSourceChips ? (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setSourceFilter('all')}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            sourceFilter === 'all' ? chipActive : chipIdle
                        }`}
                    >
                        {t('home.moduleAll')} · {songs.length}
                    </button>
                    {ONLINE_LIBRARY_PROVIDER_IDS.filter(id => attemptedProviders.includes(id)).map(id => {
                        const count = sourceCounts[id] || 0;
                        const disabled = count === 0;
                        return (
                            <button
                                key={id}
                                type="button"
                                disabled={disabled}
                                onClick={() => setSourceFilter(id)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                                    sourceFilter === id ? chipActive : chipIdle
                                }`}
                            >
                                <ProviderIconBadge provider={id} size="sm" isDaylight={isDaylight} />
                                <span>{count}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}

            {neteaseNeedLogin ? (
                <div className={`mb-2 text-[11px] ${muted}`}>
                    {t('home.dailyRecommendNeteaseLoginHint')}
                </div>
            ) : null}

            {availableFilters.length > 0 && availableFilters.some(id => id !== 'netease') ? (
                <div className={`mb-2 text-[11px] ${muted}`}>
                    {t('home.dailyRecommendPicksHint')}
                </div>
            ) : null}

            {failedSources.length > 0 && availableFilters.length <= 1 ? (
                <div className={`mb-2 text-[11px] ${muted}`}>
                    {t('home.dailyRecommendPartialFail', {
                        providers: failedSources.map(s => s.provider).join(' / '),
                    })}
                </div>
            ) : null}

            <div className={`min-h-0 flex-1 overflow-y-auto ${resolveHomeContentBottomPaddingClass(true)}`}>
                <ul className="space-y-0.5">
                    {filteredSongs.map((song, index) => {
                        const artist = (song.artists || song.ar || []).map(a => a.name).filter(Boolean).join(' / ') || '—';
                        const album = song.album?.name || song.al?.name || '';
                        const duration = formatDuration(song.duration || song.dt);
                        return (
                            <li key={`${song.musicProvider}-${song.id}-${index}`}>
                                <button
                                    type="button"
                                    onClick={() => onPlaySong(song, playQueue)}
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
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <div className="truncate text-sm font-medium">{song.name}</div>
                                            <ProviderIconBadge
                                                provider={song.musicProvider || 'netease'}
                                                size="sm"
                                                isDaylight={isDaylight}
                                            />
                                        </div>
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
        </div>
    );
};

export default DailyRecommendSurface;
