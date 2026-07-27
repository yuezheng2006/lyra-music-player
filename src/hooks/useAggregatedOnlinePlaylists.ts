import { useMemo } from 'react';
import type { NeteasePlaylist } from '../types';
import type {
    OnlineLibraryModuleFilter,
    OnlineLibraryProviderId,
} from '../stores/useOnlineLibraryFilterStore';
import { buildEnabledDefaultPlaylists, isProviderDefaultPlaylist } from '../utils/onlineDefaultPlaylists';
import { isPeerFreeProviderId } from '../utils/onlinePeerProviders';

// src/hooks/useAggregatedOnlinePlaylists.ts
// Merges Netease/QQ playlists with peer-provider defaults and applies filters.

type AggregatedPlaylistOptions = {
    neteasePlaylists: NeteasePlaylist[];
    qqPlaylists: NeteasePlaylist[];
    cloudPlaylist?: NeteasePlaylist | null;
    enabledProviders: Record<OnlineLibraryProviderId, boolean>;
    moduleFilter: OnlineLibraryModuleFilter;
};

const isLikedPlaylist = (playlist: NeteasePlaylist) => {
    // Peer defaults are search entry points, not personal liked playlists.
    if (isProviderDefaultPlaylist(playlist) || isPeerFreeProviderId(playlist.musicProvider)) {
        return false;
    }
    const name = playlist.name?.trim() || '';
    return name.includes('喜欢') || name.includes('红心') || name.includes('Favorite');
};

const isCreatedPlaylist = (playlist: NeteasePlaylist) => {
    if (playlist.specialType === 'cloud' || playlist.specialType === 'provider-default') {
        return false;
    }
    if (isLikedPlaylist(playlist)) {
        return false;
    }
    return true;
};

const playlistDedupKey = (playlist: NeteasePlaylist) => {
    if (playlist.musicProvider === 'qq') {
        return `qq:${playlist.providerPlaylistId || playlist.id}`;
    }
    if (isPeerFreeProviderId(playlist.musicProvider)) {
        return `${playlist.musicProvider}:${playlist.providerPlaylistId || playlist.id}`;
    }
    return `netease:${playlist.id}`;
};

export const aggregateOnlinePlaylists = ({
    neteasePlaylists,
    qqPlaylists,
    cloudPlaylist = null,
    enabledProviders,
    moduleFilter,
}: AggregatedPlaylistOptions) => {
    const neteaseItems = enabledProviders.netease
        ? neteasePlaylists.map(playlist => ({
            ...playlist,
            musicProvider: playlist.musicProvider ?? 'netease' as const,
        }))
        : [];
    const qqItems = enabledProviders.qq
        ? qqPlaylists.map(playlist => ({
            ...playlist,
            musicProvider: 'qq' as const,
        }))
        : [];

    const withCloud = enabledProviders.netease && cloudPlaylist
        ? [cloudPlaylist, ...neteaseItems]
        : neteaseItems;

    const defaults = buildEnabledDefaultPlaylists(enabledProviders);
    const merged = [...defaults, ...withCloud, ...qqItems];
    const deduped = new Map<string, NeteasePlaylist>();
    merged.forEach((playlist) => {
        const key = playlistDedupKey(playlist);
        if (!deduped.has(key)) {
            deduped.set(key, playlist);
        }
    });

    let filtered = Array.from(deduped.values());
    if (moduleFilter === 'liked') {
        filtered = filtered.filter(isLikedPlaylist);
    } else if (moduleFilter === 'created') {
        filtered = filtered.filter(isCreatedPlaylist);
    }

    return filtered;
};

export const useAggregatedOnlinePlaylists = (options: AggregatedPlaylistOptions) => {
    return useMemo(
        () => aggregateOnlinePlaylists(options),
        [
            options.cloudPlaylist,
            options.enabledProviders.bilibili,
            options.enabledProviders.coco,
            options.enabledProviders.kugou,
            options.enabledProviders.qishui,
            options.enabledProviders.netease,
            options.enabledProviders.qq,
            options.moduleFilter,
            options.neteasePlaylists,
            options.qqPlaylists,
        ],
    );
};
