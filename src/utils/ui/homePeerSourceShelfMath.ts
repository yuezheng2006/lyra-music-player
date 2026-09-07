import type { SongResult } from '../../types';
import type { DailyRecommendSourceBucket } from '../../services/dailyRecommendService';
import type { OnlineMusicProviderId } from '../../types';
import {
    getOnlineSearchShortcutGroups,
    stripShortcutDisplayLabel,
    type OnlineSearchShortcutGroup,
} from '../onlineSearchShortcuts';

// src/utils/ui/homePeerSourceShelfMath.ts
// Flatten peer home tiles into inline shelves: picks from Today Picks, chips when empty.

export const PEER_SHELF_TRACK_LIMIT = 8;
export const PEER_SHELF_SHORTCUT_LIMIT = 6;
export const PEER_SHELF_SKELETON_COUNT = 5;

/** First N chart-matched picks for one peer channel. */
export const songsForPeerProvider = (
    sources: readonly DailyRecommendSourceBucket[],
    provider: OnlineMusicProviderId | undefined,
    limit = PEER_SHELF_TRACK_LIMIT,
): SongResult[] => {
    if (!provider) return [];
    const bucket = sources.find(source => source.provider === provider);
    if (!bucket) return [];
    return bucket.songs.slice(0, Math.max(limit, 0));
};

/** Flatten shortcut groups into a short chip list, first unique display label wins. */
export const flattenPeerShelfShortcuts = (
    groups: readonly OnlineSearchShortcutGroup[],
    limit = PEER_SHELF_SHORTCUT_LIMIT,
): string[] => {
    const seen = new Set<string>();
    const queries: string[] = [];
    for (const group of groups) {
        for (const query of group.queries) {
            const label = stripShortcutDisplayLabel(query).trim().toLowerCase();
            if (!label || seen.has(label)) continue;
            seen.add(label);
            queries.push(query);
            if (queries.length >= limit) return queries;
        }
    }
    return queries;
};

export const peerShelfShortcutsForProvider = (
    provider: OnlineMusicProviderId | string | null | undefined,
    limit = PEER_SHELF_SHORTCUT_LIMIT,
): string[] => flattenPeerShelfShortcuts(getOnlineSearchShortcutGroups(provider), limit);

export const peerShelfSongArtist = (song: SongResult): string =>
    (song.artists || song.ar || []).map(item => item.name).filter(Boolean).join(' / ');

export const peerShelfCoverUrl = (song: SongResult): string =>
    song.al?.picUrl || song.album?.picUrl || '';
