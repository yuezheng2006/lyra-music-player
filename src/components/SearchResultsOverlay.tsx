import React, { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Play, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Theme, UnifiedSong } from '../types';
import { formatSongName } from '../utils/songNameFormatter';
import { useSearchNavigationStore } from '../stores/useSearchNavigationStore';
import { useShallow } from 'zustand/react/shallow';
import { getSongUnavailableTagText, isSongMarkedUnavailable } from '../services/netease';
import { isBlob } from '../utils/blobGuards';
import { OnlineProviderBadge } from './shared/OnlineProviderBadge';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { createSongCoverPlaceholder } from '../utils/coverPlaceholders';

// src/components/SearchResultsOverlay.tsx
// Home-embedded search panel. Channel is driven by home source pills; no in-panel picker.

const toSafeRemoteUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http:') && url.includes('music.126.net')) {
        return url.replace('http:', 'https:');
    }
    return url;
};

const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) return '--:--';
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface SearchResultsOverlayProps {
    theme: Theme;
    isDaylight: boolean;
    onClose: () => void;
    onSubmitSearch: () => void;
    onLoadMore: () => void;
    onPlayTrack: (track: UnifiedSong) => void;
    onAddSongToQueue: (track: UnifiedSong) => void;
    onSelectArtist: (track: UnifiedSong, artistName: string, artistId?: number) => void;
    onSelectAlbum: (track: UnifiedSong, albumName: string, albumId?: number) => void;
}

