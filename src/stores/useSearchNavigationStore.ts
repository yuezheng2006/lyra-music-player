import { create } from 'zustand';
import { getNavidromeConfig, navidromeApi } from '../services/navidromeService';
import { getMusicProvider } from '../services/musicProviders/registry';
import { isBilibiliShareUrl, isQishuiShareUrl, resolveOnlineSearchProvider } from '../utils/onlineSearchRouting';
import { isOnlineMusicProviderId, isPeerFreeProviderId, type PeerFreeProviderId } from '../utils/onlinePeerProviders';
import type { HomeViewTab, LocalSong, OnlineMusicProviderId, SearchSourceId, UnifiedSong } from '../types';
import { captureRequestFailure, type RequestErrorCode } from '../utils/network';
import {
    buildSearchCacheKey,
    clearSearchInflight,
    getSearchInflight,
    readSearchCache,
    setSearchInflight,
    writeSearchCache,
    type CachedSearchPage,
} from '../utils/search/searchResultCache';
import {
    addRecentSearch,
    buildRecentSearchChannelKey,
    clearRecentSearchChannel,
    readRecentSearchHistory,
    writeRecentSearchHistory,
    type RecentSearchHistory,
} from '../utils/search/recentSearchHistory';
import { prefetchQishuiSearchAudio } from '../utils/search/prefetchQishuiSearchAudio';
import { startTelemetrySpan, trackTelemetry } from '../utils/telemetry/trackTelemetry';

const LAST_HOME_VIEW_TAB_KEY = 'last_home_view_tab';
const DEFAULT_SEARCH_LIMIT = 30;
export type SearchReturnView = 'home' | 'player';

/** Bumps on every submit/restore so stale async responses cannot cross channels. */
let searchRequestEpoch = 0;
let activeSearchController: AbortController | null = null;
let activeSearchSignature = '';

type PeerSearchProviderId = PeerFreeProviderId;
type PeerSearchQueryMap = Record<PeerSearchProviderId, string>;

type SearchExecutorDeps = {
    localSongs: LocalSong[];
    t: (key: string, fallback?: string) => string;
};

type SearchExecutionResult = CachedSearchPage;

type SubmitSearchPayload = {
    query?: string;
    /**
     * Optional UI label for the overlay input. Routing / execute / peer persistence
     * still use `query`; when omitted, `searchQuery` matches the routing query.
     */
    displayQuery?: string;
    sourceTab: SearchSourceId;
    /** When set, keyword search fans out across these online providers. */
    providers?: OnlineMusicProviderId[];
    deps: SearchExecutorDeps;
    returnView?: SearchReturnView;
};

interface SearchNavigationState {
    homeViewTab: HomeViewTab;
    /** Home / Grid global search bar — never shared with overlay or peer channels. */
    homeSearchQuery: string;
    /** Active overlay input (results panel + peer independent entries). */
    searchQuery: string;
    /** Per-peer keyword memory so coco ↔ qishui never share the input box. */
    peerSearchQueries: PeerSearchQueryMap;
    recentSearchHistory: RecentSearchHistory;
    searchSourceTab: SearchSourceId;
    searchProviders: OnlineMusicProviderId[];
    searchResults: UnifiedSong[] | null;
    searchReturnView: SearchReturnView;
    isSearchOpen: boolean;
    isSearching: boolean;
    isLoadingMore: boolean;
    searchError: string | null;
    searchErrorCode: RequestErrorCode | null;
    searchDiagnostic: string | null;
    offset: number;
    limit: number;
    hasMore: boolean;
    scrollTop: number;
    setHomeViewTab: (tab: HomeViewTab) => void;
    setHomeSearchQuery: (query: string) => void;
    setSearchQuery: (query: string) => void;
    clearSearchInput: () => void;
    clearRecentSearchHistory: (channelKey: string) => void;
    setSearchScrollTop: (scrollTop: number) => void;
    restoreSearch: (payload: {
        query: string;
        sourceTab: SearchSourceId;
        returnView?: SearchReturnView;
        /** When set, restores a multi-source aggregate instead of collapsing to sourceTab. */
        providers?: OnlineMusicProviderId[];
    }) => void;
    /** Open a free peer channel with that channel's own keyword, never the other peer's. */
    openPeerSearchChannel: (payload: { sourceTab: PeerSearchProviderId; returnView?: SearchReturnView; }) => void;
    hideSearchOverlay: () => void;
    submitSearch: (payload: SubmitSearchPayload) => Promise<boolean>;
    loadMoreSearchResults: (payload: { deps: SearchExecutorDeps; }) => Promise<void>;
}

