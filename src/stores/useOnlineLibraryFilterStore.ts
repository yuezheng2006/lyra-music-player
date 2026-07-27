import { create } from 'zustand';
import type { OnlineMusicProviderId } from '../types';
import { BUILTIN_PROVIDER_SEED_IDS, isOnlineMusicProviderId } from '../utils/onlinePeerProviders';

// src/stores/useOnlineLibraryFilterStore.ts
// Peer provider toggles drive both playlist filtering and the default search channel.

export type OnlineLibraryModuleFilter = 'all' | 'created' | 'liked';

/** Providers shown on the home source row (login peers + no-login search peers + plugins). */
export type OnlineLibraryProviderId = OnlineMusicProviderId;

/** Built-in seed used before/without sidecar catalog. */
export const ONLINE_LIBRARY_PROVIDER_IDS: OnlineLibraryProviderId[] = [...BUILTIN_PROVIDER_SEED_IDS];

export const ONLINE_LIBRARY_FILTER_STORAGE_KEY = 'online_library_filter_v1';

const createDefaultPlaylistProviders = (
    ids: readonly string[] = ONLINE_LIBRARY_PROVIDER_IDS,
): Record<string, boolean> => {
    const next: Record<string, boolean> = {};
    for (const id of ids) {
        next[id] = true;
    }
    return next;
};

const isModuleFilter = (value: unknown): value is OnlineLibraryModuleFilter =>
    value === 'all' || value === 'created' || value === 'liked';

const pickFallbackSearchProvider = (
    playlistProviders: Record<string, boolean>,
    knownIds: readonly string[],
    preferred?: OnlineLibraryProviderId,
): OnlineLibraryProviderId => {
    if (preferred && playlistProviders[preferred]) {
        return preferred;
    }
    return (knownIds.find(id => playlistProviders[id]) || 'coco') as OnlineLibraryProviderId;
};

const normalizePlaylistProviders = (
    raw: unknown,
    knownIds: readonly string[],
): Record<string, boolean> => {
    const defaults = createDefaultPlaylistProviders(knownIds);
    if (!raw || typeof raw !== 'object') {
        return defaults;
    }

    const next = { ...defaults };
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
        if (isOnlineMusicProviderId(id) && typeof value === 'boolean') {
            next[id] = value;
        }
    }

    // Keep at least one source enabled so the home library never goes blank.
    if (!knownIds.some(id => next[id])) {
        next.coco = true;
    }
    return next;
};

type PersistedOnlineLibraryFilter = {
    playlistProviders: Record<string, boolean>;
    moduleFilter: OnlineLibraryModuleFilter;
    searchProvider: OnlineLibraryProviderId;
    knownProviderIds: OnlineLibraryProviderId[];
};

const readPersistedFilter = (): PersistedOnlineLibraryFilter => {
    const defaults: PersistedOnlineLibraryFilter = {
        playlistProviders: createDefaultPlaylistProviders(),
        moduleFilter: 'all',
        searchProvider: 'netease',
        knownProviderIds: [...ONLINE_LIBRARY_PROVIDER_IDS],
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
        const knownFromStorage = Array.isArray(parsed.knownProviderIds)
            ? parsed.knownProviderIds.filter(isOnlineMusicProviderId)
            : [];
        const knownProviderIds = [
            ...ONLINE_LIBRARY_PROVIDER_IDS,
            ...knownFromStorage.filter(id => !ONLINE_LIBRARY_PROVIDER_IDS.includes(id as typeof ONLINE_LIBRARY_PROVIDER_IDS[number])),
        ];
        const playlistProviders = normalizePlaylistProviders(parsed.playlistProviders, knownProviderIds);
        const searchProvider = pickFallbackSearchProvider(
            playlistProviders,
            knownProviderIds,
            isOnlineMusicProviderId(parsed.searchProvider) ? parsed.searchProvider : undefined,
        );
        return {
            playlistProviders,
            moduleFilter: isModuleFilter(parsed.moduleFilter) ? parsed.moduleFilter : 'all',
            searchProvider,
            knownProviderIds,
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
            knownProviderIds: state.knownProviderIds,
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
    /** Merge sidecar catalog ids into the pill list (new plugins default to enabled). */
    syncKnownProviders: (providerIds: readonly string[]) => void;
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
            knownProviderIds: next.knownProviderIds,
        });
    };

    return {
        playlistProviders: initialFilter.playlistProviders,
        moduleFilter: initialFilter.moduleFilter,
        searchProvider: initialFilter.searchProvider,
        knownProviderIds: initialFilter.knownProviderIds,
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
                        state.knownProviderIds,
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
                        state.knownProviderIds,
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
        syncKnownProviders: (providerIds) => {
            const state = get();
            const merged: OnlineLibraryProviderId[] = [];
            const seen = new Set<string>();
            for (const id of [...ONLINE_LIBRARY_PROVIDER_IDS, ...providerIds, ...state.knownProviderIds]) {
                if (!isOnlineMusicProviderId(id) || seen.has(id)) continue;
                seen.add(id);
                merged.push(id);
            }
            const playlistProviders = { ...state.playlistProviders };
            for (const id of merged) {
                if (typeof playlistProviders[id] !== 'boolean') {
                    // New open-mode plugins default to enabled so they appear immediately.
                    playlistProviders[id] = true;
                }
            }
            commit({
                knownProviderIds: merged,
                playlistProviders,
                searchProvider: pickFallbackSearchProvider(
                    playlistProviders,
                    merged,
                    state.searchProvider,
                ),
            });
        },
    };
});
