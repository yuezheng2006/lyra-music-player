import type { SongResult } from '../../types';
import {
    CATALOG_CLIP_MAX_DURATION_MS,
    catalogDurationMs,
    isCatalogFullTrack,
} from '../playback/catalogClipMath';
import { HOME_PLAYLIST_SHELF_GRID_CLASS } from './discoveryRailMath';

// src/utils/home/listeningDeskMath.ts
// Mixed picks become a Folia-like cover mosaic the guest can play immediately.

/** Logged-in home keeps one dense row of compact covers. */
export const LISTENING_DESK_STRIP = 10;
/** Guest home fills the stage with a cover field, not a postage-stamp bento. */
export const LISTENING_DESK_STAGE = 18;
export const LISTENING_DESK_MOSAIC = LISTENING_DESK_STAGE;

export const LISTENING_DESK_SKELETON = LISTENING_DESK_STRIP;

/** Guest home is a cover field; logged-in home keeps a strip. */
export type ListeningDeskFieldMode = 'strip' | 'stage';

export const listeningDeskMosaicLimit = (mode: ListeningDeskFieldMode): number => (
    mode === 'stage' ? LISTENING_DESK_STAGE : LISTENING_DESK_STRIP
);

export const listeningDeskFieldClass = (mode: ListeningDeskFieldMode): string => (
    mode === 'stage'
        ? 'grid h-full min-h-0 w-full grid-cols-3 gap-2 overflow-y-auto [grid-auto-rows:minmax(0,1fr)] sm:grid-cols-4 lg:grid-cols-6'
        : HOME_PLAYLIST_SHELF_GRID_CLASS
);

export const listeningDeskTileClass = (mode: ListeningDeskFieldMode, _index = 0): string => (
    mode === 'stage' ? 'min-h-0' : 'aspect-square'
);

/** Known durations under this are clip/preview audio, not a desk play. */
export const LISTENING_DESK_MIN_DURATION_MS = CATALOG_CLIP_MAX_DURATION_MS;

export const listeningDeskArtist = (song: SongResult | null | undefined): string =>
    (song?.artists || song?.ar || []).map(item => item.name).filter(Boolean).join(' / ');

export const listeningDeskCoverUrl = (song: SongResult | null | undefined): string =>
    song?.al?.picUrl || song?.album?.picUrl || '';

/** Normalize adapter duration (ms, or seconds leaked as a small integer). */
export const listeningDeskDurationMs = catalogDurationMs;

/** Desk tiles must be full tracks — drop 30s trials, video clips, and preview titles. */
export const isListeningDeskFullTrack = isCatalogFullTrack;

export const keepListeningDeskFullTracks = (songs: readonly SongResult[]): SongResult[] =>
    songs.filter(isListeningDeskFullTrack);

export const splitListeningDeskSongs = (
    songs: readonly SongResult[],
    limit: number = LISTENING_DESK_STAGE,
) => {
    const mosaic = keepListeningDeskFullTracks(songs).slice(0, limit);
    return {
        hero: mosaic[0] ?? null,
        mosaic,
    };
};
