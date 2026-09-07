// services/lyrics-resolve/src/providers/types.ts
// Injectable provider ports for the Node resolve orchestrator.

import type { LyricData } from '@lyra/types';
import type { LyricsResolvePreferredSource } from '../schema';

export type ResolveCandidate = {
    id: number | string;
    name: string;
    artists: Array<{ id?: number; name: string }>;
    album?: { id?: number; name: string };
    duration?: number;
    dt?: number;
    ar?: Array<{ id?: number; name: string }>;
    al?: { id?: number; name: string };
    qqMid?: string;
    kgHash?: string;
};

export type FetchedLyricPayload = {
    lyrics: LyricData | null;
    isPureMusic?: boolean;
    matchScore?: number;
};

export type LyricSourcePort = {
    id: LyricsResolvePreferredSource;
    search: (query: string, limit: number) => Promise<ResolveCandidate[]>;
    fetchLyrics: (candidate: ResolveCandidate) => Promise<FetchedLyricPayload>;
};

export type AmllSourcePort = {
    fetchByPlatformId: (
        platform: 'ncm' | 'qq',
        musicId: number | string,
    ) => Promise<LyricData | null>;
};