const mapLocalSongToUnifiedSong = (
    song: LocalSong,
    index: number,
    t: SearchExecutorDeps['t']
): UnifiedSong => ({
    id: -(Date.now() + index),
    name: song.title || song.embeddedTitle || song.fileName,
    artists: [{ id: 0, name: song.artist || song.embeddedArtist || t('player.unknownArtist', '未知歌手') }],
    album: {
        id: 0,
        name: song.album || song.embeddedAlbum || t('player.unknownAlbum', '未知专辑'),
        picUrl: song.matchedCoverUrl || undefined,
    },
    duration: song.duration,
    al: {
        id: 0,
        name: song.album || song.embeddedAlbum || t('player.unknownAlbum', '未知专辑'),
        picUrl: song.matchedCoverUrl || undefined,
    },
    ar: [{ id: 0, name: song.artist || song.embeddedArtist || t('player.unknownArtist', '未知歌手') }],
    dt: song.duration,
    isLocal: true,
    localData: song,
});

const searchLocalSongs = (
    localSongs: LocalSong[],
    query: string,
    t: SearchExecutorDeps['t']
): SearchExecutionResult => {
    const lowerQuery = query.toLowerCase();
    const results = localSongs
        .filter(song => {
            const title = (song.title || song.embeddedTitle || song.fileName || '').toLowerCase();
            const artist = (song.artist || song.embeddedArtist || '').toLowerCase();
            const album = (song.album || song.embeddedAlbum || '').toLowerCase();
            return title.includes(lowerQuery) || artist.includes(lowerQuery) || album.includes(lowerQuery);
        })
        .map((song, index) => mapLocalSongToUnifiedSong(song, index, t));

    return {
        results,
        hasMore: false,
        nextOffset: results.length,
    };
};

const searchNavidromeSongs = async (query: string): Promise<SearchExecutionResult> => {
    const config = getNavidromeConfig();
    if (!config) {
        return { results: [], hasMore: false, nextOffset: 0 };
    }

    const response = await navidromeApi.search(config, query, 0, 0, DEFAULT_SEARCH_LIMIT);
    const results = (response.song || []).map(song => {
        const navidromeSong = navidromeApi.toNavidromeSong(config, song);
        return {
            ...navidromeSong,
            ar: navidromeSong.artists,
            al: navidromeSong.album,
            dt: navidromeSong.duration,
        } as UnifiedSong;
    });

    return {
        results,
        hasMore: false,
        nextOffset: results.length,
    };
};

const isPeerSearchProviderId = (sourceTab: SearchSourceId): sourceTab is PeerSearchProviderId =>
    isPeerFreeProviderId(sourceTab);

const EMPTY_PEER_SEARCH_QUERIES: PeerSearchQueryMap = {
    coco: '',
    qishui: '',
    kugou: '',
    bilibili: '',
    kuwo: '',
};

/** Persist the active input into the leaving peer channel before switching away. */
const withPersistedPeerQuery = (
    peerSearchQueries: PeerSearchQueryMap,
    sourceTab: SearchSourceId,
    query: string,
): PeerSearchQueryMap => {
    if (!isPeerSearchProviderId(sourceTab)) {
        return peerSearchQueries;
    }
    return {
        ...peerSearchQueries,
        [sourceTab]: query,
    };
};

