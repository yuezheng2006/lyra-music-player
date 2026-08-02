import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Music2, Search } from 'lucide-react';
import type { YtmHomePlaylist, YtmHomeSection, YtmSearchTrack } from '../../../types/ytmusic';
import {
    fetchYtmusicHome,
    fetchYtmusicPlaylist,
    isYtmusicRuntimeAvailable,
    peekYtmusicHomeSectionsCache,
    peekYtmusicPlaylistCache,
    searchYtmusicPlaylists,
    searchYtmusicTracks,
} from '../../../services/ytmusicService';
import { YTMUSIC_HOME_CHIPS_CN } from '../../../utils/ytmusicHomeChips';
import { useYtmusicBrowseStore, type YtmusicSearchTab } from '../../../stores/useYtmusicBrowseStore';
import { SearchClearButton } from '../../shared/SearchClearButton';
import RemoteLoadState from '../../shared/RemoteLoadState';
import { captureRequestFailure } from '../../../utils/network';
import { APP_CONTENT_BOTTOM_PADDING_CLASS, resolveBrowseListRowClass } from './homeSurfaceStyles';
import YtmusicHomeRails from './ytmusic/YtmusicHomeRails';

// src/components/app/home/YTMusicBrowseSurface.tsx
// Electron-only YouTube Music browse: home rails + Songs/Playlists search.

type YTMusicBrowseSurfaceProps = {
    isDaylight: boolean;
    currentVideoId?: string | null;
    onPlayTrack: (track: YtmSearchTrack, queue: YtmSearchTrack[]) => void;
};

