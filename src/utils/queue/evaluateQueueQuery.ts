import type { SongResult } from '../../types';
import { parseQueueQuery, type ParsedQueueQuery } from './parseQueueQuery';

// src/utils/queue/evaluateQueueQuery.ts
// Filters the play queue with the parsed command-palette DSL.

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const getArtistLabel = (song: SongResult) => {
    const artists = song.ar?.length ? song.ar : song.artists;
    return artists?.map(artist => artist.name).filter(Boolean).join(', ') || '';
};

const getAlbumLabel = (song: SongResult) => song.al?.name || song.album?.name || '';

export type QueueQueryMatch = {
    song: SongResult;
    index: number;
    score: number;
};

export const evaluateQueueQuery = (
    queue: readonly SongResult[],
    input: string,
): { parsed: ParsedQueueQuery; matches: QueueQueryMatch[] } => {
    const parsed = parseQueueQuery(input);
    const text = normalize(parsed.text);
    const facet = normalize(parsed.facetValue);

    const matches = queue.flatMap((song, index): QueueQueryMatch[] => {
        const oneBased = index + 1;
        if (parsed.index !== null && oneBased !== parsed.index) return [];
        if (parsed.range && (oneBased < parsed.range.from || oneBased > parsed.range.to)) return [];

        const artist = getArtistLabel(song);
        const album = getAlbumLabel(song);
        if (parsed.facetKind === 'artist' && facet && !normalize(artist).includes(facet)) return [];
        if (parsed.facetKind === 'album' && facet && !normalize(album).includes(facet)) return [];

        const haystack = normalize([
            String(oneBased),
            song.name,
            artist,
            album,
            ...(song.alia ?? []),
            ...(song.tns ?? []),
        ].filter(Boolean).join(' '));
        if (text && !haystack.includes(text)) return [];

        const starts = normalize(song.name).startsWith(text) || String(oneBased).startsWith(text);
        return [{ song, index, score: (starts ? 120 : 100) - index }];
    }).sort((left, right) => right.score - left.score);

    return { parsed, matches };
};
