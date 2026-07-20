import { create } from 'zustand';
import { getNavidromeConfig, navidromeApi } from '../services/navidromeService';
import { getMusicProvider } from '../services/musicProviders/registry';
import { isQishuiShareUrl, resolveOnlineSearchProvider } from '../utils/onlineSearchRouting';
import { isOnlineMusicProviderId, isPeerFreeProviderId, type PeerFreeProviderId } from '../utils/onlinePeerProviders';
import type { HomeViewTab, LocalSong, OnlineMusicProviderId, SearchSourceId, UnifiedSong } from '../types';

const LAST_HOME_VIEW_TAB_KEY = 'last_home_view_tab';
const DEFAULT_SEARCH_LIMIT = 30;
export type SearchReturnView = 'home' | 'player';

/** Bumps on every submit/restore so stale async responses cannot cross channels. */
let searchRequestEpoch = 0;

type PeerSearchProviderId = PeerFreeProviderId;
type PeerSearchQueryMap = Record<PeerSearchProviderId, string>;

type SearchExecutorDeps = {
    localSongs: LocalSong[];
    t: (key: string, fallback?: string) => string;
};

type SearchExecutionResult = {
    results: UnifiedSong[];
    hasMore: boolean;
    nextOffset: number;
};

type SubmitSearchPayload = {
    query?: string;
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
    searchSourceTab: SearchSourceId;
    searchProviders: OnlineMusicProviderId[];
    searchResults: UnifiedSong[] | null;
    searchReturnView: SearchReturnView;
    isSearchOpen: boolean;
    isSearching: boolean;
    isLoadingMore: boolean;
    offset: number;
    limit: number;
    hasMore: boolean;
    scrollTop: number;
    setHomeViewTab: (tab: HomeViewTab) => void;
    setHomeSearchQuery: (query: string) => void;
    setSearchQuery: (query: string) => void;
    clearSearchInput: () => void;
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

const searchOnlineProviderSongs = async (
    providerId: OnlineMusicProviderId,
    query: string,
    limit: number,
    offset: number
): Promise<SearchExecutionResult> => {
    const response = await getMusicProvider(providerId).search(query, { limit, offset });
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
): Promise<SearchExecutionResult> => {
    if (providers.length === 0) {
        return { results: [], hasMore: false, nextOffset: offset };
    }
    if (providers.length === 1) {
        return searchOnlineProviderSongs(providers[0], query, limit, offset);
    }

    const perLimit = Math.max(8, Math.ceil(limit / providers.length));
    const settled = await Promise.allSettled(
        providers.map(providerId => searchOnlineProviderSongs(providerId, query, perLimit, offset)),
    );
    const batches: UnifiedSong[][] = [];
    let hasMore = false;
    let nextOffset = offset;

    settled.forEach((result) => {
        if (result.status !== 'fulfilled') {
            return;
        }
        batches.push(result.value.results);
        hasMore = hasMore || result.value.hasMore;
        nextOffset = Math.max(nextOffset, result.value.nextOffset);
    });

    return {
        results: interleaveProviderResults(batches),
        hasMore,
        nextOffset,
    };
};

const executeSearch = async (
    query: string,
    sourceTab: SearchSourceId,
    offset: number,
    limit: number,
    deps: SearchExecutorDeps,
    providers?: OnlineMusicProviderId[],
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

    return searchAggregatedOnlineProviders(resolvedProviders, query, limit, offset);
};

const getInitialHomeViewTab = (): HomeViewTab => {
    if (typeof window === 'undefined') {
        return 'playlist';
    }
    const savedTab = localStorage.getItem(LAST_HOME_VIEW_TAB_KEY);
    return savedTab === 'playlist'
        || savedTab === 'local'
        || savedTab === 'albums'
        || savedTab === 'navidrome'
        || savedTab === 'radio'
        || savedTab === 'daily'
        || savedTab === 'podcast'
        ? savedTab
        : 'playlist';
};

export const useSearchNavigationStore = create<SearchNavigationState>((set, get) => ({
    homeViewTab: getInitialHomeViewTab(),
    homeSearchQuery: '',
    searchQuery: '',
    peerSearchQueries: { ...EMPTY_PEER_SEARCH_QUERIES },
    searchSourceTab: 'playlist',
    searchProviders: [],
    searchResults: null,
    searchReturnView: 'home',
    isSearchOpen: false,
    isSearching: false,
    isLoadingMore: false,
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
        });
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
        const prev = get();
        set({
            isSearchOpen: false,
            searchReturnView: 'home',
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
    submitSearch: async ({ query, sourceTab, providers, deps, returnView = 'home' }) => {
        const trimmedQuery = (query ?? get().searchQuery).trim();
        if (!trimmedQuery) {
            return false;
        }

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
            if (providers && providers.length > 0) {
                const filtered = providers.filter(isOnlineMusicProviderId);
                // Dedicated peer channel: caller passed exactly one free peer.
                // Home aggregate may intentionally include both coco and qishui.
                return filtered;
            }
            return isOnlineMusicProviderId(resolvedSourceTab) ? [resolvedSourceTab] : [];
        })();

        const nextSourceTab = effectiveProviders.length === 1 ? effectiveProviders[0] : resolvedSourceTab;
        const requestEpoch = ++searchRequestEpoch;
        const prev = get();
        // Only the already-open peer overlay may update that channel's keyword memory.
        // Home bar fan-out (even single-peer) must stay isolated from independent entries.
        const shouldPersistPeer = prev.isSearchOpen
            && isPeerSearchProviderId(nextSourceTab)
            && isPeerSearchProviderId(prev.searchSourceTab)
            && prev.searchSourceTab === nextSourceTab;
        set({
            searchQuery: trimmedQuery,
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
            searchResults: null,
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
            );
            if (requestEpoch !== searchRequestEpoch) {
                return false;
            }
            set({
                searchResults: result.results,
                hasMore: result.hasMore,
                offset: result.nextOffset,
                isSearching: false,
            });
            return true;
        } catch (error) {
            if (requestEpoch !== searchRequestEpoch) {
                return false;
            }
            console.error('[SearchStore] submitSearch failed:', error);
            set({
                searchResults: [],
                hasMore: false,
                offset: 0,
                isSearching: false,
            });
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
            console.error('[SearchStore] loadMoreSearchResults failed:', error);
            set({ isLoadingMore: false });
        }
    },
}));
