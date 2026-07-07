import type { SongResult } from '../../types';
import type { BeatMap } from '../../types/atmosphere';
import { isNavidromePlaybackSong, resolveNavidromePlaybackCarrier } from '../appPlaybackGuards';

// src/utils/atmosphere/resolveAtmosphereTrackHints.ts
// Extracts long-form atmosphere hints from the loose playback song model.

export type AtmosphereContentType = 'music' | 'podcast' | 'audiobook';

export interface AtmosphereTrackHints {
    contentType: AtmosphereContentType | null;
    precomputedBeatMap: BeatMap | null;
}

const isBeatMapLike = (value: unknown): value is BeatMap => {
    const candidate = value as Partial<BeatMap> | null | undefined;
    return Boolean(
        candidate
        && Array.isArray(candidate.beats)
        && Array.isArray(candidate.pulseBeats)
        && Array.isArray(candidate.cameraBeats)
        && typeof candidate.duration === 'number',
    );
};

const getContentType = (value: unknown): AtmosphereContentType | null => {
    if (value === 'podcast' || value === 'audiobook' || value === 'music') {
        return value;
    }
    if (typeof value === 'string' && value.toLowerCase().includes('podcast')) {
        return 'podcast';
    }
    return null;
};

export const resolveAtmosphereTrackHints = (
    song: SongResult | null | undefined,
): AtmosphereTrackHints => {
    const looseSong = song as (SongResult & {
        podcastDjBeatMap?: unknown;
        beatMap?: unknown;
        contentType?: unknown;
        type?: unknown;
    }) | null | undefined;
    const navidromeSong = isNavidromePlaybackSong(song)
        ? resolveNavidromePlaybackCarrier(song)
        : null;
    const navidromeData = navidromeSong?.navidromeData as {
        podcastDjBeatMap?: unknown;
        beatMap?: unknown;
        contentType?: unknown;
        type?: unknown;
        podcastRole?: unknown;
    } | undefined;

    const contentType = getContentType(looseSong?.type)
        || getContentType(looseSong?.contentType)
        || getContentType(navidromeData?.type)
        || getContentType(navidromeData?.contentType)
        || (navidromeData?.podcastRole === true ? 'podcast' : null);

    const beatMap = looseSong?.podcastDjBeatMap
        || looseSong?.beatMap
        || navidromeData?.podcastDjBeatMap
        || navidromeData?.beatMap
        || null;

    return {
        contentType,
        precomputedBeatMap: isBeatMapLike(beatMap) ? beatMap : null,
    };
};
