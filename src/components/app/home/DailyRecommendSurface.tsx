import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Play } from 'lucide-react';
import type { SongResult } from '../../../types';
import { fetchDailyRecommendSongs } from '../../../services/neteasePodcast';
import type { NeteaseUser } from '../../../types';
import OnlineProviderBadge from '../../shared/OnlineProviderBadge';

// src/components/app/home/DailyRecommendSurface.tsx
// Netease daily recommend song list opened from the sidebar.

type DailyRecommendSurfaceProps = {
    user: NeteaseUser | null;
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
    onRefreshUser?: () => void;
};

const DailyRecommendSurface: React.FC<DailyRecommendSurfaceProps> = ({
    isDaylight,
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const [songs, setSongs] = useState<SongResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needLogin, setNeedLogin] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    // Always hit the API; anonymous cookie often still returns dailySongs.
    // Only show login gate when the API explicitly returns 301/401/403.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        void fetchDailyRecommendSongs()
            .then((result) => {
                if (cancelled) return;
                if (result.needLogin) {
                    setNeedLogin(true);
                    setSongs([]);
                    setError(null);
                    return;
                }
                setNeedLogin(false);
                setSongs(result.songs);
                if (result.songs.length === 0 && result.message) {
                    setError(result.message);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : t('home.dailyRecommendLoadFailed'));
                    setSongs([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [reloadToken, t]);

    const muted = isDaylight ? 'text-black/45' : 'text-white/45';
    const rowHover = isDaylight ? 'hover:bg-black/[0.06]' : 'hover:bg-white/[0.07]';

    if (needLogin && !loading) {
        return (
            <div className={`flex h-full items-center justify-center px-6 text-sm ${muted}`}>
                {t('home.dailyRecommendLoginRequired')}
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex h-full items-center justify-center gap-2 text-sm ${muted}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('home.dailyRecommendLoading')}
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex h-full items-center justify-center px-6 text-sm ${muted}`}>
                {error}
            </div>
        );
    }

    if (songs.length === 0) {
        return (
            <div className={`flex h-full flex-col items-center justify-center gap-3 px-6 text-sm ${muted}`}>
                <div>{t('home.dailyRecommendEmpty')}</div>
                <button
                    type="button"
                    onClick={() => setReloadToken((n) => n + 1)}
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
            <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                    <div className="text-lg font-semibold tracking-tight">{t('home.dailyRecommendTitle')}</div>
                    <div className={`mt-1 text-xs ${muted}`}>{t('home.dailyRecommendSubtitle', { count: songs.length })}</div>
                </div>
                <button
                    type="button"
                    onClick={() => onPlaySong(songs[0], songs)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        isDaylight ? 'bg-black/10 text-black hover:bg-black/15' : 'bg-white/12 text-white hover:bg-white/18'
                    }`}
                >
                    <Play size={12} fill="currentColor" />
                    {t('home.playAll')}
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-[calc(var(--app-player-bar-height,72px)+16px)]">
                <ul className="space-y-0.5">
                    {songs.map((song, index) => (
                        <li key={`${song.id}-${index}`}>
                            <button
                                type="button"
                                onClick={() => onPlaySong(song, songs)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${rowHover}`}
                            >
                                <span className={`w-6 shrink-0 text-center text-xs tabular-nums ${muted}`}>{index + 1}</span>
                                {song.album?.picUrl || song.al?.picUrl ? (
                                    <img
                                        src={song.album?.picUrl || song.al?.picUrl}
                                        alt=""
                                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                                    />
                                ) : (
                                    <div className={`h-10 w-10 shrink-0 rounded-md ${isDaylight ? 'bg-black/8' : 'bg-white/10'}`} />
                                )}
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
                                        {(song.artists || song.ar || []).map((a) => a.name).filter(Boolean).join(' / ') || '—'}
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DailyRecommendSurface;
