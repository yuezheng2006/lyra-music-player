import { neteaseApi } from './netease';
import {
    mapPersonalizedPlaylistResult,
    PERSONALIZED_PLAYLIST_LIMIT,
    type PersonalizedPlaylistItem,
} from '../utils/home/personalizedPlaylistMath';

// src/services/personalizedPlaylistService.ts
// Load NetEase personalized playlists for the signed-in home shelf.

const CACHE_TTL_MS = 30 * 60 * 1000;

let cachedItems: PersonalizedPlaylistItem[] | null = null;
let cachedAt = 0;
let inflight: Promise<PersonalizedPlaylistItem[]> | null = null;

export const fetchPersonalizedPlaylists = async (
    options?: { force?: boolean; limit?: number },
): Promise<PersonalizedPlaylistItem[]> => {
    const fresh = !options?.force
        && cachedItems
        && Date.now() - cachedAt < CACHE_TTL_MS;
    if (fresh && cachedItems) return cachedItems;
    if (inflight) return inflight;

    const request = (async () => {
        try {
            const raw = await neteaseApi.getPersonalizedPlaylists(
                options?.limit ?? PERSONALIZED_PLAYLIST_LIMIT,
            );
            const items = mapPersonalizedPlaylistResult(raw).slice(
                0,
                options?.limit ?? PERSONALIZED_PLAYLIST_LIMIT,
            );
            cachedItems = items;
            cachedAt = Date.now();
            return items;
        } finally {
            inflight = null;
        }
    })();

    inflight = request;
    return request;
};
