import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Search, Music2 } from 'lucide-react';
import type { YtmHomePlaylist, YtmSearchTrack } from '../../../types/ytmusic';
import {
    fetchYtmusicHomeShelves,
    fetchYtmusicPlaylist,
    isYtmusicRuntimeAvailable,
    peekYtmusicHomeShelvesCache,
    peekYtmusicPlaylistCache,
    searchYtmusicTracks,
} from '../../../services/ytmusicService';
import { YTMUSIC_HOME_CHIPS_CN } from '../../../utils/ytmusicHomeChips';
import { useYtmusicBrowseStore } from '../../../stores/useYtmusicBrowseStore';
import { SearchClearButton } from '../../shared/SearchClearButton';
import { APP_CONTENT_BOTTOM_PADDING_CLASS, resolveBrowseListRowClass } from './homeSurfaceStyles';

// src/components/app/home/YTMusicBrowseSurface.tsx
// Electron-only YouTube Music browse: session-backed search/playlist + home shelves.

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
    const searched = useYtmusicBrowseStore((s) => s.searched);
    const loading = useYtmusicBrowseStore((s) => s.loading);
    const error = useYtmusicBrowseStore((s) => s.error);
    const activePlaylist = useYtmusicBrowseStore((s) => s.activePlaylist);
    const playlistSection = useYtmusicBrowseStore((s) => s.playlistSection);
    const playlistLoading = useYtmusicBrowseStore((s) => s.playlistLoading);
    const playlistError = useYtmusicBrowseStore((s) => s.playlistError);
    const listScrollTop = useYtmusicBrowseStore((s) => s.listScrollTop);
    const setQuery = useYtmusicBrowseStore((s) => s.setQuery);
    const beginSearch = useYtmusicBrowseStore((s) => s.beginSearch);
    const finishSearch = useYtmusicBrowseStore((s) => s.finishSearch);
    const failSearch = useYtmusicBrowseStore((s) => s.failSearch);
    const clearSearch = useYtmusicBrowseStore((s) => s.clearSearch);
    const openPlaylistInStore = useYtmusicBrowseStore((s) => s.openPlaylist);
    const setPlaylistCached = useYtmusicBrowseStore((s) => s.setPlaylistCached);
    const beginPlaylistLoad = useYtmusicBrowseStore((s) => s.beginPlaylistLoad);
    const finishPlaylistLoad = useYtmusicBrowseStore((s) => s.finishPlaylistLoad);
    const failPlaylistLoad = useYtmusicBrowseStore((s) => s.failPlaylistLoad);
    const closePlaylist = useYtmusicBrowseStore((s) => s.closePlaylist);
    const setListScrollTop = useYtmusicBrowseStore((s) => s.setListScrollTop);

    const [playlists, setPlaylists] = useState<YtmHomePlaylist[]>(() => peekYtmusicHomeShelvesCache() || []);
    const [homeLoading, setHomeLoading] = useState(() => !peekYtmusicHomeShelvesCache()?.length);
    const [homeError, setHomeError] = useState<string | null>(null);

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

    const runtimeOk = isYtmusicRuntimeAvailable();
    const showDiscovery = runtimeOk && !searched && !activePlaylist;

    useEffect(() => {
        if (!runtimeOk) return;

        const cached = peekYtmusicHomeShelvesCache();
        if (cached?.length) {
            setPlaylists(cached);
            setHomeLoading(false);
            setHomeError(null);
            return;
        }

        let cancelled = false;
        setHomeLoading(true);
        setHomeError(null);

        void fetchYtmusicHomeShelves()
            .then((shelves) => {
                if (cancelled) return;
                setPlaylists(shelves);
                if (shelves.length === 0) {
                    setHomeError(t('ytmusic.homeEmpty'));
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setHomeError(err instanceof Error ? err.message : t('ytmusic.homeFailed'));
                setPlaylists([]);
            })
            .finally(() => {
                if (!cancelled) setHomeLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [runtimeOk, t]);

    useEffect(() => {
        if (restoredScrollRef.current) return;
        const node = listRef.current;
        if (!node) return;
        node.scrollTop = listScrollTop;
        restoredScrollRef.current = true;
    }, [listScrollTop, searched, activePlaylist, playlistSection, tracks.length]);

    const runSearch = async (raw: string) => {
        const nextQuery = raw.trim();
        if (!nextQuery) return;
        if (!runtimeOk) {
            failSearch(t('ytmusic.desktopOnly'));
            return;
        }

        beginSearch(nextQuery);
        restoredScrollRef.current = false;
        if (listRef.current) listRef.current.scrollTop = 0;
        try {
            const results = await searchYtmusicTracks(nextQuery, 30);
            finishSearch(results);
        } catch (err) {
            failSearch(err instanceof Error ? err.message : t('ytmusic.searchFailed'));
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
            failPlaylistLoad(err instanceof Error ? err.message : t('ytmusic.playlistFailed'));
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
                            <img src={track.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
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
                        void runSearch(query);
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
                            onClick={() => void runSearch(chip)}
                        >
                            {chip}
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

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            {!loading && !error && searched && tracks.length === 0 ? (
                <p className={`text-sm ${muted}`}>{t('ytmusic.empty')}</p>
            ) : null}

            <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto pb-8"
                onScroll={(event) => {
                    setListScrollTop(event.currentTarget.scrollTop);
                }}
            >
                {searched ? (
                    <ul className="space-y-0.5">
                        {tracks.map((track, index) => renderTrackRow(track, tracks, index))}
                    </ul>
                ) : activePlaylist ? (
                    <div className="space-y-3">
                        {activePlaylist.coverUrl ? (
                            <div className="mb-1 flex items-center gap-3 px-1">
                                <div className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black/10 ${coverRing}`}>
                                    <img
                                        src={activePlaylist.coverUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
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
                            <p className={`text-sm ${muted}`}>{playlistError}</p>
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
                    <div className="space-y-4">
                        <div className="space-y-1 px-1">
                            <h2 className="text-sm font-semibold tracking-tight">
                                {t('ytmusic.playlistsHeading')}
                            </h2>
                            <p className={`text-xs leading-relaxed ${muted}`}>
                                {t('ytmusic.playlistsCaption')}
                            </p>
                        </div>
                        {homeLoading && playlists.length === 0 ? (
                            <div className={`flex items-center gap-2 text-sm ${muted}`}>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('ytmusic.homeLoading')}
                            </div>
                        ) : null}
                        {homeError && playlists.length === 0 ? (
                            <p className={`text-sm ${muted}`}>{t('ytmusic.homeFailed')}</p>
                        ) : null}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.playlistId}
                                    type="button"
                                    className={`group min-w-0 text-left ${rowClass} rounded-2xl p-2`}
                                    onClick={() => void openPlaylist(playlist)}
                                >
                                    <div className={`aspect-square w-full overflow-hidden rounded-xl bg-black/10 ${coverRing}`}>
                                        {playlist.coverUrl ? (
                                            <img
                                                src={playlist.coverUrl}
                                                alt=""
                                                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Music2 className={`h-8 w-8 ${muted}`} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 truncate px-0.5 text-sm font-medium">
                                        {playlist.title}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YTMusicBrowseSurface;
