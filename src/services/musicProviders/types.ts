import type { LyricData, OnlineMusicProviderId, SongResult } from '../../types';

// src/services/musicProviders/types.ts

export type ProviderAudioResult =
    | { kind: 'ok'; audioUrl: string; videoUrl?: string }
    | { kind: 'unavailable' };

export type MusicProviderSearchResult = {
    songs: SongResult[];
    total?: number;
    hasMore?: boolean;
};

export type MusicProvider = {
    id: OnlineMusicProviderId;
    search: (query: string, options: { limit: number; offset: number }) => Promise<MusicProviderSearchResult>;
    getAudioUrl: (song: SongResult, options: { quality: string }) => Promise<ProviderAudioResult>;
    getLyrics: (song: SongResult) => Promise<LyricData | null>;
};
