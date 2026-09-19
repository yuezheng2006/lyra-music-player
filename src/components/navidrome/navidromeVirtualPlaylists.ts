import type { TFunction } from 'i18next';
import { navidromeApi } from '../../services/navidromeService';
import type { NavidromeConfig, SubsonicSong } from '../../types/navidrome';
import { createCoverPlaceholder, pickRandomSongCoverUrl } from '../../utils/coverPlaceholders';

// src/components/navidrome/navidromeVirtualPlaylists.ts
// Shared virtual playlist cards for carousel and Grid3D Navidrome surfaces.

export const NAVIDROME_VIRTUAL_PLAYLIST_ID = {
    random: '__navi_random__',
    favorites: '__navi_favorites__',
    recentlyAdded: '__navi_recently_added__',
    recentlyPlayed: '__navi_recently_played__',
} as const;

export type NavidromeVirtualPlaylistKind = keyof typeof NAVIDROME_VIRTUAL_PLAYLIST_ID;

export type NavidromeVirtualPlaylistCard = {
    id: string;
    name: string;
    coverUrl?: string;
    trackCount?: number;
    description: string;
};

const ID_TO_KIND: Record<string, NavidromeVirtualPlaylistKind> = {
    [NAVIDROME_VIRTUAL_PLAYLIST_ID.random]: 'random',
    [NAVIDROME_VIRTUAL_PLAYLIST_ID.favorites]: 'favorites',
    [NAVIDROME_VIRTUAL_PLAYLIST_ID.recentlyAdded]: 'recentlyAdded',
    [NAVIDROME_VIRTUAL_PLAYLIST_ID.recentlyPlayed]: 'recentlyPlayed',
};

export const resolveNavidromeVirtualPlaylistKind = (
    id: string | number,
): NavidromeVirtualPlaylistKind | null => ID_TO_KIND[String(id)] ?? null;

export const buildNavidromeVirtualPlaylistCards = ({
    t,
    config,
    randomSongs,
    favoriteSongs,
}: {
    t: TFunction;
    config: NavidromeConfig | null;
    randomSongs: SubsonicSong[];
    favoriteSongs: SubsonicSong[];
}): NavidromeVirtualPlaylistCard[] => {
    const getCoverUrl = config
        ? (coverArtId: string, size?: number) => navidromeApi.getCoverArtUrl(config, coverArtId, size)
        : undefined;
    const randomLabel = t('navidrome.random') || 'Random';
    const favoritesLabel = t('navidrome.favorites') || 'Favorites';
    const recentlyAddedLabel = t('navidrome.recentlyAdded') || 'New';
    const recentsLabel = t('navidrome.recents') || 'Recently Played';

    return [
        {
            id: NAVIDROME_VIRTUAL_PLAYLIST_ID.random,
            name: randomLabel,
            coverUrl: (getCoverUrl && pickRandomSongCoverUrl(randomSongs, getCoverUrl, 600, 3))
                || createCoverPlaceholder(randomLabel, 'playlist'),
            trackCount: randomSongs.length,
            description: t('navidrome.randomDesc') || 'Instant random mix',
        },
        {
            id: NAVIDROME_VIRTUAL_PLAYLIST_ID.favorites,
            name: favoritesLabel,
            coverUrl: (getCoverUrl && pickRandomSongCoverUrl(favoriteSongs, getCoverUrl, 600, 3))
                || createCoverPlaceholder(favoritesLabel, 'playlist'),
            trackCount: favoriteSongs.length,
            description: t('navidrome.favoritesDesc') || 'Starred songs',
        },
        {
            id: NAVIDROME_VIRTUAL_PLAYLIST_ID.recentlyAdded,
            name: recentlyAddedLabel,
            coverUrl: createCoverPlaceholder(recentlyAddedLabel, 'playlist'),
            description: t('navidrome.recentlyAddedDesc') || 'Newest albums in the library',
        },
        {
            id: NAVIDROME_VIRTUAL_PLAYLIST_ID.recentlyPlayed,
            name: recentsLabel,
            coverUrl: createCoverPlaceholder(recentsLabel, 'playlist'),
            description: t('navidrome.recentsDesc') || 'Albums played recently',
        },
    ];
};

export const getNavidromeVirtualCollectionCopy = (
    kind: NavidromeVirtualPlaylistKind,
    t: TFunction,
): { title: string; subtitle: string } => {
    if (kind === 'favorites') {
        return {
            title: t('navidrome.favorites') || 'Favorites',
            subtitle: t('navidrome.favoritesDesc') || 'Starred songs',
        };
    }
    if (kind === 'recentlyAdded') {
        return {
            title: t('navidrome.recentlyAdded') || 'New',
            subtitle: t('navidrome.recentlyAddedDesc') || 'Newest albums in the library',
        };
    }
    if (kind === 'recentlyPlayed') {
        return {
            title: t('navidrome.recents') || 'Recently Played',
            subtitle: t('navidrome.recentsDesc') || 'Albums played recently',
        };
    }
    return {
        title: t('navidrome.random') || 'Random',
        subtitle: t('navidrome.randomDesc') || 'Instant random mix',
    };
};
