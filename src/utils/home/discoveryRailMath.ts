export type DiscoveryRailColumn =
    | 'desk-stage'
    | 'invite'
    | 'hero'
    | 'personalized'
    | 'charts';

// src/utils/home/discoveryRailMath.ts
// Signed-in 歌单 is browse (greeting, recommended playlists, charts). Play-now lives on 私人漫游.

export const SIGNED_IN_DISCOVERY_RAIL_COLUMNS: readonly DiscoveryRailColumn[] = [
    'hero',
    'personalized',
    'charts',
];

export const resolveDiscoveryRailColumns = (input: {
    signedIn: boolean;
    hasInvite: boolean;
}): DiscoveryRailColumn[] => {
    if (!input.signedIn) {
        return input.hasInvite ? ['desk-stage', 'invite'] : ['desk-stage'];
    }
    return [...SIGNED_IN_DISCOVERY_RAIL_COLUMNS];
};

/** Cover tiles stay postage-stamp sized; leftover row space stays empty. */
export const HOME_PLAYLIST_COVER_MIN_PX = 80;
export const HOME_PLAYLIST_COVER_MAX_PX = 88;
export const HOME_PLAYLIST_SHELF_GRID_CLASS =
    'grid grid-cols-[repeat(auto-fill,minmax(80px,88px))] justify-start gap-2';
/** Greeting recents are four slim vertical covers, like the iMusic middle card. */
export const HOME_RECENT_LISTEN_HERO_CARD_CLASS = 'max-w-[18rem]';
export const HOME_RECENT_LISTEN_HERO_GRID_CLASS = 'grid grid-cols-4 gap-1';
export const HOME_RECENT_LISTEN_SHELF_GRID_CLASS = 'grid grid-cols-4 gap-1.5';
export const HOME_COVER_TILE_DECODE_PX = 160;
