import { useMemo } from 'react';
import type { NeteasePlaylist } from '../types';
import type {
    OnlineLibraryModuleFilter,
    OnlineLibraryProviderId,
} from '../stores/useOnlineLibraryFilterStore';
import { buildEnabledDefaultPlaylists } from '../utils/onlineDefaultPlaylists';

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
    if (
        playlist.specialType === 'provider-default'
        || playlist.musicProvider === 'coco'
        || playlist.musicProvider === 'qishui'
    ) {
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
        const key = playlist.musicProvider === 'qq'
            ? `qq:${playlist.providerPlaylistId || playlist.id}`
            : playlist.musicProvider === 'coco'
                ? `coco:${playlist.providerPlaylistId || playlist.id}`
                : playlist.musicProvider === 'qishui'
                    ? `qishui:${playlist.providerPlaylistId || playlist.id}`
                    : `netease:${playlist.id}`;
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
            options.enabledProviders.coco,
            options.enabledProviders.qishui,
            options.enabledProviders.netease,
            options.enabledProviders.qq,
            options.moduleFilter,
            options.neteasePlaylists,
            options.qqPlaylists,
        ],
    );
};
