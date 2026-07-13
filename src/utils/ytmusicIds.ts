// src/utils/ytmusicIds.ts
// Stable numeric SongResult.id from YouTube videoId (same hash style as local songs).

/** Hash a YTM videoId into a negative safe integer id. */
export function getYtmSongId(videoId: string): number {
    const key = `ytm:${videoId}`;
    let h1 = 0x811c9dc5;
    let h2 = 0x811c9dc5;

    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        h1 ^= char;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= char;
        h2 = Math.imul(h2, 0x10a9055);
    }

    const high = (h1 & 0x1fffff) * 0x100000000;
    const low = h2 >>> 0;
    const combined = high + low;
    return combined === 0 ? -2 : -combined;
}
