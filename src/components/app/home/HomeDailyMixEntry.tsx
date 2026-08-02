import React, { useEffect, useMemo } from 'react';
import { Loader2, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { SongResult } from '../../../types';
import {
    serializeDailyRecommendProviderKey,
    useDailyRecommendStore,
} from '../../../stores/useDailyRecommendStore';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import { useSearchNavigationStore } from '../../../stores/useSearchNavigationStore';
import LazyCoverImage from '../../shared/LazyCoverImage';

// src/components/app/home/HomeDailyMixEntry.tsx
// Compact Today Picks card on playlist home.

type HomeDailyMixEntryProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
};

const HomeDailyMixEntry: React.FC<HomeDailyMixEntryProps> = ({
    isDaylight,
    onPlaySong,
}) => {
    const { t } = useTranslation();
    const setHomeViewTab = useSearchNavigationStore((s) => s.setHomeViewTab);
    const playlistProviders = useOnlineLibraryFilterStore((s) => s.playlistProviders);
    const providerKey = serializeDailyRecommendProviderKey(playlistProviders);
    const {
        songs,
        loading,
        settled,
        ensureLoaded,
    } = useDailyRecommendStore(useShallow((s) => ({
        songs: s.songs,
        loading: s.loading,
        settled: s.settled,
        ensureLoaded: s.ensureLoaded,
    })));

    useEffect(() => {
        void ensureLoaded();
    }, [ensureLoaded, providerKey]);

    const preview = useMemo(() => songs.slice(0, 3), [songs]);
    const coverUrl = preview[0]?.al?.picUrl || preview[0]?.album?.picUrl || '';
    const cardClass = isDaylight
        ? 'bg-white/80 border-black/10 text-zinc-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)]'
        : 'bg-white/10 border-white/15 text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)]';
    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';
    const showEmptyHint = settled && !loading && songs.length === 0;
    const showLoading = loading && songs.length === 0;

    return (
        <div className={`rounded-2xl border backdrop-blur-md p-3.5 flex flex-col gap-3 min-h-[132px] ${cardClass}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className={`text-[10px] font-bold tracking-[0.14em] uppercase ${muted}`}>
                        Today Picks
                    </div>
                    <div className="mt-0.5 text-sm font-semibold truncate">
                        {t('home.dailyRecommendTitle') || '今日精选'}
                    </div>
                    <div className={`mt-0.5 text-[11px] ${muted}`}>
                        {showEmptyHint
                            ? (t('home.dailyRecommendLoginRequired') || '请先在平台推荐中开启至少一个音乐源')
                            : showLoading
                                ? (t('home.dailyRecommendLoading') || '正在加载…')
                                : t('home.dailyRecommendSubtitle', {
                                    count: songs.length,
                                    defaultValue: `来自已开启音乐源 · ${songs.length} 首`,
                                })}
                    </div>
                </div>
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/10">
                    {coverUrl ? (
                        <LazyCoverImage src={coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center opacity-40">
                            {showLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                        </div>
                    )}
                </div>
            </div>

            {preview.length > 0 && (
                <div className={`space-y-1 text-[11px] ${muted}`}>
                    {preview.map((song) => (
                        <div key={`${song.id}-${song.musicProvider || 'peer'}`} className="truncate">
                            {song.name}
                            <span className="opacity-60">
                                {' · '}
                                {(song.ar || song.artists || []).map((a) => a.name).filter(Boolean).join(' / ') || '—'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-auto flex items-center gap-2">
                <button
                    type="button"
                    disabled={songs.length === 0}
                    onClick={() => {
                        if (songs[0]) onPlaySong(songs[0], songs);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-black disabled:opacity-40"
                >
                    <Play size={12} fill="currentColor" />
                    {t('home.dailyMixPlay') || '播放'}
                </button>
                <button
                    type="button"
                    onClick={() => setHomeViewTab('daily')}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        isDaylight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/15'
                    }`}
                >
                    {t('home.dailyMixViewAll') || '查看全部'}
                </button>
            </div>
        </div>
    );
};

export default HomeDailyMixEntry;