const cancelActiveSearch = () => {
    activeSearchController?.abort();
    activeSearchController = null;
    activeSearchSignature = '';
};

const beginSearchRequest = (signature: string) => {
    if (!activeSearchController || activeSearchSignature !== signature) {
        cancelActiveSearch();
        activeSearchController = new AbortController();
        activeSearchSignature = signature;
    }
    return {
        controller: activeSearchController,
        requestEpoch: ++searchRequestEpoch,
    };
};

const searchOnlineProviderSongs = async (
    providerId: OnlineMusicProviderId,
    query: string,
    limit: number,
    offset: number,
    signal?: AbortSignal,
): Promise<SearchExecutionResult> => {
    const response = await getMusicProvider(providerId).search(query, { limit, offset, signal });
    const results = (response.songs as UnifiedSong[]).map(song => ({
        ...song,
        musicProvider: song.musicProvider || providerId,
    }));

    return {
        results,
        hasMore: response.hasMore ?? (typeof response.total === 'number' ? offset + results.length < response.total : false),
        nextOffset: offset + results.length,
    };
};

const searchCachedOnlineProviderSongs = async (
    providerId: OnlineMusicProviderId,
    query: string,
    limit: number,
    offset: number,
    signal?: AbortSignal,
    onCachedResult?: (result: SearchExecutionResult) => void,
): Promise<SearchExecutionResult> => {
    const key = buildSearchCacheKey(providerId, query, limit, offset);
    const cached = readSearchCache(key);
    if (cached) {
        onCachedResult?.(cached.result);
        if (cached.freshness === 'fresh') {
            return cached.result;
        }
    }

    const inflight = getSearchInflight(key);
    if (inflight) {
        return inflight;
    }

    const request = searchOnlineProviderSongs(providerId, query, limit, offset, signal);
    setSearchInflight(key, request, signal);
    try {
        const result = await request;
        writeSearchCache(key, result);
        return result;
    } finally {
        clearSearchInflight(key, request);
    }
};

/** Round-robin merge so no single source monopolizes the first page. */
const interleaveProviderResults = (batches: UnifiedSong[][]): UnifiedSong[] => {
    const merged: UnifiedSong[] = [];
    const maxLen = batches.reduce((max, batch) => Math.max(max, batch.length), 0);
    for (let index = 0; index < maxLen; index += 1) {
        for (const batch of batches) {
            if (index < batch.length) {
                merged.push(batch[index]);
            }
        }
    }
    return merged;
};

const searchAggregatedOnlineProviders = async (
    providers: OnlineMusicProviderId[],
    query: string,
    limit: number,
    offset: number,
    signal?: AbortSignal,
    onProgress?: (result: SearchExecutionResult) => void,
): Promise<SearchExecutionResult> => {
    if (providers.length === 0) {
        return { results: [], hasMore: false, nextOffset: offset };
    }

    const perLimit = providers.length === 1
        ? limit
        : Math.max(8, Math.ceil(limit / providers.length));
    const batches = new Map<OnlineMusicProviderId, SearchExecutionResult>();
    const failures: unknown[] = [];

    const buildMergedResult = (): SearchExecutionResult => {
        const ordered = providers
            .map(providerId => batches.get(providerId))
            .filter((batch): batch is SearchExecutionResult => Boolean(batch));
        return {
            results: interleaveProviderResults(ordered.map(batch => batch.results)),
            hasMore: ordered.some(batch => batch.hasMore),
            nextOffset: ordered.reduce(
                (next, batch) => Math.max(next, batch.nextOffset),
                offset,
            ),
        };
    };

    const publish = (providerId: OnlineMusicProviderId, result: SearchExecutionResult) => {
        batches.set(providerId, result);
        onProgress?.(buildMergedResult());
    };

    await Promise.all(providers.map(async (providerId) => {
        try {
            const result = await searchCachedOnlineProviderSongs(
                providerId,
                query,
                perLimit,
                offset,
                signal,
                cachedResult => publish(providerId, cachedResult),
            );
            publish(providerId, result);
        } catch (error) {
            failures.push(error);
        }
    }));

    if (batches.size === 0 && failures.length > 0) {
        throw failures[0];
    }
    return buildMergedResult();
};

