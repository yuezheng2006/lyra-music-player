import type { LyricProviderSource } from '../../types';

// src/utils/lyrics/lyricMatchPreferredSource.ts
// Resolve lyric-match priority, including Folia-style follow-current-platform.

export type LyricMatchPriority = LyricProviderSource | 'auto';

export const LYRIC_MATCH_PRIORITY_OPTIONS: readonly LyricMatchPriority[] = [
    'auto',
    'netease',
    'amll',
    'qq',
    'kugou',
];

export const isLyricMatchPriority = (value: unknown): value is LyricMatchPriority => (
    value === 'auto'
    || value === 'netease'
    || value === 'amll'
    || value === 'qq'
    || value === 'kugou'
    || value === 'lrclib'
);

/** Map the current playback/search provider onto a lyric match source. */
export const mapPlaybackProviderToLyricSource = (
    providerId: string | null | undefined,
): LyricProviderSource => {
    const id = String(providerId || '').trim().toLowerCase();
    if (id === 'qq') return 'qq';
    if (id === 'kugou') return 'kugou';
    return 'netease';
};

/** `auto` follows the current provider; explicit choices stay as stored. */
export const resolveLyricMatchPreferredSource = (
    priority: LyricMatchPriority | null | undefined,
    providerId: string | null | undefined,
): LyricProviderSource => {
    if (priority && priority !== 'auto' && priority !== 'lrclib') {
        return priority;
    }
    return mapPlaybackProviderToLyricSource(providerId);
};

export const resolveLyricMatchPreferredSourceForSong = (
    priority: LyricMatchPriority | null | undefined,
    song?: { musicProvider?: string | null } | null,
    fallbackProviderId?: string | null,
): LyricProviderSource => (
    resolveLyricMatchPreferredSource(priority, song?.musicProvider || fallbackProviderId)
);
