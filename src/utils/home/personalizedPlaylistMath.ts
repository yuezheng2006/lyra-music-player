import type { NeteasePlaylist, NeteaseUser } from '../../types';

// src/utils/home/personalizedPlaylistMath.ts
// Map NetEase /personalized payloads into home shelf tiles.

export const PERSONALIZED_PLAYLIST_LIMIT = 9;

export type PersonalizedPlaylistItem = {
    id: number;
    name: string;
    coverUrl: string;
    playCount: number;
    trackCount: number;
    copywriter?: string;
};

type RawPersonalizedItem = {
    id?: number;
    name?: string;
    picUrl?: string;
    playCount?: number;
    trackCount?: number;
    copywriter?: string;
};

export const mapPersonalizedPlaylistResult = (raw: unknown): PersonalizedPlaylistItem[] => {
    const result = (raw as { result?: unknown } | null)?.result;
    if (!Array.isArray(result)) return [];
    return result.flatMap((item) => {
        const row = item as RawPersonalizedItem;
        const id = Number(row.id);
        const name = String(row.name || '').trim();
        if (!Number.isFinite(id) || id <= 0 || !name) return [];
        const copywriter = String(row.copywriter || '').trim();
        return [{
            id,
            name,
            coverUrl: String(row.picUrl || '').trim(),
            playCount: Number(row.playCount) || 0,
            trackCount: Number(row.trackCount) || 0,
            copywriter: copywriter || undefined,
        }];
    });
};

export const personalizedItemToPlaylist = (
    item: PersonalizedPlaylistItem,
    user: NeteaseUser | null,
): NeteasePlaylist => ({
    id: item.id,
    name: item.name,
    coverImgUrl: item.coverUrl,
    trackCount: item.trackCount,
    playCount: item.playCount,
    updateTime: 0,
    trackUpdateTime: 0,
    creator: user ?? { userId: 0, nickname: '', avatarUrl: '' },
    description: item.copywriter,
    musicProvider: 'netease',
});

export const formatCompactPlayCount = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return '';
    try {
        return new Intl.NumberFormat(undefined, {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
        }).format(value);
    } catch {
        return String(value);
    }
};
