import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NeteasePlaylist, OnlineMusicProviderId } from '../../types';
import { HomeShelfCard } from '../shared/HomeShelfCard';
import { resolveOnlineProviderIconUrl } from '../../utils/onlineProviderAssets';
import { isProviderDefaultPlaylist } from '../../utils/onlineDefaultPlaylists';
import { shouldShowHomePeerShortcuts } from '../../utils/ui/homePeerSectionMath';
import { resolveHomeContentBottomPaddingClass } from '../app/home/homeSurfaceStyles';

// src/components/folia-grid/OnlineHomeFlatSurface.tsx
// Flat sectional home: peer shortcuts stay demoted; personal playlists own the fold.

export type OnlineHomeFlatItem = {
    id: string | number;
    name: string;
    coverUrl?: string;
    trackCount?: number;
    description?: string;
    musicProvider?: OnlineMusicProviderId;
    raw: NeteasePlaylist;
};

type OnlineHomeFlatSurfaceProps = {
    items: OnlineHomeFlatItem[];
    isDaylight: boolean;
    hasFloatingPlayer?: boolean;
    moduleFilter: 'all' | 'created' | 'liked';
    onSelectPlaylist: (item: OnlineHomeFlatItem) => void;
    emptyMessage?: string;
};

const isLikedName = (item: OnlineHomeFlatItem) => {
    const name = item.name?.trim() || '';
    return name.includes('喜欢') || name.includes('红心') || name.includes('Favorite');
};

const SHELF_GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2.5 md:gap-3';

const chipShellClass = (isDaylight: boolean) => (
    isDaylight
        ? 'bg-black/[0.04] border-black/10 text-black/75 hover:bg-black/[0.07] hover:text-black'
        : 'bg-white/[0.06] border-white/12 text-white/80 hover:bg-white/[0.1] hover:text-white'
);

/** Compact platform entry: opens peer search without competing with「来源」pills. */
const PeerShortcutChip: React.FC<{
    item: OnlineHomeFlatItem;
    isDaylight: boolean;
    onSelect: () => void;
}> = ({ item, isDaylight, onSelect }) => {
    const iconUrl = resolveOnlineProviderIconUrl(item.musicProvider) || item.coverUrl;

    return (
        <button
            type="button"
            onClick={onSelect}
            title={item.description || item.name}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors active:scale-[0.97] ${chipShellClass(isDaylight)}`}
        >
            {iconUrl ? (
                <img
                    src={iconUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-[3px] object-cover shrink-0"
                />
            ) : null}
            <span className="max-w-[7.5rem] truncate">{item.name}</span>
        </button>
    );
};

const PlaylistCard: React.FC<{
    item: OnlineHomeFlatItem;
    isDaylight: boolean;
    onSelect: () => void;
}> = ({ item, isDaylight, onSelect }) => (
    <HomeShelfCard
        title={item.name}
        subtitle={item.description}
        coverUrl={item.coverUrl}
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

const PeerShortcutRow: React.FC<{
    items: OnlineHomeFlatItem[];
    isDaylight: boolean;
    onSelectPlaylist: (item: OnlineHomeFlatItem) => void;
}> = ({ items, isDaylight, onSelectPlaylist }) => (
    <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
            <PeerShortcutChip
                key={`${item.musicProvider || 'netease'}-${item.id}`}
                item={item}
                isDaylight={isDaylight}
                onSelect={() => onSelectPlaylist(item)}
            />
        ))}
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

export const OnlineHomeFlatSurface: React.FC<OnlineHomeFlatSurfaceProps> = ({
    items,
    isDaylight,
    hasFloatingPlayer = false,
    moduleFilter,
    onSelectPlaylist,
    emptyMessage,
}) => {
    const { t } = useTranslation();

    const specialItems = useMemo(
        () => items.filter(item => isProviderDefaultPlaylist(item.raw)),
        [items],
    );
    const likedItems = useMemo(
        () => items.filter(item => !isProviderDefaultPlaylist(item.raw) && isLikedName(item)),
        [items],
    );
    const libraryItems = useMemo(
        () => items.filter(item => !isProviderDefaultPlaylist(item.raw) && !isLikedName(item)),
        [items],
    );

    const personalItemCount = libraryItems.length + likedItems.length;
    const showPeerShortcuts = moduleFilter === 'all'
        && shouldShowHomePeerShortcuts(specialItems.length, personalItemCount);
    const primaryItems = moduleFilter === 'all'
        ? libraryItems
        : items.filter(item => !isProviderDefaultPlaylist(item.raw));
    const showLikedSection = moduleFilter === 'all' && likedItems.length > 0;
    const showPrimarySection = moduleFilter !== 'all'
        || libraryItems.length > 0
        || specialItems.length === 0;
    const primaryTitle = moduleFilter === 'liked'
        ? t('home.sectionLiked')
        : t('home.sectionPlaylists');

    return (
        <div
            className={`custom-scrollbar h-full min-h-0 w-full overflow-y-auto overscroll-contain px-4 md:px-8 ${
                resolveHomeContentBottomPaddingClass(hasFloatingPlayer)
            }`}
            data-app-ui-surface="home-playlists"
        >
            <div className="mx-auto max-w-6xl space-y-4">
                {showPeerShortcuts ? (
                    <section>
                        <SectionTitle
                            title={t('home.sectionPeerShortcuts')}
                            isDaylight={isDaylight}
                            count={specialItems.length}
                        />
                        <PeerShortcutRow
                            items={specialItems}
                            isDaylight={isDaylight}
                            onSelectPlaylist={onSelectPlaylist}
                        />
                    </section>
                ) : null}

                {showPrimarySection ? (
                    <section>
                        <SectionTitle
                            title={primaryTitle}
                            isDaylight={isDaylight}
                            count={primaryItems.length}
                        />
                        <PlaylistGrid
                            items={primaryItems}
                            isDaylight={isDaylight}
                            onSelectPlaylist={onSelectPlaylist}
                            emptyMessage={emptyMessage}
                        />
                    </section>
                ) : null}

                {showLikedSection ? (
                    <section>
                        <SectionTitle
                            title={t('home.sectionLiked')}
                            isDaylight={isDaylight}
                            count={likedItems.length}
                        />
                        <PlaylistGrid
                            items={likedItems}
                            isDaylight={isDaylight}
                            onSelectPlaylist={onSelectPlaylist}
                        />
                    </section>
                ) : null}
            </div>
        </div>
    );
};

export default OnlineHomeFlatSurface;
