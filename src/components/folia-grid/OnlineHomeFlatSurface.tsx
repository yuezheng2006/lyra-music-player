import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NeteaseUser } from '../../types';
import { HomeShelfCard } from '../shared/HomeShelfCard';
import { isProviderDefaultPlaylist } from '../../utils/onlineDefaultPlaylists';
import { formatCompactPlayCount } from '../../utils/home/personalizedPlaylistMath';
import { HOME_PLAYLIST_SHELF_GRID_CLASS } from '../../utils/home/discoveryRailMath';
import { resolveOnlineHomeLibrarySections } from '../../utils/home/onlineHomeLibraryMath';
import { resolveHomeContentBottomPaddingClass } from '../app/home/homeSurfaceStyles';
import type { OnlineHomeFlatItem } from './onlineHomeFlatTypes';

export type { OnlineHomeFlatItem } from './onlineHomeFlatTypes';

// src/components/folia-grid/OnlineHomeFlatSurface.tsx
// Personal playlist covers after login. Guest login lives on the discovery rail.

type OnlineHomeFlatSurfaceProps = {
    items: OnlineHomeFlatItem[];
    isDaylight: boolean;
    hasFloatingPlayer?: boolean;
    hasPersonalAccount?: boolean;
    user?: NeteaseUser | null;
    moduleFilter: 'all' | 'created' | 'liked';
    onSelectPlaylist: (item: OnlineHomeFlatItem) => void;
    onRefreshUser?: () => void;
    emptyMessage?: string;
};

const SHELF_GRID_CLASS = HOME_PLAYLIST_SHELF_GRID_CLASS;

const PlaylistCard: React.FC<{
    item: OnlineHomeFlatItem;
    isDaylight: boolean;
    onSelect: () => void;
}> = ({ item, isDaylight, onSelect }) => (
    <HomeShelfCard
        title={item.name}
        subtitle={item.description}
        coverUrl={item.coverUrl}
        coverBadge={formatCompactPlayCount(item.playCount ?? item.raw.playCount ?? 0)}
        placeholderVariant="playlist"
        provider={item.musicProvider}
        isDaylight={isDaylight}
        onSelect={onSelect}
    />
);

const SectionTitle: React.FC<{
    title: string;
    isDaylight: boolean;
    count?: number;
}> = ({
    title,
    isDaylight,
    count,
}) => (
    <div className="mb-2 flex items-baseline gap-2">
        <h2 className={`text-[14px] md:text-[15px] font-semibold tracking-tight ${isDaylight ? 'text-black/80' : 'text-white/88'}`}>
            {title}
        </h2>
        {typeof count === 'number' && count > 0 ? (
            <span className={`text-[11px] tabular-nums ${isDaylight ? 'text-black/30' : 'text-white/30'}`}>
                {count}
            </span>
        ) : null}
    </div>
);

const PlaylistGrid: React.FC<{
    items: OnlineHomeFlatItem[];
    isDaylight: boolean;
    onSelectPlaylist: (item: OnlineHomeFlatItem) => void;
    emptyMessage?: string;
}> = ({ items, isDaylight, onSelectPlaylist, emptyMessage }) => {
    const { t } = useTranslation();
    if (items.length === 0) {
        return (
            <div className={`py-8 text-sm ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                {emptyMessage || t('home.noFilteredPlaylists')}
            </div>
        );
    }

    return (
        <div className={SHELF_GRID_CLASS}>
            {items.map(item => (
                <PlaylistCard
                    key={`${item.musicProvider || 'netease'}-${item.id}`}
                    item={item}
                    isDaylight={isDaylight}
                    onSelect={() => onSelectPlaylist(item)}
                />
            ))}
        </div>
    );
};

const LIBRARY_SECTION_TITLE_KEY = {
    likedSongs: 'home.sectionLikedSongs',
    created: 'home.sectionCreatedPlaylists',
    collected: 'home.sectionCollectedPlaylists',
    liked: 'home.sectionLiked',
    playlists: 'home.sectionPlaylists',
} as const;

export const OnlineHomeFlatSurface: React.FC<OnlineHomeFlatSurfaceProps> = ({
    items,
    isDaylight,
    hasFloatingPlayer = false,
    user,
    moduleFilter,
    onSelectPlaylist,
    emptyMessage,
}) => {
    const { t } = useTranslation();

    const personalItems = useMemo(
        () => items.filter(item => !isProviderDefaultPlaylist(item.raw)),
        [items],
    );
    const sections = useMemo(
        () => resolveOnlineHomeLibrarySections(personalItems, {
            moduleFilter,
            userId: user?.userId,
        }),
        [moduleFilter, personalItems, user?.userId],
    );

    return (
        <div
            className={`w-full px-4 md:px-8 ${
                resolveHomeContentBottomPaddingClass(hasFloatingPlayer)
            }`}
            data-app-ui-surface="home-playlists"
        >
            <div className="mx-auto max-w-6xl space-y-4">
                {sections.map((section) => (
                    <section key={section.id}>
                        <SectionTitle
                            title={t(LIBRARY_SECTION_TITLE_KEY[section.titleKey])}
                            isDaylight={isDaylight}
                            count={section.items.length}
                        />
                        <PlaylistGrid
                            items={section.items}
                            isDaylight={isDaylight}
                            onSelectPlaylist={onSelectPlaylist}
                            emptyMessage={section.id === 'primary' ? emptyMessage : undefined}
                        />
                    </section>
                ))}
            </div>
        </div>
    );
};

export default OnlineHomeFlatSurface;
