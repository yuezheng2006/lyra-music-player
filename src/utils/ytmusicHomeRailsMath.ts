import type { YtmHomeSection, YtmSearchTrack } from '../types/ytmusic';

// src/utils/ytmusicHomeRailsMath.ts
// Pure helpers for YTM home horizontal rails.

export const YTMUSIC_HOME_RAIL_VISIBLE_TRACKS = 16;

export type YtmusicHomeRailModel = {
    playlistId: string;
    title: string;
    coverUrl?: string | null;
    tracks: YtmSearchTrack[];
    visibleTracks: YtmSearchTrack[];
    hasMore: boolean;
};

/** Slice expanded home sections into rail models for the browse empty state. */
export function buildYtmusicHomeRails(
    sections: YtmHomeSection[],
    visibleLimit = YTMUSIC_HOME_RAIL_VISIBLE_TRACKS,
): YtmusicHomeRailModel[] {
    return sections
        .filter((section) => section.tracks?.length > 0)
        .map((section) => {
            const tracks = section.tracks;
            const limit = Math.max(1, visibleLimit);
            return {
                playlistId: section.playlistId,
                title: section.title,
                coverUrl: section.coverUrl,
                tracks,
                visibleTracks: tracks.slice(0, limit),
                hasMore: tracks.length > limit,
            };
        });
}
