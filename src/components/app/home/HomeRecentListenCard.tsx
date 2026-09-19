import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import type { SongResult } from '../../../types';
import { useSearchNavigationStore } from '../../../stores/useSearchNavigationStore';
import { useRecentListenShelf } from '../../../hooks/useRecentListenShelf';
import { greetingI18nKey } from '../../../utils/home/greetingMath';
import { songFromPlayHistoryEntry } from '../../../utils/home/recentListenMath';
import {
    HOME_COVER_TILE_DECODE_PX,
    HOME_RECENT_LISTEN_HERO_CARD_CLASS,
    HOME_RECENT_LISTEN_HERO_GRID_CLASS,
    HOME_RECENT_LISTEN_SHELF_GRID_CLASS,
} from '../../../utils/home/discoveryRailMath';
import LazyCoverImage from '../../shared/LazyCoverImage';
import HomeShelfHeader from './HomeShelfHeader';

// src/components/app/home/HomeRecentListenCard.tsx
// Greeting plus four recent unique plays; drill-in opens play history.

type HomeRecentListenCardProps = {
    isDaylight: boolean;
    onPlaySong: (song: SongResult, playlistCtx?: SongResult[]) => void;
    variant?: 'shelf' | 'hero';
    className?: string;
};

const HomeRecentListenCard: React.FC<HomeRecentListenCardProps> = ({
    isDaylight,
    onPlaySong,
    variant = 'shelf',
    className = '',
}) => {
    const { t } = useTranslation();
    const setHomeViewTab = useSearchNavigationStore(state => state.setHomeViewTab);
    const { entries, loading } = useRecentListenShelf();

    if (loading || entries.length === 0) return null;

    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';
    const cardClass = isDaylight
        ? 'bg-white/80 border-black/10 text-zinc-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)]'
        : 'bg-white/10 border-white/15 text-white shadow-[0_8px_28px_rgba(0,0,0,0.22)]';
    const queue = entries.map(songFromPlayHistoryEntry);
    const isHero = variant === 'hero';
    const openHistory = () => setHomeViewTab('history');

    const tiles = entries.map((entry, index) => {
        const song = queue[index];
        return (
            <button
                key={`${entry.songId}-${entry.playedAt}`}
                type="button"
                onClick={() => onPlaySong(song, queue)}
                title={`${entry.songName} · ${entry.artist}`}
                className="group min-w-0 text-left"
            >
                <div className={`overflow-hidden ${isHero ? 'rounded-md aspect-[2/3]' : 'rounded-lg aspect-square'} ${isDaylight ? 'bg-black/5' : 'bg-white/8'}`}>
                    <LazyCoverImage
                        src={entry.coverUrl}
                        placeholderLabel={entry.songName}
                        placeholderArtist={entry.artist}
                        sizePx={HOME_COVER_TILE_DECODE_PX}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                </div>
                {isHero ? null : (
                    <div className="mt-1 min-w-0">
                        <div className="truncate text-[10px] font-medium">{entry.songName}</div>
                        <div className={`truncate text-[9px] ${muted}`}>{entry.artist}</div>
                    </div>
                )}
            </button>
        );
    });

    if (isHero) {
        return (
            <section className={`min-w-0 w-full shrink-0 ${HOME_RECENT_LISTEN_HERO_CARD_CLASS} ${className}`} data-app-ui-surface="home-recent-listen">
                <div className={`flex flex-col rounded-2xl border p-2.5 backdrop-blur-md ${cardClass}`}>
                    <button
                        type="button"
                        onClick={openHistory}
                        className="mb-1.5 flex min-w-0 items-end justify-between gap-2 text-left hover:opacity-80"
                    >
                        <div className="min-w-0">
                            <div className="inline-flex max-w-full items-center gap-0.5 truncate text-[15px] font-semibold tracking-tight">
                                <span className="truncate">{t(greetingI18nKey())}</span>
                                <ChevronRight size={16} className="shrink-0 opacity-45" />
                            </div>
                            <div className={`mt-0.5 truncate text-[11px] ${muted}`}>
                                {t('home.recentListenSubtitle')}
                            </div>
                        </div>
                    </button>
                    <div className={HOME_RECENT_LISTEN_HERO_GRID_CLASS}>
                        {tiles}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-3 shrink-0" data-app-ui-surface="home-recent-listen">
            <HomeShelfHeader
                title={t(greetingI18nKey())}
                subtitle={t('home.recentListenSubtitle')}
                isDaylight={isDaylight}
                onOpenAll={openHistory}
            />
            <div className={`${HOME_RECENT_LISTEN_SHELF_GRID_CLASS} rounded-2xl border p-2.5 backdrop-blur-md ${cardClass}`}>
                {tiles}
            </div>
        </section>
    );
};

export default HomeRecentListenCard;
