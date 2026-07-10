import React, { useMemo } from 'react';
import { Disc } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NeteasePlaylist, OnlineMusicProviderId } from '../../types';
import { OnlineProviderBadge } from '../shared/OnlineProviderBadge';
import { FreeSourceNotice } from '../shared/FreeSourceNotice';
import { isProviderDefaultPlaylist } from '../../utils/onlineDefaultPlaylists';
import { resolveOnlineProviderIconUrl } from '../../utils/onlineProviderAssets';
import { resolveHomeContentBottomPaddingClass } from '../app/home/homeSurfaceStyles';

// src/components/folia-grid/OnlineHomeFlatSurface.tsx
// Flat sectional home: peer-source entries stay separate from personal playlists.

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

/** Compact horizontal entry so peer sources do not dominate above-the-fold height. */
const PeerSourceCard: React.FC<{
    item: OnlineHomeFlatItem;
    isDaylight: boolean;
    onSelect: () => void;
}> = ({ item, isDaylight, onSelect }) => {
    const shell = isDaylight
        ? 'bg-white/55 border-white/70 shadow-[0_6px_18px_rgba(0,0,0,0.05)] hover:bg-white/75'
        : 'bg-white/[0.07] border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.24)] hover:bg-white/[0.11]';
    const metaTone = isDaylight ? 'text-black/42' : 'text-white/42';
    const titleTone = isDaylight ? 'text-black/88' : 'text-white/92';
    const iconUrl = resolveOnlineProviderIconUrl(item.musicProvider) || item.coverUrl;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group flex min-w-[200px] max-w-[280px] flex-1 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${shell}`}
        >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black">
                {iconUrl ? (
                    <img
                        src={iconUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                        <Disc size={18} className="opacity-25" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className={`truncate text-[13px] font-semibold leading-snug tracking-tight ${titleTone}`}>
                    {item.name}
                </div>
                {item.description ? (
                    <div className={`mt-0.5 truncate text-[11px] leading-snug ${metaTone}`}>
                        {item.description}
                    </div>
                ) : null}
            </div>
        </button>
    );
};

const PlaylistCard: React.FC<{
    item: OnlineHomeFlatItem;
    isDaylight: boolean;
    onSelect: () => void;
}> = ({ item, isDaylight, onSelect }) => {
    const shell = isDaylight
        ? 'bg-white/55 border-white/70 shadow-[0_8px_22px_rgba(0,0,0,0.05)] hover:bg-white/75 hover:shadow-[0_12px_28px_rgba(0,0,0,0.09)]'
        : 'bg-white/[0.07] border-white/10 shadow-[0_10px_26px_rgba(0,0,0,0.26)] hover:bg-white/[0.11] hover:shadow-[0_14px_32px_rgba(0,0,0,0.34)]';
    const metaTone = isDaylight ? 'text-black/42' : 'text-white/42';
    const titleTone = isDaylight ? 'text-black/88' : 'text-white/92';
    const coverWash = isDaylight
        ? 'from-transparent via-transparent to-black/[0.04]'
        : 'from-transparent via-transparent to-black/35';

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group relative text-left overflow-hidden rounded-[18px] border backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${shell}`}
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
                        <Disc size={28} className="opacity-25" />
                    </div>
                )}
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${coverWash}`} />
                {item.musicProvider ? (
                    <OnlineProviderBadge
                        provider={item.musicProvider}
                        variant="glass"
                        isDaylight={isDaylight}
                        className="absolute top-2 left-2 z-10"
                    />
                ) : null}
            </div>

            <div className={`px-2.5 pt-2 pb-2 min-w-0 ${isDaylight ? 'bg-white/35' : 'bg-white/[0.03]'}`}>
                <div className={`truncate text-[12px] font-semibold leading-snug tracking-tight ${titleTone}`}>
                    {item.name}
                </div>
                {item.description ? (
                    <div className={`mt-0.5 truncate text-[10px] leading-snug ${metaTone}`}>
                        {item.description}
                    </div>
                ) : (
                    <div className="mt-0.5 h-[10px]" />
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
    <div className="mb-2.5 flex items-baseline gap-2">
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

const PeerSourceRow: React.FC<{
    items: OnlineHomeFlatItem[];
    isDaylight: boolean;
    onSelectPlaylist: (item: OnlineHomeFlatItem) => void;
}> = ({ items, isDaylight, onSelectPlaylist }) => (
    <div className="flex flex-wrap gap-2.5">
        {items.map(item => (
            <PeerSourceCard
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2.5 md:gap-3">
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

    const showSpecialSection = moduleFilter === 'all' && specialItems.length > 0;
    const primaryItems = moduleFilter === 'all'
        ? libraryItems
        : items.filter(item => !isProviderDefaultPlaylist(item.raw));
    const showLikedSection = moduleFilter === 'all' && likedItems.length > 0;
    const showPrimarySection = moduleFilter !== 'all' || libraryItems.length > 0 || specialItems.length === 0;
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
            <div className="mx-auto max-w-6xl space-y-5">
                {showSpecialSection ? (
                    <section>
                        <SectionTitle
                            title={t('home.sectionPeerSources')}
                            isDaylight={isDaylight}
                            count={specialItems.length}
                        />
                        <FreeSourceNotice isDaylight={isDaylight} className="mb-2.5" compact />
                        <PeerSourceRow
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
