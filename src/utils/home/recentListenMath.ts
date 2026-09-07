import type { SongResult } from '../../types';
import { stripExpiringYoutubeStream, type PlayHistoryEntry } from '../../services/playHistoryService';

// src/utils/home/recentListenMath.ts
// Unique recent plays for the signed-in greeting card, preferring songs off the desk.

export const RECENT_LISTEN_LIMIT = 4;

export const pickRecentListenEntries = (
    history: readonly PlayHistoryEntry[],
    options?: {
        limit?: number;
        excludeSongIds?: Array<string | number>;
    },
): PlayHistoryEntry[] => {
    const limit = options?.limit ?? RECENT_LISTEN_LIMIT;
    const exclude = new Set((options?.excludeSongIds ?? []).map(String));
    const unique: PlayHistoryEntry[] = [];
    const seen = new Set<string>();
    for (const entry of history) {
        const id = String(entry.songId);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        unique.push(entry);
    }

    const preferred = unique.filter(entry => !exclude.has(String(entry.songId)));
    if (preferred.length >= limit) return preferred.slice(0, limit);
    const preferredIds = new Set(preferred.map(entry => String(entry.songId)));
    const fill = unique.filter(entry => !preferredIds.has(String(entry.songId)));
    return [...preferred, ...fill].slice(0, limit);
};

export const songFromPlayHistoryEntry = (entry: PlayHistoryEntry): SongResult => {
    const snapshot = stripExpiringYoutubeStream(entry.songSnapshot);
    if (snapshot && typeof snapshot === 'object') {
        return snapshot as SongResult;
    }

    const artists = entry.artist
        .split(', ')
        .map((name, index) => ({ id: index, name }))
        .filter(artist => artist.name);
    const album = {
        id: 0,
        name: entry.album || '',
        picUrl: entry.coverUrl,
    };
    const numericId = Number(entry.songId);
    return {
        id: Number.isFinite(numericId) ? numericId : 0,
        name: entry.songName,
        artists,
        ar: artists,
        album,
        al: album,
        duration: 0,
        musicProvider: entry.source === 'local' ? undefined : entry.source as SongResult['musicProvider'],
    };
};
