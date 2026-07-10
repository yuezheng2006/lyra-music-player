import { create } from 'zustand';
import { getNavidromeConfig, navidromeApi } from '../services/navidromeService';
import { getMusicProvider } from '../services/musicProviders/registry';
import { isQishuiShareUrl, resolveOnlineSearchProvider } from '../utils/onlineSearchRouting';
import type { HomeViewTab, LocalSong, OnlineMusicProviderId, SearchSourceId, UnifiedSong } from '../types';

const LAST_HOME_VIEW_TAB_KEY = 'last_home_view_tab';
const DEFAULT_SEARCH_LIMIT = 30;
export type SearchReturnView = 'home' | 'player';

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
    searchQuery: string;
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
    setSearchQuery: (query: string) => void;
    setSearchScrollTop: (scrollTop: number) => void;
    restoreSearch: (payload: { query: string; sourceTab: SearchSourceId; returnView?: SearchReturnView; }) => void;
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

const isOnlineMusicProviderId = (sourceTab: SearchSourceId): sourceTab is OnlineMusicProviderId =>
    sourceTab === 'netease' || sourceTab === 'qq' || sourceTab === 'qishui' || sourceTab === 'coco';

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
    searchQuery: '',
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
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSearchScrollTop: (scrollTop) => set({ scrollTop }),
    restoreSearch: ({ query, sourceTab, returnView = 'home' }) => set({
        searchQuery: query,
        searchSourceTab: sourceTab,
        searchReturnView: returnView,
        isSearchOpen: true,
    }),
    hideSearchOverlay: () => set({ isSearchOpen: false, searchReturnView: 'home' }),
    submitSearch: async ({ query, sourceTab, providers, deps, returnView = 'home' }) => {
        const trimmedQuery = (query ?? get().searchQuery).trim();
        if (!trimmedQuery) {
            return false;
        }

        const resolvedSourceTab = sourceTab === 'local' || sourceTab === 'navidrome'
            ? sourceTab
            : resolveOnlineSearchProvider(trimmedQuery, sourceTab);

        // Callers pass already-resolved searchable providers (checked ∩ signed-in).
        // Honor that list as-is; only fall back to a single sourceTab when omitted.
        const effectiveProviders: OnlineMusicProviderId[] = (() => {
            if (sourceTab === 'local' || sourceTab === 'navidrome') {
                return [];
            }
            if (isQishuiShareUrl(trimmedQuery) || resolvedSourceTab === 'qishui') {
                return ['qishui'];
            }
            if (providers && providers.length > 0) {
                return providers.filter(isOnlineMusicProviderId);
            }
            return isOnlineMusicProviderId(resolvedSourceTab) ? [resolvedSourceTab] : [];
        })();

        set({
            searchQuery: trimmedQuery,
            searchSourceTab: effectiveProviders.length > 1 ? effectiveProviders[0] : resolvedSourceTab,
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
            set({
                searchResults: result.results,
                hasMore: result.hasMore,
                offset: result.nextOffset,
                isSearching: false,
            });
            return true;
        } catch (error) {
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
            set({
                searchResults: [...(searchResults || []), ...result.results],
                hasMore: result.hasMore,
                offset: result.nextOffset,
                isLoadingMore: false,
            });
        } catch (error) {
            console.error('[SearchStore] loadMoreSearchResults failed:', error);
            set({ isLoadingMore: false });
        }
    },
}));
