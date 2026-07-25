import type { OnlineMusicProviderId, SearchSourceId } from '../../types';

// src/utils/search/recentSearchHistory.ts

export type RecentSearchEntry = {
    query: string;
    displayQuery: string;
    searchedAt: number;
};

export type RecentSearchHistory = Record<string, RecentSearchEntry[]>;

type RecentSearchStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'lyra_recent_search_history_v1';
const STORAGE_VERSION = 1;
const MAX_ENTRIES_PER_CHANNEL = 8;
const HTTP_URL_RE = /^https?:\/\//i;

const getDefaultStorage = (): RecentSearchStorage | undefined => {
    if (typeof window === 'undefined') return undefined;
    return window.localStorage;
};

const normalizeEntry = (
    entry: RecentSearchEntry,
): RecentSearchEntry | null => {
    const query = entry.query.trim();
    if (!query || HTTP_URL_RE.test(query)) return null;
    const displayQuery = entry.displayQuery.trim() || query;
    if (!Number.isFinite(entry.searchedAt)) return null;
    return { query, displayQuery, searchedAt: entry.searchedAt };
};

const parseChannels = (value: unknown): RecentSearchHistory | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const parsed: RecentSearchHistory = {};
    for (const [channelKey, rawEntries] of Object.entries(value)) {
        if (!channelKey || !Array.isArray(rawEntries)) return null;
        const entries: RecentSearchEntry[] = [];
        for (const rawEntry of rawEntries.slice(0, MAX_ENTRIES_PER_CHANNEL)) {
            if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) return null;
            const candidate = rawEntry as Partial<RecentSearchEntry>;
            if (
                typeof candidate.query !== 'string'
                || typeof candidate.displayQuery !== 'string'
                || typeof candidate.searchedAt !== 'number'
            ) {
                return null;
            }
            const entry = normalizeEntry(candidate as RecentSearchEntry);
            if (!entry) return null;
            entries.push(entry);
        }
        if (entries.length > 0) parsed[channelKey] = entries;
    }
    return parsed;
};

export const buildRecentSearchChannelKey = (
    sourceTab: SearchSourceId,
    providers: OnlineMusicProviderId[],
): string => {
    const uniqueProviders = [...new Set(providers)].sort();
    return uniqueProviders.length > 0 ? uniqueProviders.join('+') : sourceTab;
};

export const readRecentSearchHistory = (
    storage = getDefaultStorage(),
): RecentSearchHistory => {
    if (!storage) return {};
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const payload = JSON.parse(raw) as { version?: unknown; channels?: unknown };
        if (payload.version !== STORAGE_VERSION) return {};
        return parseChannels(payload.channels) || {};
    } catch {
        return {};
    }
};

export const writeRecentSearchHistory = (
    history: RecentSearchHistory,
    storage = getDefaultStorage(),
) => {
    if (!storage) return;
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION,
            channels: history,
        }));
    } catch {
        // Search remains usable when storage is blocked or full.
    }
};

export const addRecentSearch = (
    history: RecentSearchHistory,
    channelKey: string,
    entry: RecentSearchEntry,
): RecentSearchHistory => {
    const normalized = normalizeEntry(entry);
    if (!channelKey || !normalized) return history;
    const entries = [
        normalized,
        ...(history[channelKey] || []).filter(item => item.query !== normalized.query),
    ].slice(0, MAX_ENTRIES_PER_CHANNEL);
    return {
        ...history,
        [channelKey]: entries,
    };
};

export const clearRecentSearchChannel = (
    history: RecentSearchHistory,
    channelKey: string,
): RecentSearchHistory => {
    if (!(channelKey in history)) return history;
    const next = { ...history };
    delete next[channelKey];
    return next;
};
