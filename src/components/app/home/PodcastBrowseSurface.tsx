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
import OnlineProviderBadge from '../../shared/OnlineProviderBadge';
import { resolveHomeContentBottomPaddingClass } from './homeSurfaceStyles';

// src/components/app/home/PodcastBrowseSurface.tsx
// Sidebar podcast surface: hot/search radios → episode list → play.

type PodcastBrowseSurfaceProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
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
    const cardBg = isDaylight
        ? 'bg-white border border-black/8 hover:border-black/14 shadow-sm'
        : 'bg-[#1a1a1e] border border-white/8 hover:border-white/14';
    const rowHover = isDaylight ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.06]';

    const loadHot = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await fetchHotPodcasts(24, 0);
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
            const list = await searchPodcasts(q, 24);
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
                            <OnlineProviderBadge
                                provider="netease"
                                size="sm"
                                variant="glass"
                                isDaylight={isDaylight}
                                className="shrink-0"
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
                            className={`w-full rounded-full border border-white/10 py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20 ${inputBg}`}
                            style={{ color: 'var(--text-primary)' }}
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
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${rowHover}`}
                                    >
                                        <span className={`w-6 shrink-0 text-center text-xs tabular-nums ${muted}`}>
                                            {song.serialNum || index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <div className="truncate text-sm font-medium">{song.name}</div>
                                                <OnlineProviderBadge
                                                    provider={song.musicProvider || 'netease'}
                                                    size="sm"
                                                    variant="glass"
                                                    isDaylight={isDaylight}
                                                    className="shrink-0"
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
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {radios.map((radio) => (
                                <button
                                    key={radio.id}
                                    type="button"
                                    onClick={() => void openRadio(radio)}
                                    className={`overflow-hidden rounded-2xl text-left transition-colors ${cardBg}`}
                                >
                                    {radio.cover ? (
                                        <img src={radio.cover} alt="" className="aspect-square w-full object-cover" />
                                    ) : (
                                        <div className={`aspect-square w-full ${isDaylight ? 'bg-black/8' : 'bg-white/10'}`} />
                                    )}
                                    <div className="p-2.5">
                                        <div className="flex items-start justify-between gap-1.5">
                                            <div className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">{radio.name}</div>
                                            <OnlineProviderBadge
                                                provider="netease"
                                                size="sm"
                                                variant="glass"
                                                isDaylight={isDaylight}
                                                className="mt-0.5 shrink-0"
                                            />
                                        </div>
                                        <div className={`mt-1 truncate text-[11px] ${muted}`}>
                                            {radio.djName || t('home.podcastEpisodes', { count: radio.programCount })}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PodcastBrowseSurface;
