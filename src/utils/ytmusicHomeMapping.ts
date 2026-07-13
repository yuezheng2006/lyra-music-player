import type { YtmSearchTrack } from '../types/ytmusic';

// src/utils/ytmusicHomeMapping.ts
// Pure mappers for YTM home playlist items → browse tracks (tested in unit).

function asNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function pickThumbnailUrl(thumbnails: unknown): string | null {
    if (!Array.isArray(thumbnails) || thumbnails.length === 0) return null;
    const last = thumbnails[thumbnails.length - 1] as { url?: string } | string | null;
    if (!last) return null;
    if (typeof last === 'string') return last;
    return last.url || null;
}

function artistFromItem(item: Record<string, unknown>): string {
    if (Array.isArray(item.artists)) {
        const names = item.artists.map((a) => (a as { name?: string })?.name).filter(Boolean);
        if (names.length) return names.join(', ');
    }
    if (Array.isArray(item.authors)) {
        const names = item.authors.map((a) => (a as { name?: string })?.name).filter(Boolean);
        if (names.length) return names.join(', ');
    }
    const artist = item.artist as { name?: string } | undefined;
    const author = item.author as { name?: string } | undefined;
    return String(artist?.name || author?.name || '').trim() || 'Unknown';
}

function durationMsFromItem(item: Record<string, unknown>): number {
    const duration = item.duration as { seconds?: number; text?: string } | number | undefined;
    if (duration && typeof duration === 'object' && duration.seconds != null) {
        return asNumber(duration.seconds) * 1000;
    }
    if (typeof duration === 'number') {
        return duration < 10_000 ? duration * 1000 : duration;
    }
    if (item.duration_seconds != null) {
        return asNumber(item.duration_seconds) * 1000;
    }
    return 0;
}

/** Map a youtubei playlist / list item into a Lyra YTM browse track. */
export function mapYtmusicListItemToTrack(item: unknown): YtmSearchTrack | null {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const videoId = String(row.id || row.video_id || row.videoId || '').trim();
    if (!videoId) return null;

    const titleRaw = row.title;
    const title = String(
        (titleRaw && typeof titleRaw === 'object' && 'text' in titleRaw
            ? (titleRaw as { text?: string }).text
            : titleRaw) || '',
    ).trim() || videoId;

    const albumRaw = row.album as { name?: string } | string | null | undefined;
    const album = typeof albumRaw === 'string'
        ? albumRaw
        : (albumRaw?.name ? String(albumRaw.name) : null);

    const thumb = row.thumbnails
        ?? (row.thumbnail && typeof row.thumbnail === 'object'
            ? (row.thumbnail as { contents?: unknown }).contents
            : null);

    return {
        videoId,
        title,
        artist: artistFromItem(row),
        album,
        durationMs: durationMsFromItem(row),
        coverUrl: pickThumbnailUrl(thumb),
    };
}
