import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import type { SongResult } from '../../../types';
import {
    fetchHotPodcasts,
    fetchPodcastPrograms,
    searchPodcasts,
    type NeteasePodcastRadio,
} from '../../../services/neteasePodcast';
import { ProviderIconBadge } from './ProviderIconBadge';
import { SearchClearButton } from '../../shared/SearchClearButton';
import LazyCoverImage from '../../shared/LazyCoverImage';
import { resolveBrowseListRowClass, resolveHomeContentBottomPaddingClass } from './homeSurfaceStyles';

// src/components/app/home/PodcastBrowseSurface.tsx
// Sidebar podcast surface: hot/search radios → episode list → play.

type PodcastBrowseSurfaceProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
};

/** Compact count for card meta (e.g. 1.2万 / 12K). */
const formatCompactCount = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return '';
    try {
        return new Intl.NumberFormat(undefined, {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
        }).format(value);
    } catch {
        return String(value);
    }
};

const buildRadioMetaParts = (
    radio: NeteasePodcastRadio,
    t: (key: string, options?: any) => string,
): string[] => {
    const parts: string[] = [];
    if (radio.category) parts.push(radio.category);
    if (radio.programCount > 0) {
        parts.push(t('home.podcastEpisodes', { count: radio.programCount }));
    }
    const subs = formatCompactCount(radio.subCount);
    if (subs) {
        parts.push(t('home.podcastSubscribers', { count: subs }));
    }
    return parts;
};