const executeSearch = async (
    query: string,
    sourceTab: SearchSourceId,
    offset: number,
    limit: number,
    deps: SearchExecutorDeps,
    providers?: OnlineMusicProviderId[],
    signal?: AbortSignal,
    onProgress?: (result: SearchExecutionResult) => void,
): Promise<SearchExecutionResult> => {
    if (sourceTab === 'local') {
        return searchLocalSongs(deps.localSongs, query, deps.t);
    }

    if (sourceTab === 'navidrome') {
        return searchNavidromeSongs(query);
    }

    const resolvedProviders = providers && providers.length > 0
        ? providers
        : [isOnlineMusicProviderId(sourceTab) ? sourceTab : 'netease'];

    return searchAggregatedOnlineProviders(
        resolvedProviders,
        query,
        limit,
        offset,
        signal,
        onProgress,
    );
};

const getInitialHomeViewTab = (): HomeViewTab => {
    if (typeof window === 'undefined') {
        return 'playlist';
    }
    const savedTab = localStorage.getItem(LAST_HOME_VIEW_TAB_KEY);
    // 'daily' is no longer a sidebar destination; fall back to playlist.
    return savedTab === 'playlist'
        || savedTab === 'local'
        || savedTab === 'albums'
        || savedTab === 'navidrome'
        || savedTab === 'radio'
        || savedTab === 'podcast'
        ? savedTab
        : 'playlist';
};

