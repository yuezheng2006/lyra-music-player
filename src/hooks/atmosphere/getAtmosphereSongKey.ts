// src/hooks/atmosphere/getAtmosphereSongKey.ts
// Builds a stable cache key for atmosphere analysis per song/source pair.

export const getAtmosphereSongKey = (
    songId: number | string | null | undefined,
    audioSrc: string | null,
) => {
    if (songId == null && !audioSrc) return null;
    return `${songId ?? 'unknown'}::${audioSrc ?? 'no-src'}`;
};
