import { create } from 'zustand';
import type { OnlineMusicProviderId } from '../types';

// src/stores/useOnlineLibraryFilterStore.ts
// Peer provider toggles drive both playlist filtering and the default search channel.

export type OnlineLibraryModuleFilter = 'all' | 'created' | 'liked';

/** Providers shown on the home source row (login peers + no-login search peers). */
export type OnlineLibraryProviderId = OnlineMusicProviderId;

export const ONLINE_LIBRARY_PROVIDER_IDS: OnlineLibraryProviderId[] = [
    'netease',
    'qq',
    'qishui',
    'coco',
    'kugou',
    'bilibili',
    'kuwo',
];

export const ONLINE_LIBRARY_FILTER_STORAGE_KEY = 'online_library_filter_v1';

const createDefaultPlaylistProviders = (): Record<OnlineLibraryProviderId, boolean> => ({
    netease: true,
    qq: true,
    qishui: true,
    coco: true,
    kugou: true,
    bilibili: true,
    kuwo: true,
});

const isOnlineLibraryProviderId = (value: unknown): value is OnlineLibraryProviderId =>
    value === 'netease'
    || value === 'qq'
    || value === 'qishui'
    || value === 'coco'
    || value === 'kugou'
    || value === 'bilibili'
    || value === 'kuwo';

const isModuleFilter = (value: unknown): value is OnlineLibraryModuleFilter =>
    value === 'all' || value === 'created' || value === 'liked';

const pickFallbackSearchProvider = (
    playlistProviders: Record<OnlineLibraryProviderId, boolean>,
    preferred?: OnlineLibraryProviderId,
): OnlineLibraryProviderId => {
    if (preferred && playlistProviders[preferred]) {
        return preferred;
    }
    return ONLINE_LIBRARY_PROVIDER_IDS.find(id => playlistProviders[id]) || 'coco';
};

const normalizePlaylistProviders = (
    raw: unknown,
): Record<OnlineLibraryProviderId, boolean> => {
    const defaults = createDefaultPlaylistProviders();
    if (!raw || typeof raw !== 'object') {
        return defaults;
    }

    const next = { ...defaults };
    for (const id of ONLINE_LIBRARY_PROVIDER_IDS) {
        const value = (raw as Record<string, unknown>)[id];
        if (typeof value === 'boolean') {
            next[id] = value;
        }
    }

    // Keep at least one source enabled so the home library never goes blank.
    if (!ONLINE_LIBRARY_PROVIDER_IDS.some(id => next[id])) {
        next.coco = true;
    }
    return next;
};

type PersistedOnlineLibraryFilter = {
    playlistProviders: Record<OnlineLibraryProviderId, boolean>;
    moduleFilter: OnlineLibraryModuleFilter;
    searchProvider: OnlineLibraryProviderId;
};

const readPersistedFilter = (): PersistedOnlineLibraryFilter => {
    const defaults: PersistedOnlineLibraryFilter = {
        playlistProviders: createDefaultPlaylistProviders(),
        moduleFilter: 'all',
        searchProvider: 'netease',
    };

    if (typeof window === 'undefined') {
        return defaults;
    }

    try {
        const raw = localStorage.getItem(ONLINE_LIBRARY_FILTER_STORAGE_KEY);
        if (!raw) {
            return defaults;
        }
        const parsed = JSON.parse(raw) as Partial<PersistedOnlineLibraryFilter>;
        const playlistProviders = normalizePlaylistProviders(parsed.playlistProviders);
        const searchProvider = pickFallbackSearchProvider(
            playlistProviders,
            isOnlineLibraryProviderId(parsed.searchProvider) ? parsed.searchProvider : undefined,
        );
        return {
            playlistProviders,
            moduleFilter: isModuleFilter(parsed.moduleFilter) ? parsed.moduleFilter : 'all',
            searchProvider,
        };
    } catch {
        return defaults;
    }
};

const persistFilter = (state: PersistedOnlineLibraryFilter) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(ONLINE_LIBRARY_FILTER_STORAGE_KEY, JSON.stringify({
            playlistProviders: state.playlistProviders,
            moduleFilter: state.moduleFilter,
            searchProvider: state.searchProvider,
        }));
    } catch {
        // Ignore quota / private-mode write failures.
    }
};

type OnlineLibraryFilterState = PersistedOnlineLibraryFilter & {
    setPlaylistProviderEnabled: (provider: OnlineLibraryProviderId, enabled: boolean) => void;
    togglePlaylistProvider: (provider: OnlineLibraryProviderId) => void;
    setModuleFilter: (filter: OnlineLibraryModuleFilter) => void;
    setSearchProvider: (provider: OnlineLibraryProviderId) => void;
};

const initialFilter = readPersistedFilter();

export const useOnlineLibraryFilterStore = create<OnlineLibraryFilterState>((set, get) => {
    const commit = (partial: Partial<PersistedOnlineLibraryFilter>) => {
        set(partial);
        const next = get();
        persistFilter({
            playlistProviders: next.playlistProviders,
            moduleFilter: next.moduleFilter,
            searchProvider: next.searchProvider,
        });
    };

    return {
        playlistProviders: initialFilter.playlistProviders,
        moduleFilter: initialFilter.moduleFilter,
        searchProvider: initialFilter.searchProvider,
        setPlaylistProviderEnabled: (provider, enabled) => {
            const state = get();
            const playlistProviders = {
                ...state.playlistProviders,
                [provider]: enabled,
            };
            commit({
                playlistProviders,
                searchProvider: enabled
                    ? provider
                    : pickFallbackSearchProvider(
                        playlistProviders,
                        state.searchProvider === provider ? undefined : state.searchProvider,
                    ),
            });
        },
        togglePlaylistProvider: (provider) => {
            const state = get();
            const nextEnabled = !state.playlistProviders[provider];
            const playlistProviders = {
                ...state.playlistProviders,
                [provider]: nextEnabled,
            };
            commit({
                playlistProviders,
                searchProvider: nextEnabled
                    ? provider
                    : pickFallbackSearchProvider(
                        playlistProviders,
                        state.searchProvider === provider ? undefined : state.searchProvider,
                    ),
            });
        },
        setModuleFilter: (filter) => {
            commit({ moduleFilter: filter });
        },
        setSearchProvider: (provider) => {
            const state = get();
            commit({
                searchProvider: provider,
                playlistProviders: {
                    ...state.playlistProviders,
                    [provider]: true,
                },
            });
        },
    };
});
