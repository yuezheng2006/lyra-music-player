import type { NeteasePlaylist, NeteaseUser, OnlineMusicProviderId } from '../types';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { ONLINE_PROVIDER_ICON_URL } from './onlineProviderAssets';
import { isPeerFreeProviderId, type PeerFreeProviderId } from './onlinePeerProviders';

// src/utils/onlineDefaultPlaylists.ts
// Synthetic playlists keep no-login providers at the same home hierarchy as logged-in ones.

const DEFAULT_CREATOR: NeteaseUser = {
    userId: 0,
    nickname: 'Lyra',
    avatarUrl: '',
};

export const COCO_DEFAULT_PLAYLIST_ID = -91002;
export const QISHUI_DEFAULT_PLAYLIST_ID = -91003;
export const KUGOU_DEFAULT_PLAYLIST_ID = -91004;
export const BILIBILI_DEFAULT_PLAYLIST_ID = -91005;

type PeerDefaultProviderId = PeerFreeProviderId;

const PEER_DEFAULT_META: Record<PeerDefaultProviderId, {
    id: number;
    name: string;
    description: string;
    coverImgUrl: string;
}> = {
    qishui: {
        id: QISHUI_DEFAULT_PLAYLIST_ID,
        name: '汽水音乐',
        description: '关键词搜索与试听',
        coverImgUrl: ONLINE_PROVIDER_ICON_URL.qishui || '',
    },
    coco: {
        id: COCO_DEFAULT_PLAYLIST_ID,
        name: 'coco-免费',
        description: '第三方免费 · 关键词搜索与试听',
        coverImgUrl: ONLINE_PROVIDER_ICON_URL.coco || '',
    },
    kugou: {
        id: KUGOU_DEFAULT_PLAYLIST_ID,
        name: '酷狗音乐',
        description: '关键词搜索与免费曲试听',
        coverImgUrl: ONLINE_PROVIDER_ICON_URL.kugou || '',
    },
    bilibili: {
        id: BILIBILI_DEFAULT_PLAYLIST_ID,
        name: '哔哩哔哩',
        description: '视频音频搜索与试听',
        coverImgUrl: ONLINE_PROVIDER_ICON_URL.bilibili || '',
    },
};

const PEER_DEFAULT_ID_TO_PROVIDER: Record<number, PeerDefaultProviderId> = {
    [QISHUI_DEFAULT_PLAYLIST_ID]: 'qishui',
    [COCO_DEFAULT_PLAYLIST_ID]: 'coco',
    [KUGOU_DEFAULT_PLAYLIST_ID]: 'kugou',
    [BILIBILI_DEFAULT_PLAYLIST_ID]: 'bilibili',
};

export const isProviderDefaultPlaylist = (playlist?: Pick<NeteasePlaylist, 'specialType' | 'id'> | null) =>
    playlist?.specialType === 'provider-default'
    || playlist?.id === COCO_DEFAULT_PLAYLIST_ID
    || playlist?.id === QISHUI_DEFAULT_PLAYLIST_ID
    || playlist?.id === KUGOU_DEFAULT_PLAYLIST_ID
    || playlist?.id === BILIBILI_DEFAULT_PLAYLIST_ID;

/** Resolve which peer channel a synthetic default card opens. */
export const resolveProviderDefaultChannel = (
    playlist?: Pick<NeteasePlaylist, 'musicProvider' | 'id' | 'specialType'> | null,
): PeerDefaultProviderId | null => {
    if (!playlist || !isProviderDefaultPlaylist(playlist)) {
        return null;
    }
    if (isPeerFreeProviderId(playlist.musicProvider)) {
        return playlist.musicProvider;
    }
    return PEER_DEFAULT_ID_TO_PROVIDER[playlist.id] || null;
};

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

const PEER_DEFAULT_ORDER: PeerDefaultProviderId[] = ['qishui', 'coco', 'kugou', 'bilibili'];

export const buildEnabledDefaultPlaylists = (
    enabledProviders: Partial<Record<OnlineLibraryProviderId, boolean>>,
): NeteasePlaylist[] =>
    PEER_DEFAULT_ORDER
        .filter(provider => enabledProviders[provider])
        .map(provider => createProviderDefaultPlaylist(provider));

export const resolvePeerDefaultDisplayName = (
    provider: OnlineMusicProviderId | string | undefined,
    t: (key: string) => string,
): string => {
    if (provider === 'qishui') return t('home.qishuiProvider');
    if (provider === 'coco') return t('home.cocoProvider');
    if (provider === 'kugou') return t('home.kugouProvider');
    if (provider === 'bilibili') return t('home.bilibiliProvider');
    return t('home.cocoProvider');
};

export const resolvePeerDefaultDescription = (
    provider: OnlineMusicProviderId | string | undefined,
    t: (key: string) => string,
): string => {
    if (provider === 'qishui') return t('home.qishuiDefaultDescription');
    if (provider === 'coco') return t('home.cocoDefaultDescription');
    if (provider === 'kugou') return t('home.kugouDefaultDescription');
    if (provider === 'bilibili') return t('home.bilibiliDefaultDescription');
    return t('home.cocoDefaultDescription');
};
