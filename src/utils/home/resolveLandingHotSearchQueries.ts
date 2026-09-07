import { getOnlineSearchShortcutGroups } from '../onlineSearchShortcuts';

// src/utils/home/resolveLandingHotSearchQueries.ts
// Compact Coco-style hot queries for the search landing. Not the overlay dump.

const LANDING_HOT_SEARCH_LIMIT = 5;

const FALLBACK_LANDING_HOT_SEARCHES = [
    '周杰伦',
    '林俊杰',
    '陈奕迅',
    '邓紫棋',
    '五月天',
] as const;

const compactQueries = (queries: readonly string[], limit: number): string[] => {
    const next: string[] = [];
    for (const query of queries) {
        if (next.length >= limit) break;
        if (!query.trim()) continue;
        next.push(query);
    }
    return next;
};

/** One row of landing chips. Bilibili keeps UP shortcuts; everyone else gets artist names. */
export const resolveLandingHotSearchQueries = (
    provider?: string | null,
): readonly string[] => {
    if (provider === 'bilibili') {
        const groups = getOnlineSearchShortcutGroups('bilibili');
        return compactQueries(groups.flatMap(group => [...group.queries]), LANDING_HOT_SEARCH_LIMIT);
    }

    if (provider === 'qishui') {
        const artists = getOnlineSearchShortcutGroups('qishui').find(group => group.id === 'artist');
        const queries = compactQueries(artists?.queries ?? [], LANDING_HOT_SEARCH_LIMIT);
        return queries.length > 0 ? queries : FALLBACK_LANDING_HOT_SEARCHES;
    }

    return FALLBACK_LANDING_HOT_SEARCHES;
};