export const useSearchNavigationStore = create<SearchNavigationState>((set, get) => ({
    homeViewTab: getInitialHomeViewTab(),
    homeSearchQuery: '',
    searchQuery: '',
    peerSearchQueries: { ...EMPTY_PEER_SEARCH_QUERIES },
    recentSearchHistory: readRecentSearchHistory(),
    searchSourceTab: 'playlist',
    searchProviders: [],
    searchResults: null,
    searchReturnView: 'home',
    isSearchOpen: false,
    isSearching: false,
    isLoadingMore: false,
    searchError: null,
    searchErrorCode: null,
    searchDiagnostic: null,
    offset: 0,
    limit: DEFAULT_SEARCH_LIMIT,
    hasMore: false,
    scrollTop: 0,
    setHomeViewTab: (tab) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(LAST_HOME_VIEW_TAB_KEY, tab);
        }
        set({ homeViewTab: tab });
    },
    setHomeSearchQuery: (query) => {
        set({ homeSearchQuery: query });
    },
    setSearchQuery: (query) => {
        const { searchSourceTab, peerSearchQueries, isSearchOpen } = get();
        set({
            searchQuery: query,
            // Only the open peer overlay owns that channel's keyword memory.
            ...(isSearchOpen && isPeerSearchProviderId(searchSourceTab)
                ? { peerSearchQueries: withPersistedPeerQuery(peerSearchQueries, searchSourceTab, query) }
                : {}),
        });
    },
    // Empty the overlay field and drop cached hits; never touch the home bar draft.
    clearSearchInput: () => {
        cancelActiveSearch();
        searchRequestEpoch += 1;
        const { searchSourceTab, peerSearchQueries, isSearchOpen } = get();
        set({
            searchQuery: '',
            ...(isSearchOpen && isPeerSearchProviderId(searchSourceTab)
                ? { peerSearchQueries: withPersistedPeerQuery(peerSearchQueries, searchSourceTab, '') }
                : {}),
            searchResults: null,
            offset: 0,
            hasMore: false,
            isSearching: false,
            isLoadingMore: false,
            searchError: null,
            searchErrorCode: null,
            searchDiagnostic: null,
        });
    },
    clearRecentSearchHistory: (channelKey) => {
        const next = clearRecentSearchChannel(get().recentSearchHistory, channelKey);
        set({ recentSearchHistory: next });
        writeRecentSearchHistory(next);
    },
    setSearchScrollTop: (scrollTop) => set({ scrollTop }),
    restoreSearch: (payload) => {
        const { query, sourceTab, returnView = 'home', providers } = payload;
        const prev = get();
        const requestedProviders = (providers || []).filter(isOnlineMusicProviderId);
        // Preserve an already-open multi-source aggregate when navigation re-asserts the same query.
        // Otherwise restoreSearch([sourceTab]) would collapse QQ+汽水+coco → [qq] and wipe results.
        const preservedAggregate = prev.isSearchOpen
            && prev.searchQuery.trim() === query.trim()
            && prev.searchProviders.length > 1
            && (
                !isOnlineMusicProviderId(sourceTab)
                || prev.searchProviders.includes(sourceTab)
            );
        const nextProviders = requestedProviders.length > 0
            ? requestedProviders
            : (preservedAggregate
                ? prev.searchProviders
                : (isOnlineMusicProviderId(sourceTab) ? [sourceTab] : []));
        const channelChanged = prev.searchSourceTab !== sourceTab
            || prev.searchProviders.join(',') !== nextProviders.join(',');
        // Switching coco ↔ qishui must not reuse the other source's hits.
        cancelActiveSearch();
        searchRequestEpoch += 1;
        let peerSearchQueries = prev.peerSearchQueries;
        if (prev.isSearchOpen && isPeerSearchProviderId(prev.searchSourceTab)) {
            peerSearchQueries = withPersistedPeerQuery(
                peerSearchQueries,
                prev.searchSourceTab,
                prev.searchQuery,
            );
        }
        const nextPeerQueries = isPeerSearchProviderId(sourceTab)
            ? withPersistedPeerQuery(peerSearchQueries, sourceTab, query)
            : peerSearchQueries;
        const keepResults = preservedAggregate && Boolean(prev.searchResults);
        set({
            searchQuery: query,
            peerSearchQueries: nextPeerQueries,
            searchSourceTab: sourceTab,
            searchProviders: nextProviders,
            searchReturnView: returnView,
            isSearchOpen: true,
            ...(channelChanged && !keepResults ? {
                searchResults: null,
                offset: 0,
                hasMore: false,
                isSearching: false,
                isLoadingMore: false,
                scrollTop: 0,
            } : {}),
        });
    },
    openPeerSearchChannel: ({ sourceTab, returnView = 'home' }) => {
        const prev = get();
        let peerSearchQueries = prev.peerSearchQueries;
        // Persist only the overlay's active peer input — never the home bar text.
        if (prev.isSearchOpen && isPeerSearchProviderId(prev.searchSourceTab)) {
            peerSearchQueries = withPersistedPeerQuery(
                peerSearchQueries,
                prev.searchSourceTab,
                prev.searchQuery,
            );
        }
        const nextQuery = peerSearchQueries[sourceTab] || '';
        const channelChanged = prev.searchSourceTab !== sourceTab
            || prev.searchProviders.join(',') !== sourceTab;
        cancelActiveSearch();
        searchRequestEpoch += 1;
        set({
            searchQuery: nextQuery,
            peerSearchQueries,
            searchSourceTab: sourceTab,
            searchProviders: [sourceTab],
            searchReturnView: returnView,
            isSearchOpen: true,
            ...(channelChanged ? {
                searchResults: null,
                offset: 0,
                hasMore: false,
                isSearching: false,
                isLoadingMore: false,
                scrollTop: 0,
            } : {}),
        });
    },
    hideSearchOverlay: () => {
        cancelActiveSearch();
        searchRequestEpoch += 1;
        const prev = get();
        set({
            isSearchOpen: false,
            searchReturnView: 'home',
            isSearching: false,
            isLoadingMore: false,
            ...(isPeerSearchProviderId(prev.searchSourceTab)
                ? {
                    peerSearchQueries: withPersistedPeerQuery(
                        prev.peerSearchQueries,
                        prev.searchSourceTab,
                        prev.searchQuery,
                    ),
                }
                : {}),
        });
    },
    submitSearch: async ({ query, displayQuery, sourceTab, providers, deps, returnView = 'home' }) => {
        const trimmedQuery = (query ?? get().searchQuery).trim();
        if (!trimmedQuery) {
            return false;
        }
        // Overlay input may strip routing prefixes (cat:/up:) while execute still uses trimmedQuery.
        const nextSearchQuery = (displayQuery ?? trimmedQuery).trim() || trimmedQuery;

        const resolvedSourceTab = sourceTab === 'local' || sourceTab === 'navidrome'
            ? sourceTab
            : resolveOnlineSearchProvider(trimmedQuery, sourceTab);

        // Never mix coco ↔ qishui in one request; overlay/home callers otherwise stay as passed.
        const effectiveProviders: OnlineMusicProviderId[] = (() => {
            if (sourceTab === 'local' || sourceTab === 'navidrome') {
                return [];
            }
            if (isQishuiShareUrl(trimmedQuery)) {
                return ['qishui'];
            }
            if (isBilibiliShareUrl(trimmedQuery)) {
                return ['bilibili'];
            }
            if (providers && providers.length > 0) {
                const filtered = providers.filter(isOnlineMusicProviderId);
                // Dedicated peer channel: caller passed exactly one free peer.
                // Home aggregate may intentionally include both coco and qishui.
                return filtered;
            }
            return isOnlineMusicProviderId(resolvedSourceTab) ? [resolvedSourceTab] : [];
        })();

        const nextSourceTab = effectiveProviders.length === 1 ? effectiveProviders[0] : resolvedSourceTab;
        const recentChannelKey = buildRecentSearchChannelKey(nextSourceTab, effectiveProviders);
        const recentSearchHistory = addRecentSearch(
            get().recentSearchHistory,
            recentChannelKey,
            {
                query: trimmedQuery,
                displayQuery: nextSearchQuery,
                searchedAt: Date.now(),
            },
        );
        if (recentSearchHistory !== get().recentSearchHistory) {
            writeRecentSearchHistory(recentSearchHistory);
        }
        const requestSignature = [
            nextSourceTab,
            effectiveProviders.join(','),
            trimmedQuery,
            '0',
            get().limit,
        ].join('|');
        const { requestEpoch, controller } = beginSearchRequest(requestSignature);
        const prev = get();
        // Only the already-open peer overlay may update that channel's keyword memory.
        // Home bar fan-out (even single-peer) must stay isolated from independent entries.
        const shouldPersistPeer = prev.isSearchOpen
            && isPeerSearchProviderId(nextSourceTab)
            && isPeerSearchProviderId(prev.searchSourceTab)
            && prev.searchSourceTab === nextSourceTab;
        trackTelemetry('search.start', {
            data: {
                sourceTab: nextSourceTab,
                providers: effectiveProviders,
                queryLen: trimmedQuery.length,
            },
        });
        const searchSpan = startTelemetrySpan('search.done', {
            sourceTab: nextSourceTab,
            providers: effectiveProviders,
        });
        set({
            searchQuery: nextSearchQuery,
            recentSearchHistory,
            ...(shouldPersistPeer
                ? {
                    peerSearchQueries: withPersistedPeerQuery(
                        prev.peerSearchQueries,
                        nextSourceTab,
                        trimmedQuery,
                    ),
                }
                : {}),
            searchSourceTab: nextSourceTab,
            searchProviders: effectiveProviders,
            searchReturnView: returnView,
            isSearchOpen: true,
            isSearching: true,
            isLoadingMore: false,
            searchError: null,
            searchErrorCode: null,
            searchDiagnostic: null,
            offset: 0,
            hasMore: false,
            scrollTop: 0,
        });

        try {
            const result = await executeSearch(
                trimmedQuery,
                resolvedSourceTab,
                0,
                get().limit,
                deps,
                effectiveProviders,
                controller.signal,
                progress => {
                    if (requestEpoch !== searchRequestEpoch) return;
                    set({
                        searchResults: progress.results,
                        hasMore: progress.hasMore,
                        offset: progress.nextOffset,
                    });
                    prefetchQishuiSearchAudio(effectiveProviders, progress.results, controller.signal);
                },
            );
            if (requestEpoch !== searchRequestEpoch) {
                searchSpan.end({ level: 'debug', data: { ok: false, reason: 'stale' } });
                return false;
            }
            searchSpan.end({
                data: {
                    ok: true,
                    resultCount: result.results.length,
                    hasMore: result.hasMore,
                },
            });
            set({
                searchResults: result.results,
                hasMore: result.hasMore,
                offset: result.nextOffset,
                isSearching: false,
                searchError: null,
                searchErrorCode: null,
                searchDiagnostic: null,
            });
            prefetchQishuiSearchAudio(effectiveProviders, result.results, controller.signal);
            if (activeSearchController === controller) {
                activeSearchController = null;
                activeSearchSignature = '';
            }
            return true;
        } catch (error) {
            if (requestEpoch !== searchRequestEpoch) {
                searchSpan.end({ level: 'debug', data: { ok: false, reason: 'stale' } });
                return false;
            }
            if (controller.signal.aborted || (error as { code?: string })?.code === 'aborted') {
                searchSpan.end({ level: 'debug', data: { ok: false, reason: 'aborted' } });
                set({ isSearching: false });
                return false;
            }
            const failure = captureRequestFailure(error, 'search:submit');
            searchSpan.end({
                level: 'error',
                data: { ok: false, errorCode: failure.code },
            });
            set({
                hasMore: false,
                offset: 0,
                isSearching: false,
                searchError: failure.message,
                searchErrorCode: failure.code,
                searchDiagnostic: failure.diagnostic,
            });
            if (activeSearchController === controller) {
                activeSearchController = null;
                activeSearchSignature = '';
            }
            return true;
        }
    },
    loadMoreSearchResults: async ({ deps }) => {
        const {
            searchQuery,
            searchSourceTab,
            searchProviders,
            searchResults,
            hasMore,
            isSearching,
            isLoadingMore,
            offset,
            limit,
        } = get();

        if (
            searchSourceTab === 'local'
            || searchSourceTab === 'navidrome'
            || !hasMore
            || isSearching
            || isLoadingMore
            || !searchQuery.trim()
        ) {
            return;
        }

        const requestEpoch = searchRequestEpoch;
        set({ isLoadingMore: true });

        try {
            const result = await executeSearch(
                searchQuery,
                searchSourceTab,
                offset,
                limit,
                deps,
                searchProviders.length > 0 ? searchProviders : undefined,
            );
            if (requestEpoch !== searchRequestEpoch) {
                return;
            }
            set({
                searchResults: [...(searchResults || []), ...result.results],
                hasMore: result.hasMore,
                offset: result.nextOffset,
                isLoadingMore: false,
            });
        } catch (error) {
            if (requestEpoch !== searchRequestEpoch) {
                return;
            }
            const failure = captureRequestFailure(error, 'search:loadMore');
            set({
                isLoadingMore: false,
                searchError: failure.message,
                searchErrorCode: failure.code,
                searchDiagnostic: failure.diagnostic,
            });
        }
    },
}));
