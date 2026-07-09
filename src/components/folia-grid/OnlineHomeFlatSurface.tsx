import React, { useMemo } from 'react';
import { Disc } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NeteasePlaylist, OnlineMusicProviderId } from '../../types';
import { OnlineProviderBadge } from '../shared/OnlineProviderBadge';
import { isProviderDefaultPlaylist } from '../../utils/onlineDefaultPlaylists';

// src/components/folia-grid/OnlineHomeFlatSurface.tsx
// Flat sectional home: glass playlist cards aligned with filter chrome.

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

const PlaylistCard: React.FC<{
    item: OnlineHomeFlatItem;
    isDaylight: boolean;
    onSelect: () => void;
}> = ({ item, isDaylight, onSelect }) => {
    const shell = isDaylight
        ? 'bg-white/55 border-white/70 shadow-[0_10px_28px_rgba(0,0,0,0.06)] hover:bg-white/75 hover:shadow-[0_16px_36px_rgba(0,0,0,0.10)]'
        : 'bg-white/[0.07] border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.28)] hover:bg-white/[0.11] hover:shadow-[0_18px_40px_rgba(0,0,0,0.36)]';
    const metaTone = isDaylight ? 'text-black/42' : 'text-white/42';
    const titleTone = isDaylight ? 'text-black/88' : 'text-white/92';
    const coverWash = isDaylight
        ? 'from-transparent via-transparent to-black/[0.04]'
        : 'from-transparent via-transparent to-black/35';

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group relative text-left overflow-hidden rounded-[22px] border backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.985] ${shell}`}
        >
            <div className="relative aspect-square overflow-hidden">
                {item.coverUrl ? (
                    <img
                        src={item.coverUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                        loading="lazy"
                    />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center ${isDaylight ? 'bg-black/[0.04]' : 'bg-white/[0.04]'}`}>
                        <Disc size={34} className="opacity-25" />
                    </div>
                )}
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${coverWash}`} />
                {item.musicProvider ? (
                    <OnlineProviderBadge
                        provider={item.musicProvider}
                        variant="glass"
                        isDaylight={isDaylight}
                        className="absolute top-2.5 left-2.5 z-10"
                    />
                ) : null}
            </div>

            <div className={`px-3 pt-2.5 pb-3 min-w-0 ${isDaylight ? 'bg-white/35' : 'bg-white/[0.03]'}`}>
                <div className={`truncate text-[13px] font-semibold leading-snug tracking-tight ${titleTone}`}>
                    {item.name}
                </div>
                {item.description ? (
                    <div className={`mt-1 truncate text-[11px] leading-snug ${metaTone}`}>
                        {item.description}
                    </div>
                ) : (
                    <div className={`mt-1 h-[11px]`} />
                )}
            </div>
        </button>
    );
};

const SectionTitle: React.FC<{ title: string; isDaylight: boolean; count?: number }> = ({
    title,
    isDaylight,
    count,
}) => (
    <div className="mb-3.5 flex items-baseline gap-2">
        <h2 className={`text-[15px] md:text-base font-semibold tracking-tight ${isDaylight ? 'text-black/80' : 'text-white/88'}`}>
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
            <div className={`py-10 text-sm ${isDaylight ? 'text-black/40' : 'text-white/40'}`}>
                {emptyMessage || t('home.noFilteredPlaylists')}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(156px,1fr))] gap-3.5 md:gap-4">
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

    const likedItems = useMemo(
        () => items.filter(item => !isProviderDefaultPlaylist(item.raw) && isLikedName(item)),
        [items],
    );
    const libraryItems = useMemo(
        () => items.filter(item => isProviderDefaultPlaylist(item.raw) || !isLikedName(item)),
        [items],
    );

    const cocoOnly = items.length > 0 && items.every(item => item.musicProvider === 'coco' || isProviderDefaultPlaylist(item.raw));
    const primaryItems = moduleFilter === 'all' ? libraryItems : items;
    const showLikedSection = moduleFilter === 'all' && likedItems.length > 0 && !cocoOnly;
    const primaryTitle = cocoOnly
        ? t('home.sectionCoco')
        : (moduleFilter === 'liked' ? t('home.sectionLiked') : t('home.sectionPlaylists'));

    return (
        <div
            className={`custom-scrollbar h-full min-h-0 w-full overflow-y-auto px-4 md:px-8 ${
                hasFloatingPlayer ? 'pb-[calc(var(--app-player-bar-height,72px)+20px)]' : 'pb-12'
            }`}
        >
            <div className="mx-auto max-w-6xl space-y-9 pt-1">
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
