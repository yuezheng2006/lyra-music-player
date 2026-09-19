// src/utils/queue/parseQueueQuery.ts
// Folia-style queue DSL: #index, ranges, artist:/album: facets, --remove/--next/--end.

export type QueueFacetKind = 'artist' | 'album';
export type QueueQueryAction = 'play' | 'remove' | 'next' | 'end';

export type ParsedQueueQuery = {
    text: string;
    index: number | null;
    range: { from: number; to: number } | null;
    facetKind: QueueFacetKind | null;
    facetValue: string;
    action: QueueQueryAction;
};

const RANGE_REGEX = /(?:^|\s)(\d+)\s*(?:\.\.|-|–|—)\s*(\d+)(?:\s|$)/;
const INDEX_REGEX = /(?:^|\s)#(\d+)(?:\s|$)/;
const FACET_REGEX = /(?:^|\s)@?(artist|album|a|al)\s*:\s*("([^"]+)"|(\S+))/i;

const normalizeQueueAction = (raw: string): QueueQueryAction => {
    const token = raw.toLowerCase();
    if (token === 'remove' || token === 'rm') return 'remove';
    if (token === 'next') return 'next';
    if (token === 'end') return 'end';
    return 'play';
};

const normalizeFacetKind = (raw: string): QueueFacetKind => (
    raw.toLowerCase() === 'album' || raw.toLowerCase() === 'al' ? 'album' : 'artist'
);

export const parseQueueQuery = (rawInput: string): ParsedQueueQuery => {
    let rest = rawInput.trim();
    let index: number | null = null;
    let range: ParsedQueueQuery['range'] = null;
    let facetKind: QueueFacetKind | null = null;
    let facetValue = '';
    let action: QueueQueryAction = 'play';
    const actionRegex = /(?:^|\s)--(remove|rm|next|end)(?=\s|$)/gi;

    rest = rest.replace(actionRegex, (_matched, token: string) => {
        action = normalizeQueueAction(token);
        return ' ';
    });

    const rangeMatch = rest.match(RANGE_REGEX);
    if (rangeMatch) {
        const from = Number(rangeMatch[1]);
        const to = Number(rangeMatch[2]);
        if (Number.isFinite(from) && Number.isFinite(to) && from > 0 && to > 0) {
            range = { from: Math.min(from, to), to: Math.max(from, to) };
            rest = `${rest.slice(0, rangeMatch.index)}${rest.slice((rangeMatch.index ?? 0) + rangeMatch[0].length)}`;
        }
    }

    const indexMatch = rest.match(INDEX_REGEX);
    if (indexMatch) {
        const parsed = Number(indexMatch[1]);
        if (Number.isFinite(parsed) && parsed > 0) {
            index = parsed;
            rest = `${rest.slice(0, indexMatch.index)}${rest.slice((indexMatch.index ?? 0) + indexMatch[0].length)}`;
        }
    }

    const facetMatch = rest.match(FACET_REGEX);
    if (facetMatch) {
        facetKind = normalizeFacetKind(facetMatch[1]);
        facetValue = (facetMatch[3] || facetMatch[4] || '').trim();
        rest = `${rest.slice(0, facetMatch.index)}${rest.slice((facetMatch.index ?? 0) + facetMatch[0].length)}`;
    }

    return {
        text: rest.replace(/\s+/g, ' ').trim(),
        index,
        range,
        facetKind,
        facetValue,
        action,
    };
};
