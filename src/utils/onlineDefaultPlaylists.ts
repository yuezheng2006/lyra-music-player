import type { NeteasePlaylist, NeteaseUser, OnlineMusicProviderId } from '../types';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';

// src/utils/onlineDefaultPlaylists.ts
// Synthetic playlists keep no-login providers at the same home hierarchy as logged-in ones.

const DEFAULT_CREATOR: NeteaseUser = {
    userId: 0,
    nickname: 'Lyra',
    avatarUrl: '',
};

export const COCO_DEFAULT_PLAYLIST_ID = -91002;

const COCO_DEFAULT_META = {
    id: COCO_DEFAULT_PLAYLIST_ID,
    name: 'Coco 聚合',
    // Fallback only; UI prefers i18n key home.cocoDefaultDescription.
    description: '公开聚合搜索与试听',
    coverImgUrl: 'data:image/svg+xml,' + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#D97706"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" fill="white" font-size="64" font-family="sans-serif" font-weight="700">Coco</text></svg>`,
    ),
};

export const isProviderDefaultPlaylist = (playlist?: Pick<NeteasePlaylist, 'specialType' | 'id'> | null) =>
    playlist?.specialType === 'provider-default'
    || playlist?.id === COCO_DEFAULT_PLAYLIST_ID;

export const createProviderDefaultPlaylist = (
    provider: Extract<OnlineMusicProviderId, 'coco'>,
): NeteasePlaylist => ({
    id: COCO_DEFAULT_META.id,
    name: COCO_DEFAULT_META.name,
    coverImgUrl: COCO_DEFAULT_META.coverImgUrl,
    trackCount: 0,
    playCount: 0,
    updateTime: 0,
    trackUpdateTime: 0,
    creator: DEFAULT_CREATOR,
    description: COCO_DEFAULT_META.description,
    specialType: 'provider-default',
    musicProvider: provider,
    providerPlaylistId: `default:${provider}`,
});

export const buildEnabledDefaultPlaylists = (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
): NeteasePlaylist[] => {
    if (!enabledProviders.coco) {
        return [];
    }
    return [createProviderDefaultPlaylist('coco')];
};