const PodcastBrowseSurface: React.FC<PodcastBrowseSurfaceProps> = ({
    isDaylight,
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [radios, setRadios] = useState<NeteasePodcastRadio[]>([]);
    const [activeRadio, setActiveRadio] = useState<NeteasePodcastRadio | null>(null);
    const [programs, setPrograms] = useState<SongResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const inputBg = isDaylight ? 'bg-black/5 focus:bg-black/10' : 'bg-white/5 focus:bg-white/10';
    const rowClass = resolveBrowseListRowClass(isDaylight);
    const coverRing = isDaylight
        ? 'ring-1 ring-black/6 group-hover:ring-black/12'
        : 'ring-1 ring-white/8 group-hover:ring-white/16';

    const loadHot = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await fetchHotPodcasts(36, 0);
            setRadios(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('home.podcastLoadFailed'));
            setRadios([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadHot();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const q = query.trim();
        if (!q) {
            void loadHot();
            return;
        }
        setLoading(true);
        setError(null);
        setActiveRadio(null);
        setPrograms([]);
        try {
            const list = await searchPodcasts(q, 36);
            setRadios(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('home.podcastLoadFailed'));
            setRadios([]);
        } finally {
            setLoading(false);
        }
    };

    const openRadio = async (radio: NeteasePodcastRadio) => {
        setActiveRadio(radio);
        setLoading(true);
        setError(null);
        try {
            const { programs: list, radio: detail } = await fetchPodcastPrograms(radio.id, 40, 0);
            if (detail?.name) setActiveRadio({ ...radio, ...detail });
            setPrograms(list);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('home.podcastLoadFailed'));
            setPrograms([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col px-4 md:px-8">
            <div className="mb-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    {activeRadio ? (
                        <button
                            type="button"
                            onClick={() => {
                                setActiveRadio(null);
                                setPrograms([]);
                            }}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                                isDaylight ? 'hover:bg-black/8' : 'hover:bg-white/10'
                            }`}
                            aria-label={t('home.podcastBack')}
                        >
                            <ArrowLeft size={16} />
                        </button>
                    ) : null}
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="truncate text-lg font-semibold tracking-tight">
                                {activeRadio ? activeRadio.name : t('home.podcastTitle')}
                            </div>
                            <ProviderIconBadge
                                provider="netease"
                                size="sm"
                                isDaylight={isDaylight}
                            />
                        </div>
                        <div className={`mt-0.5 truncate text-xs ${muted}`}>
                            {activeRadio
                                ? (activeRadio.djName || t('home.podcastEpisodes', { count: programs.length }))
                                : t('home.podcastSubtitle')}
                        </div>
                    </div>
                </div>
                {!activeRadio ? (
                    <form onSubmit={handleSearch} className="relative">
                        {loading ? (
                            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin opacity-40" />
                        ) : (
                            <Search
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer opacity-40 hover:opacity-100"
                                onClick={() => void handleSearch()}
                            />
                        )}
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('home.podcastSearchPlaceholder')}
                            className={`w-full rounded-full border border-white/10 py-2 pl-10 pr-9 text-sm focus:outline-none focus:border-white/20 ${inputBg}`}
                            style={{ color: 'var(--content-text)' }}
                        />
                        <SearchClearButton
                            visible={Boolean(query)}
                            onClear={() => setQuery('')}
                            label={t('app.clearSearch')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        />
                    </form>
                ) : null}
            </div>

            {error ? (
                <div className={`flex flex-1 items-center justify-center text-sm ${muted}`}>{error}</div>
            ) : loading && !activeRadio && radios.length === 0 ? (
                <div className={`flex flex-1 items-center justify-center gap-2 text-sm ${muted}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('home.podcastLoading')}
                </div>
            ) : activeRadio ? (
                <div className={`min-h-0 flex-1 overflow-y-auto ${resolveHomeContentBottomPaddingClass(true)}`}>
                    {loading && programs.length === 0 ? (
                        <div className={`flex items-center justify-center gap-2 py-16 text-sm ${muted}`}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('home.podcastLoading')}
                        </div>
                    ) : programs.length === 0 ? (
                        <div className={`py-16 text-center text-sm ${muted}`}>{t('home.podcastNoEpisodes')}</div>
                    ) : (
                        <ul className="space-y-0.5">
                            {programs.map((song, index) => (
                                <li key={`${song.programId || song.id}-${index}`}>
                                    <button
                                        type="button"
                                        onClick={() => onPlaySong(song, programs)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${rowClass}`}
                                    >
                                        <span className={`w-6 shrink-0 text-center text-xs tabular-nums ${muted}`}>
                                            {song.serialNum || index + 1}
                                        </span>
                                        <LazyCoverImage
                                            src={song.album?.picUrl || song.al?.picUrl || activeRadio.cover}
                                            alt=""
                                            placeholderLabel={song.name}
                                            placeholderArtist={activeRadio.djName || activeRadio.name}
                                            placeholderVariant="playlist"
                                            sizePx={96}
                                            className={`h-11 w-11 shrink-0 rounded-lg object-cover ${
                                                isDaylight ? 'bg-black/5' : 'bg-white/8'
                                            }`}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <div className="truncate text-sm font-medium">{song.name}</div>
                                                <ProviderIconBadge
                                                    provider={song.musicProvider || 'netease'}
                                                    size="sm"
                                                    isDaylight={isDaylight}
                                                />
                                            </div>
                                            <div className={`truncate text-xs ${muted}`}>
                                                {song.radioName || activeRadio.name}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <div className={`min-h-0 flex-1 overflow-y-auto ${resolveHomeContentBottomPaddingClass(true)}`}>
                    {radios.length === 0 ? (
                        <div className={`py-16 text-center text-sm ${muted}`}>{t('home.podcastEmpty')}</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                            {radios.map((radio) => {
                                const metaParts = buildRadioMetaParts(radio, t);
                                return (
                                    <button
                                        key={radio.id}
                                        type="button"
                                        onClick={() => void openRadio(radio)}
                                        className="group min-w-0 cursor-pointer text-left transition-opacity hover:opacity-95"
                                    >
                                        <div className={`aspect-square w-full overflow-hidden rounded-xl ${coverRing}`}>
                                            <LazyCoverImage
                                                src={radio.cover}
                                                alt=""
                                                placeholderLabel={radio.name}
                                                placeholderArtist={radio.djName}
                                                placeholderVariant="playlist"
                                                sizePx={320}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="mt-1.5 px-0.5">
                                            <div className="line-clamp-2 text-[13px] font-medium leading-snug">
                                                {radio.name}
                                            </div>
                                            {radio.djName ? (
                                                <div className={`mt-0.5 truncate text-[11px] ${muted}`}>
                                                    {radio.djName}
                                                </div>
                                            ) : null}
                                            {metaParts.length > 0 ? (
                                                <div className={`mt-0.5 truncate text-[10px] leading-relaxed ${muted}`}>
                                                    {metaParts.join(' · ')}
                                                </div>
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PodcastBrowseSurface;
