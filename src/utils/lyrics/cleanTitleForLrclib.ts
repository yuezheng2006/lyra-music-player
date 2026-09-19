// src/utils/lyrics/cleanTitleForLrclib.ts
// Butler-style YouTube/dirty-title cleanup before LRCLib matching.

/**
 * Strips promotional parentheticals, feat tags, and artist prefixes so LRCLib
 * can match overseas catalog titles that come from YouTube or file names.
 */
export function cleanTitleForLrclib(title: string, artist = ''): string {
    if (!title) {
        return '';
    }

    let cleaned = title;
    const promo = '(?:official|video|music\\s*video|lyric(?:s)?|audio|hd|hq|4k|'
        + 'remaster.*?|live.*?|slowed.*?|sped.*?up|reverb|bass\\s*boost|'
        + 'remix|edit|mashup|cover|tiktok|extended|version)';

    cleaned = cleaned.replace(
        new RegExp(`\\s*[\\(\\[][^\\(\\)\\[\\]]*${promo}[^\\(\\)\\[\\]]*[\\)\\]]\\s*`, 'giu'),
        ' ',
    );
    cleaned = cleaned.replace(/\s*[\(\[][^\(\)\[\]]{0,40}[\)\]]\s*/gu, ' ');
    cleaned = cleaned.replace(
        /\s+(?:ft\.?|feat\.?|featuring|w\/|with)\s+[^\-–—,|]+/giu,
        '',
    );

    if (artist.trim()) {
        const escapedArtist = artist.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(
            new RegExp(`^\\s*${escapedArtist}\\s*[-–—:]\\s*`, 'iu'),
            '',
        );
    }

    cleaned = cleaned.replace(
        /\s+[-–—]\s+(slow.*|sped.*|remix|edit|mashup|version|cover|live).*$/iu,
        '',
    );

    return cleaned
        .replace(/\s+/gu, ' ')
        .replace(/^[\s\-–—:,\u2018\u2019\u201c\u201d"']+|[\s\-–—:,\u2018\u2019\u201c\u201d"']+$/gu, '')
        .trim();
}

/** Keeps the primary artist token for LRCLib queries. */
export function cleanArtistForLrclib(artist: string): string {
    if (!artist) {
        return '';
    }
    return artist
        .split(/\s+(?:ft\.?|feat\.?|featuring|with|x|&|,)\s+/iu)[0]
        ?.trim() || '';
}