const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '';
    const totalSec = Math.round(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const YTMusicBrowseSurface: React.FC<YTMusicBrowseSurfaceProps> = ({
    isDaylight,
    currentVideoId = null,
    onPlayTrack,
}) => {
    const { t } = useTranslation();
    const listRef = useRef<HTMLDivElement>(null);
    const restoredScrollRef = useRef(false);

    const query = useYtmusicBrowseStore((s) => s.query);
    const tracks = useYtmusicBrowseStore((s) => s.tracks);
    const playlists = useYtmusicBrowseStore((s) => s.playlists);
    const searchTab = useYtmusicBrowseStore((s) => s.searchTab);
    const songsFetched = useYtmusicBrowseStore((s) => s.songsFetched);
    const playlistsFetched = useYtmusicBrowseStore((s) => s.playlistsFetched);
    const searched = useYtmusicBrowseStore((s) => s.searched);
    const loading = useYtmusicBrowseStore((s) => s.loading);
    const error = useYtmusicBrowseStore((s) => s.error);
    const diagnostic = useYtmusicBrowseStore((s) => s.diagnostic);
    const activePlaylist = useYtmusicBrowseStore((s) => s.activePlaylist);
    const playlistSection = useYtmusicBrowseStore((s) => s.playlistSection);
    const playlistLoading = useYtmusicBrowseStore((s) => s.playlistLoading);
    const playlistError = useYtmusicBrowseStore((s) => s.playlistError);
    const playlistDiagnostic = useYtmusicBrowseStore((s) => s.playlistDiagnostic);
    const listScrollTop = useYtmusicBrowseStore((s) => s.listScrollTop);
    const setQuery = useYtmusicBrowseStore((s) => s.setQuery);
    const setSearchTab = useYtmusicBrowseStore((s) => s.setSearchTab);
    const beginSearch = useYtmusicBrowseStore((s) => s.beginSearch);
    const finishSongSearch = useYtmusicBrowseStore((s) => s.finishSongSearch);
    const finishPlaylistSearch = useYtmusicBrowseStore((s) => s.finishPlaylistSearch);
    const failSearch = useYtmusicBrowseStore((s) => s.failSearch);
    const clearSearch = useYtmusicBrowseStore((s) => s.clearSearch);
    const openPlaylistInStore = useYtmusicBrowseStore((s) => s.openPlaylist);
    const setPlaylistCached = useYtmusicBrowseStore((s) => s.setPlaylistCached);
    const beginPlaylistLoad = useYtmusicBrowseStore((s) => s.beginPlaylistLoad);
    const finishPlaylistLoad = useYtmusicBrowseStore((s) => s.finishPlaylistLoad);
    const failPlaylistLoad = useYtmusicBrowseStore((s) => s.failPlaylistLoad);
    const closePlaylist = useYtmusicBrowseStore((s) => s.closePlaylist);
    const setListScrollTop = useYtmusicBrowseStore((s) => s.setListScrollTop);

    const [homeSections, setHomeSections] = useState<YtmHomeSection[]>(
        () => peekYtmusicHomeSectionsCache() || [],
    );
    const [homeLoading, setHomeLoading] = useState(() => !peekYtmusicHomeSectionsCache()?.length);
    const [homeError, setHomeError] = useState<string | null>(null);
    const [homeDiagnostic, setHomeDiagnostic] = useState<string | null>(null);
    const [homeIsEmpty, setHomeIsEmpty] = useState(false);

    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const inputBg = isDaylight ? 'bg-black/5 focus:bg-black/10' : 'bg-white/5 focus:bg-white/10';
    const rowClass = resolveBrowseListRowClass(isDaylight);
    const coverRing = isDaylight
        ? 'ring-1 ring-black/6 group-hover:ring-black/12'
        : 'ring-1 ring-white/8 group-hover:ring-white/16';
    const chipClass = isDaylight
        ? 'cursor-pointer bg-black/5 hover:bg-black/10 text-black/75'
        : 'cursor-pointer bg-white/8 hover:bg-white/14 text-white/80';
    const activeRowClass = isDaylight
        ? 'bg-black/[0.08] ring-1 ring-black/10'
        : 'bg-white/[0.12] ring-1 ring-white/14';
    const tabIdle = isDaylight
        ? 'text-black/50 hover:text-black/80'
        : 'text-white/50 hover:text-white/85';
    const tabActive = isDaylight
        ? 'text-black border-b-2 border-black/70'
        : 'text-white border-b-2 border-white/75';

    const runtimeOk = isYtmusicRuntimeAvailable();
    const showDiscovery = runtimeOk && !searched && !activePlaylist;

    const applyHomeSections = (sections: YtmHomeSection[]) => {
        setHomeSections(sections);
        if (sections.length === 0) {
            setHomeIsEmpty(true);
            setHomeError(t('ytmusic.homeEmpty'));
            return;
        }
        setHomeIsEmpty(false);
        setHomeError(null);
        setHomeDiagnostic(null);
    };

    const loadHome = (forceRefresh = false) => {
        setHomeLoading(true);
        setHomeError(null);
        setHomeDiagnostic(null);
        setHomeIsEmpty(false);
        return fetchYtmusicHome({ forceRefresh })
            .then((sections) => {
                applyHomeSections(sections);
            })
            .catch((err) => {
                const failure = captureRequestFailure(err, forceRefresh ? 'ytm:home:retry' : 'ytm:home');
                setHomeError(failure.message || t('ytmusic.homeFailed'));
                setHomeDiagnostic(failure.diagnostic);
                setHomeIsEmpty(false);
                setHomeSections([]);
            })
            .finally(() => setHomeLoading(false));
    };

    useEffect(() => {
        if (!runtimeOk) return;

        const cached = peekYtmusicHomeSectionsCache();
        if (cached?.length) {
            setHomeSections(cached);
            setHomeLoading(false);
            setHomeError(null);
            setHomeDiagnostic(null);
            setHomeIsEmpty(false);
            return;
        }

        let cancelled = false;
        setHomeLoading(true);
        setHomeError(null);
        setHomeDiagnostic(null);
        setHomeIsEmpty(false);
        void fetchYtmusicHome()
            .then((sections) => {
                if (cancelled) return;
                applyHomeSections(sections);
            })
            .catch((err) => {
                if (cancelled) return;
                const failure = captureRequestFailure(err, 'ytm:home');
                setHomeError(failure.message || t('ytmusic.homeFailed'));
                setHomeDiagnostic(failure.diagnostic);
                setHomeIsEmpty(false);
                setHomeSections([]);
            })
            .finally(() => {
                if (!cancelled) setHomeLoading(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / runtime gate only
    }, [runtimeOk, t]);

    useEffect(() => {
        if (restoredScrollRef.current) return;
        const node = listRef.current;
        if (!node) return;
        node.scrollTop = listScrollTop;
        restoredScrollRef.current = true;
    }, [listScrollTop, searched, activePlaylist, playlistSection, tracks.length, playlists.length, searchTab]);

    const runSearch = async (raw: string, tab: YtmusicSearchTab = searchTab) => {
        const nextQuery = raw.trim();
        if (!nextQuery) return;
        if (!runtimeOk) {
            failSearch(t('ytmusic.desktopOnly'));
            return;
        }

        beginSearch(nextQuery, tab);
        restoredScrollRef.current = false;
        if (listRef.current) listRef.current.scrollTop = 0;

        try {
            if (tab === 'playlists') {
                const results = await searchYtmusicPlaylists(nextQuery, 30);
                finishPlaylistSearch(results);
            } else {
                const results = await searchYtmusicTracks(nextQuery, 30);
                finishSongSearch(results);
            }
        } catch (err) {
            const failure = captureRequestFailure(err, 'ytm:search');
            failSearch(failure.message || t('ytmusic.searchFailed'), failure.diagnostic);
        }
    };

    const switchSearchTab = (tab: YtmusicSearchTab) => {
        if (tab === searchTab) return;
        setSearchTab(tab);
        restoredScrollRef.current = false;
        if (listRef.current) listRef.current.scrollTop = 0;
        const alreadyFetched = tab === 'songs' ? songsFetched : playlistsFetched;
        if (searched && query.trim() && !alreadyFetched && !loading) {
            void runSearch(query, tab);
        }
    };

    const openPlaylist = async (playlist: YtmHomePlaylist) => {
        openPlaylistInStore(playlist);
        restoredScrollRef.current = false;
        if (listRef.current) listRef.current.scrollTop = 0;

        const cached = peekYtmusicPlaylistCache(playlist.playlistId);
        if (cached) {
            setPlaylistCached(cached);
            return;
        }

        beginPlaylistLoad();
        try {
            const section = await fetchYtmusicPlaylist(playlist, 30);
            finishPlaylistLoad(section);
        } catch (err) {
            const failure = captureRequestFailure(err, 'ytm:playlist');
            failPlaylistLoad(failure.message || t('ytmusic.playlistFailed'), failure.diagnostic);
        }
    };

    const renderTrackRow = (track: YtmSearchTrack, queue: YtmSearchTrack[], index: number) => {
        const isActive = Boolean(currentVideoId && track.videoId === currentVideoId);
        return (
            <li key={track.videoId}>
                <button
                    type="button"
                    className={`group flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors ${rowClass} ${isActive ? activeRowClass : ''}`}
                    onClick={() => onPlayTrack(track, queue)}
                    aria-current={isActive ? 'true' : undefined}
                >
                    <span className={`w-5 shrink-0 text-center text-[11px] tabular-nums ${isActive ? (isDaylight ? 'text-black/70' : 'text-white/80') : muted}`}>
                        {index + 1}
                    </span>
                    <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/10 ${coverRing}`}>
                        {track.coverUrl ? (
                            <img src={track.coverUrl} alt="" className="h-full w-full object-contain" loading="lazy" referrerPolicy="no-referrer" />
                        ) : null}
                        {isActive ? (
                            <span className={`absolute inset-x-0 bottom-0 h-0.5 ${isDaylight ? 'bg-zinc-800' : 'bg-white'}`} />
                        ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className={`truncate text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{track.title}</div>
                        <div className={`truncate text-xs ${muted}`}>
                            {[track.artist, track.album].filter(Boolean).join(' · ')}
                        </div>
                    </div>
                    <div className={`shrink-0 text-xs tabular-nums ${muted}`}>
                        {formatDuration(track.durationMs)}
                    </div>
                </button>
            </li>
        );
    };

    const renderPlaylistRow = (playlist: YtmHomePlaylist) => (
        <li key={playlist.playlistId}>
            <button
                type="button"
                className={`group flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors ${rowClass}`}
                onClick={() => void openPlaylist(playlist)}
            >
                <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/10 ${coverRing}`}>
                    {playlist.coverUrl ? (
                        <img
                            src={playlist.coverUrl}
                            alt=""
                            className="h-full w-full object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Music2 className={`h-5 w-5 ${muted}`} />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{playlist.title}</div>
                    <div className={`truncate text-xs ${muted}`}>{t('ytmusic.playlistSubtitle')}</div>
                </div>
            </button>
        </li>
    );

    return (
        <div className={`flex h-full min-h-0 flex-col px-6 pt-6 ${APP_CONTENT_BOTTOM_PADDING_CLASS}`}>
            <div className="mb-5 flex items-start gap-3">
                {activePlaylist ? (
                    <button
                        type="button"
                        className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${rowClass} ${isDaylight ? 'bg-black/5' : 'bg-white/8'}`}
                        aria-label={t('ytmusic.backToPlaylists')}
                        onClick={closePlaylist}
                    >
                        <ArrowLeft className="h-5 w-5 opacity-80" />
                    </button>
                ) : (
                    <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${isDaylight ? 'bg-black/5' : 'bg-white/8'}`}>
                        <Music2 className="h-5 w-5 opacity-80" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-semibold tracking-tight">
                        {activePlaylist ? activePlaylist.title : t('ytmusic.title')}
                    </h1>
                    <p className={`mt-1 text-sm ${muted}`}>
                        {activePlaylist
                            ? (t('ytmusic.playlistSubtitle') || '公开歌单')
                            : t('ytmusic.subtitle')}
                    </p>
                </div>
            </div>

            {!activePlaylist ? (
                <form
                    className="relative mb-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void runSearch(query, searchTab);
                    }}
                >
                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('ytmusic.searchPlaceholder')}
                        className={`w-full rounded-2xl py-3 pl-10 pr-10 text-sm outline-none transition ${inputBg}`}
                        disabled={!runtimeOk}
                    />
                    <SearchClearButton
                        visible={query.length > 0 || searched}
                        label={t('ytmusic.clearSearch')}
                        onClear={clearSearch}
                    />
                </form>
            ) : null}

            {!runtimeOk ? (
                <p className={`text-sm ${muted}`}>{t('ytmusic.desktopOnly')}</p>
            ) : null}

            {showDiscovery ? (
                <div className="mb-4 flex flex-wrap gap-2">
                    {YTMUSIC_HOME_CHIPS_CN.map((chip) => (
                        <button
                            key={chip}
                            type="button"
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${chipClass}`}
                            onClick={() => void runSearch(chip, 'songs')}
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            ) : null}

            {searched && !activePlaylist ? (
                <div className={`mb-3 flex gap-4 border-b px-1 ${isDaylight ? 'border-black/8' : 'border-white/10'}`}>
                    {([
                        ['songs', t('ytmusic.searchSongs')],
                        ['playlists', t('ytmusic.searchPlaylists')],
                    ] as const).map(([tab, label]) => (
                        <button
                            key={tab}
                            type="button"
                            className={`-mb-px pb-2 text-sm font-medium transition ${searchTab === tab ? tabActive : tabIdle}`}
                            onClick={() => switchSearchTab(tab)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            ) : null}

            {loading ? (
                <div className={`flex items-center gap-2 text-sm ${muted}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('ytmusic.searching')}
                </div>
            ) : null}

            {error && searched && !activePlaylist ? (
                <RemoteLoadState
                    status="error"
                    isDaylight={isDaylight}
                    errorLabel={error}
                    onRetry={() => void runSearch(query, searchTab)}
                    diagnostic={diagnostic}
                    className="min-h-[160px]"
                />
            ) : null}

            {!loading && !error && searched && !activePlaylist && searchTab === 'songs' && songsFetched && tracks.length === 0 ? (
                <p className={`text-sm ${muted}`}>{t('ytmusic.empty')}</p>
            ) : null}

            {!loading && !error && searched && !activePlaylist && searchTab === 'playlists' && playlistsFetched && playlists.length === 0 ? (
                <p className={`text-sm ${muted}`}>{t('ytmusic.emptyPlaylists')}</p>
            ) : null}

            <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto pb-8"
                onScroll={(event) => {
                    setListScrollTop(event.currentTarget.scrollTop);
                }}
            >
                {searched && !activePlaylist ? (
                    searchTab === 'playlists' ? (
                        <ul className="space-y-0.5">
                            {playlists.map((playlist) => renderPlaylistRow(playlist))}
                        </ul>
                    ) : (
                        <ul className="space-y-0.5">
                            {tracks.map((track, index) => renderTrackRow(track, tracks, index))}
                        </ul>
                    )
                ) : activePlaylist ? (
                    <div className="space-y-3">
                        {activePlaylist.coverUrl ? (
                            <div className="mb-1 flex items-center gap-3 px-1">
                                <div className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black/10 ${coverRing}`}>
                                    <img
                                        src={activePlaylist.coverUrl}
                                        alt=""
                                        className="h-full w-full object-contain"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold">{activePlaylist.title}</div>
                                    <div className={`mt-0.5 text-xs ${muted}`}>
                                        {playlistSection?.tracks.length
                                            ? t('ytmusic.trackCount', { count: playlistSection.tracks.length })
                                            : t('ytmusic.playlistSubtitle')}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        {playlistLoading ? (
                            <div className={`flex items-center gap-2 text-sm ${muted}`}>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('ytmusic.playlistLoading')}
                            </div>
                        ) : null}
                        {playlistError ? (
                            <RemoteLoadState
                                status="error"
                                isDaylight={isDaylight}
                                errorLabel={playlistError}
                                onRetry={() => activePlaylist && void openPlaylist(activePlaylist)}
                                diagnostic={playlistDiagnostic}
                                className="min-h-[140px]"
                            />
                        ) : null}
                        {playlistSection ? (
                            <ul className="space-y-0.5">
                                {playlistSection.tracks.map((track, index) => (
                                    renderTrackRow(track, playlistSection.tracks, index)
                                ))}
                            </ul>
                        ) : null}
                    </div>
                ) : (
                    <YtmusicHomeRails
                        sections={homeSections}
                        loading={homeLoading}
                        error={homeError}
                        diagnostic={homeDiagnostic}
                        isEmpty={homeIsEmpty}
                        isDaylight={isDaylight}
                        currentVideoId={currentVideoId}
                        onRetry={() => {
                            void loadHome(true);
                        }}
                        onSeeAll={(playlist) => {
                            void openPlaylist(playlist);
                        }}
                        onPlayTrack={onPlayTrack}
                    />
                )}
            </div>
        </div>
    );
};

export default YTMusicBrowseSurface;
