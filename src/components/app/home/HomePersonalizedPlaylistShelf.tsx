import React from 'react';
import { useTranslation } from 'react-i18next';
import type { NeteasePlaylist, NeteaseUser } from '../../../types';
import { hasNeteaseSession } from '../../../utils/onlineLibraryAccess';
import { useOnlineLibraryFilterStore } from '../../../stores/useOnlineLibraryFilterStore';
import { usePersonalizedPlaylists } from '../../../hooks/usePersonalizedPlaylists';
import {
    formatCompactPlayCount,
    personalizedItemToPlaylist,
} from '../../../utils/home/personalizedPlaylistMath';
import HomePortraitPlaylistCard from './HomePortraitPlaylistCard';
import HomeShelfHeader from './HomeShelfHeader';

// src/components/app/home/HomePersonalizedPlaylistShelf.tsx
// NetEase personalized playlists; only after a NetEase session.

type HomePersonalizedPlaylistShelfProps = {
    isDaylight: boolean;
    user: NeteaseUser | null;
    onSelectPlaylist?: (playlist: NeteasePlaylist) => void;
};

const HomePersonalizedPlaylistShelf: React.FC<HomePersonalizedPlaylistShelfProps> = ({
    isDaylight,
    user,
    onSelectPlaylist,
}) => {
    const { t } = useTranslation();
    const neteaseEnabled = useOnlineLibraryFilterStore(state => state.playlistProviders.netease !== false);
    const enabled = hasNeteaseSession(user) && neteaseEnabled && Boolean(onSelectPlaylist);
    const { items, loading } = usePersonalizedPlaylists(enabled);

    if (!enabled) return null;
    if (!loading && items.length === 0) return null;

    const muted = isDaylight ? 'text-zinc-500' : 'text-white/55';

    return (
        <section className="mt-3 shrink-0" data-app-ui-surface="home-personalized-playlists">
            <HomeShelfHeader
                title={t('home.personalizedPlaylistsTitle')}
                subtitle={t('home.personalizedPlaylistsSubtitle')}
                isDaylight={isDaylight}
            />
            {items.length === 0 ? (
                <div className={`text-[11px] ${muted}`}>{t('home.personalizedPlaylistsLoading')}</div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {items.map((item) => (
                        <HomePortraitPlaylistCard
                            key={item.id}
                            title={item.name}
                            coverUrl={item.coverUrl}
                            coverBadge={formatCompactPlayCount(item.playCount)}
                            isDaylight={isDaylight}
                            onSelect={() => onSelectPlaylist?.(personalizedItemToPlaylist(item, user))}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HomePersonalizedPlaylistShelf;