const SearchResultCover: React.FC<{ track: UnifiedSong }> = ({ track }) => {
    const [src, setSrc] = React.useState<string | undefined>(undefined);

    useEffect(() => {
        let objectUrl: string | undefined;

        const artistLabel = track.ar?.map(a => a.name).filter(Boolean).join(', ')
            || track.artists?.map(a => a.name).filter(Boolean).join(', ')
            || '';
        const fallback = createSongCoverPlaceholder(track.name, artistLabel);

        if (track.isLocal && track.localData) {
            const localSong = track.localData;
            if (localSong.useOnlineCover !== false && localSong.matchedCoverUrl) {
                setSrc(toSafeRemoteUrl(localSong.matchedCoverUrl) || fallback);
            } else if (isBlob(localSong.embeddedCover)) {
                objectUrl = URL.createObjectURL(localSong.embeddedCover);
                setSrc(objectUrl);
            } else {
                setSrc(fallback);
            }
        } else {
            setSrc(toSafeRemoteUrl(track.al?.picUrl || track.album?.picUrl) || fallback);
        }

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [track]);

    return <img src={src || createSongCoverPlaceholder(track.name)} className="w-full h-full object-cover" loading="lazy" alt="" />;
};

const SearchResultsOverlay: React.FC<SearchResultsOverlayProps> = ({
    isDaylight,
    onClose,
    onSubmitSearch,
    onLoadMore,
    onPlayTrack,
    onAddSongToQueue,
    onSelectArtist,
    onSelectAlbum,
}) => {
    const { t } = useTranslation();
    const {
        searchQuery,
        searchProviders,
        searchResults,
        isSearchOpen,
        isSearching,
        isLoadingMore,
        hasMore,
        scrollTop,
        setSearchQuery,
        setSearchScrollTop,
    } = useSearchNavigationStore(useShallow(state => ({
        searchQuery: state.searchQuery,
        searchProviders: state.searchProviders,
        searchResults: state.searchResults,
        isSearchOpen: state.isSearchOpen,
        isSearching: state.isSearching,
        isLoadingMore: state.isLoadingMore,
        hasMore: state.hasMore,
        scrollTop: state.scrollTop,
        setSearchQuery: state.setSearchQuery,
        setSearchScrollTop: state.setSearchScrollTop,
    })));
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const activeProviders = searchProviders.filter(
        (id): id is OnlineLibraryProviderId => id === 'netease' || id === 'qq' || id === 'coco',
    );
    const isMultiSource = activeProviders.length > 1;
    const isCocoOnly = activeProviders.length === 1 && activeProviders[0] === 'coco';
    const activeProvider = activeProviders[0] || 'coco';

    const searchPlaceholder = useMemo(() => {
        if (isMultiSource) return t('home.searchMultiSources');
        if (activeProvider === 'qq') return t('home.searchQQMusic');
        if (activeProvider === 'coco') return t('home.searchCocoMusic');
        return t('search.placeholder');
    }, [activeProvider, isMultiSource, t]);

    const searchSubtitle = useMemo(() => {
        if (isMultiSource) return t('search.subtitleMulti');
        if (activeProvider === 'coco') return t('search.subtitleCoco');
        return t('search.subtitle');
    }, [activeProvider, isMultiSource, t]);

    const searchTitle = isMultiSource
        ? t('search.title')
        : (isCocoOnly ? t('home.cocoProvider') : t('search.title'));

    const shellBg = isDaylight ? 'bg-[#f4f7fb]/92' : 'bg-black/80';
    const panelBg = isDaylight
        ? 'bg-white/90 border-black/8 shadow-[0_8px_30px_rgba(15,23,42,0.06)]'
        : 'bg-white/8 border-white/10';
    const inputBg = isDaylight ? 'bg-white border-black/10' : 'bg-white/5 border-white/10';
    const mutedText = isDaylight ? 'text-black/55' : 'text-white/60';
    const headingText = isDaylight ? 'text-slate-900' : 'text-white';
    const rowBg = isDaylight
        ? 'bg-white/80 hover:bg-white border-black/6'
        : 'bg-white/5 hover:bg-white/10 border-white/8';
    const accentBtn = 'bg-[#3b82f6] hover:bg-[#2563eb] text-white';
    const backBtnClass = isDaylight
        ? 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
        : 'bg-white/10 text-white/75 hover:bg-white/20 hover:text-white';

    useEffect(() => {
        if (!isSearchOpen || !scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTop = scrollTop;
    }, [isSearchOpen, scrollTop, searchResults]);

    useEffect(() => {
        if (!isSearchOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, onClose]);

    const resultCount = searchResults?.length ?? 0;
    const showProviderBadge = isMultiSource || !isCocoOnly;

    return (
        <AnimatePresence>
            {isSearchOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className={`absolute inset-0 z-40 ${shellBg} backdrop-blur-md flex flex-col overflow-hidden pointer-events-auto`}
                    style={{
                        color: 'var(--text-primary)',
                        WebkitAppRegion: 'no-drag',
                    } as React.CSSProperties}
                >
                    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pt-4 md:pt-5 pb-3 shrink-0">
                        <div className="flex items-start gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`mt-0.5 inline-flex items-center justify-center min-h-10 min-w-10 rounded-full transition-colors touch-manipulation ${backBtnClass}`}
                                aria-label={t('ui.backToHome')}
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className={`text-lg md:text-xl font-bold tracking-tight ${headingText}`}>
                                        {searchTitle}
                                    </h1>
                                    {isCocoOnly && (
                                        <OnlineProviderBadge provider="coco" size="md" />
                                    )}
                                    {isMultiSource && activeProviders.map(provider => (
                                        <OnlineProviderBadge key={provider} provider={provider} size="md" />
                                    ))}
                                </div>
                                <p className={`mt-1 text-xs md:text-sm leading-relaxed ${mutedText}`}>
                                    {searchSubtitle}
                                </p>
                            </div>
                        </div>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                onSubmitSearch();
                            }}
                            className={`mt-4 flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border p-2 ${panelBg}`}
                        >

                            <div className={`relative flex-1 rounded-xl border ${inputBg}`}>
                                {isSearching ? (
                                    <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin opacity-50" />
                                ) : (
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                                )}
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full bg-transparent rounded-xl min-h-11 py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSearching || !searchQuery.trim()}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl min-h-11 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 touch-manipulation active:scale-[0.98] ${accentBtn}`}
                            >
                                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                {t('search.submit')}
                            </button>
                        </form>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 md:px-6 pb-28"
                        onScroll={(event) => setSearchScrollTop(event.currentTarget.scrollTop)}
                    >
                        <div className="max-w-5xl mx-auto">
                            {isSearching ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="animate-spin w-8 h-8 opacity-50" />
                                </div>
                            ) : searchResults && searchResults.length > 0 ? (
                                <>
                                    <div className="mb-3 flex items-baseline justify-between gap-3">
                                        <h2 className={`text-sm font-semibold ${headingText}`}>{t('search.resultsTitle')}</h2>
                                        <p className={`text-xs ${mutedText}`}>
                                            {t('search.resultsCount', { count: resultCount })}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        {searchResults.map((track, index) => {
                                            const isUnavailable = isSongMarkedUnavailable(track);
                                            const unavailableTagText = getSongUnavailableTagText(track, t('status.songUnavailableTag'));
                                            const artistNames = track.ar?.map(artist => artist.name).filter(Boolean).join(', ')
                                                || track.artists?.map(artist => artist.name).filter(Boolean).join(', ')
                                                || t('player.unknownArtist', '未知歌手');
                                            const albumName = track.al?.name || track.album?.name || t('player.unknownAlbum', '未知专辑');

                                            return (
                                                <div
                                                    key={`${track.id}-${index}`}
                                                    className={`rounded-xl border px-3 py-2.5 md:px-3.5 transition-colors ${rowBg} ${isUnavailable ? 'opacity-55' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => !isUnavailable && onPlayTrack(track)}
                                                            disabled={isUnavailable}
                                                            className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 touch-manipulation group/cover disabled:cursor-default"
                                                            title={t('search.play')}
                                                        >
                                                            <SearchResultCover track={track} />
                                                            {!isUnavailable && (
                                                                <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                                                                    <Play size={16} className="text-white fill-white" />
                                                                </span>
                                                            )}
                                                        </button>

                                                        <div className="min-w-0 flex-1">
                                                            <div className={`font-semibold text-sm truncate ${headingText}`}>
                                                                {formatSongName(track)}
                                                                {isUnavailable && (
                                                                    <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium align-middle ${isDaylight ? 'border-black/8 bg-black/[0.04] text-zinc-600' : 'border-white/10 bg-white/[0.05] text-zinc-300'}`}>
                                                                        {unavailableTagText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={`mt-0.5 text-xs truncate ${mutedText}`}>
                                                                {showProviderBadge && (
                                                                    <OnlineProviderBadge
                                                                        provider={track.musicProvider || activeProvider}
                                                                        className="mr-1.5 align-middle"
                                                                    />
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="hover:underline"
                                                                    onClick={() => {
                                                                        const first = track.ar?.[0] || track.artists?.[0];
                                                                        onSelectArtist(track, first?.name || artistNames, first?.id);
                                                                    }}
                                                                >
                                                                    {artistNames}
                                                                </button>
                                                                <span className="mx-1 opacity-40">·</span>
                                                                <button
                                                                    type="button"
                                                                    className="hover:underline"
                                                                    onClick={() => {
                                                                        const albumId = track.al?.id || track.album?.id;
                                                                        if (albumName) onSelectAlbum(track, albumName, albumId);
                                                                    }}
                                                                >
                                                                    {albumName}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className={`hidden sm:inline text-[11px] font-mono tabular-nums mr-1 ${mutedText}`}>
                                                                {formatDuration(track.dt || track.duration)}
                                                            </span>
                                                            {!isUnavailable && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onPlayTrack(track)}
                                                                        className={`inline-flex items-center justify-center min-h-10 min-w-10 rounded-full transition-colors touch-manipulation active:scale-95 ${isDaylight ? 'bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]' : 'bg-[#1d4ed8]/20 text-[#93c5fd] hover:bg-[#1d4ed8]/30'}`}
                                                                        title={t('search.play')}
                                                                    >
                                                                        <Play size={15} className="ml-0.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onAddSongToQueue(track)}
                                                                        className={`inline-flex items-center justify-center min-h-10 min-w-10 rounded-full transition-colors touch-manipulation active:scale-95 ${isDaylight ? 'hover:bg-black/5 text-slate-600' : 'hover:bg-white/10 text-white/70'}`}
                                                                        title={t('search.addToQueue')}
                                                                    >
                                                                        <Plus size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {hasMore && (
                                        <div className="flex justify-center pt-6">
                                            <button
                                                type="button"
                                                onClick={onLoadMore}
                                                disabled={isLoadingMore}
                                                className={`min-h-10 px-5 py-2 rounded-full border text-sm transition-colors touch-manipulation ${isDaylight ? 'border-black/10 bg-white hover:bg-slate-50' : 'border-white/10 bg-white/5 hover:bg-white/10'} disabled:opacity-60`}
                                            >
                                                {isLoadingMore ? t('localMusic.searching', '搜索中...') : t('home.loadMore')}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : searchQuery.trim() && !isSearching ? (
                                <div className={`text-center py-16 text-sm ${mutedText}`}>{t('home.noResults')}</div>
                            ) : (
                                <div className={`text-center py-16 text-sm ${mutedText}`}>
                                    {searchPlaceholder}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SearchResultsOverlay;
