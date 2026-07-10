import type { NeteasePlaylist, NeteaseUser, OnlineMusicProviderId } from '../types';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { ONLINE_PROVIDER_ICON_URL } from './onlineProviderAssets';

// src/utils/onlineDefaultPlaylists.ts
// Synthetic playlists keep no-login providers at the same home hierarchy as logged-in ones.

const DEFAULT_CREATOR: NeteaseUser = {
    userId: 0,
    nickname: 'Lyra',
    avatarUrl: '',
};

export const COCO_DEFAULT_PLAYLIST_ID = -91002;
export const QISHUI_DEFAULT_PLAYLIST_ID = -91003;

type PeerDefaultProviderId = Extract<OnlineMusicProviderId, 'coco' | 'qishui'>;

const PEER_DEFAULT_META: Record<PeerDefaultProviderId, {
    id: number;
    name: string;
    description: string;
    coverImgUrl: string;
}> = {
    coco: {
        id: COCO_DEFAULT_PLAYLIST_ID,
        name: 'coco-免费',
        // Fallback only; UI prefers i18n key home.cocoDefaultDescription.
        description: '第三方免费 · 关键词搜索与试听',
        coverImgUrl: ONLINE_PROVIDER_ICON_URL.coco || '',
    },
    qishui: {
        id: QISHUI_DEFAULT_PLAYLIST_ID,
        name: '汽水音乐',
        // Fallback only; UI prefers i18n key home.qishuiDefaultDescription.
        description: '关键词搜索与试听',
        coverImgUrl: ONLINE_PROVIDER_ICON_URL.qishui || '',
    },
};

export const isProviderDefaultPlaylist = (playlist?: Pick<NeteasePlaylist, 'specialType' | 'id'> | null) =>
    playlist?.specialType === 'provider-default'
    || playlist?.id === COCO_DEFAULT_PLAYLIST_ID
    || playlist?.id === QISHUI_DEFAULT_PLAYLIST_ID;

export const createProviderDefaultPlaylist = (
    provider: PeerDefaultProviderId,
): NeteasePlaylist => {
    const meta = PEER_DEFAULT_META[provider];
    return {
        id: meta.id,
        name: meta.name,
        coverImgUrl: meta.coverImgUrl,
        trackCount: 0,
        playCount: 0,
        updateTime: 0,
        trackUpdateTime: 0,
        creator: DEFAULT_CREATOR,
        description: meta.description,
        specialType: 'provider-default',
        musicProvider: provider,
        providerPlaylistId: `default:${provider}`,
    };
};

export const buildEnabledDefaultPlaylists = (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
): NeteasePlaylist[] => {
    const playlists: NeteasePlaylist[] = [];
    if (enabledProviders.qishui) {
        playlists.push(createProviderDefaultPlaylist('qishui'));
    }
    if (enabledProviders.coco) {
        playlists.push(createProviderDefaultPlaylist('coco'));
    }
    return playlists;
};
