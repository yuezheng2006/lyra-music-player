import type { SongResult } from '../../types';

// src/utils/playback/catalogClipMath.ts
// Catalog-side clip/preview detection (title + listed duration). Not the loaded audio stream.

/** Known durations under this are clip/preview audio, not a full play. */
export const CATALOG_CLIP_MAX_DURATION_MS = 60_000;

export const CLIP_TITLE_RE = /30\s*秒|60\s*秒|30\s*s(?:ec)?\b|试听|预览|片段|剪辑|\bpreview\b|\bclip\b/i;

/** Normalize adapter duration (ms, or seconds leaked as a small integer). */
export const catalogDurationMs = (song: Pick<SongResult, 'duration' | 'dt'>): number => {
    const raw = Number(song.dt || song.duration || 0);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return raw < 10_000 ? raw * 1000 : raw;
};

/** True when the listing itself is a 30s trial / clip, not a full track. */
export const isCatalogClipTrack = (song: Pick<SongResult, 'name' | 'alia' | 'duration' | 'dt'>): boolean => {
    const name = String(song.name || '');
    if (CLIP_TITLE_RE.test(name)) return true;
    const alia = Array.isArray(song.alia) ? song.alia.join(' ') : '';
    if (alia && CLIP_TITLE_RE.test(alia)) return true;
    const durationMs = catalogDurationMs(song);
    return durationMs > 0 && durationMs < CATALOG_CLIP_MAX_DURATION_MS;
};

export const isCatalogFullTrack = (song: Pick<SongResult, 'name' | 'alia' | 'duration' | 'dt'>): boolean =>
    !isCatalogClipTrack(song);
