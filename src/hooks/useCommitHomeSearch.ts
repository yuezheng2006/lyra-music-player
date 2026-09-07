import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import type { LocalSong, NeteaseUser, SearchSourceId } from '../types';
import { useOnlineLibraryFilterStore } from '../stores/useOnlineLibraryFilterStore';
import { useSearchNavigationStore } from '../stores/useSearchNavigationStore';
import { hasNeteaseSession, hasQQMusicSession } from '../utils/onlineLibraryAccess';
import { resolveOnlineSearchProvider, resolveSearchableLibraryProviders } from '../utils/onlineSearchRouting';
import { isCuratedPeerFreeProviderId } from '../utils/onlinePeerProviders';
import { stripShortcutDisplayLabel } from '../utils/onlineSearchShortcuts';

// src/hooks/useCommitHomeSearch.ts
// Shared home/charts search submit: peer channel, overlay restore, or multi-source search.

type UseCommitHomeSearchOptions = {
    localSongs: LocalSong[];
    user: NeteaseUser | null;
    onSearchCommitted: (query: string, sourceTab: SearchSourceId, replace?: boolean) => void;
};

export const useCommitHomeSearch = ({
    localSongs,
    user,
    onSearchCommitted,
}: UseCommitHomeSearchOptions) => {
    const { t } = useTranslation();
    const searchProvider = useOnlineLibraryFilterStore(state => state.searchProvider);
    const playlistProviders = useOnlineLibraryFilterStore(state => state.playlistProviders);
    const knownProviderIds = useOnlineLibraryFilterStore(state => state.knownProviderIds);
    const setSearchProvider = useOnlineLibraryFilterStore(state => state.setSearchProvider);
    const {
        submitSearch,
        restoreSearch,
        openPeerSearchChannel,
    } = useSearchNavigationStore(useShallow(state => ({
        submitSearch: state.submitSearch,
        restoreSearch: state.restoreSearch,
        openPeerSearchChannel: state.openPeerSearchChannel,
    })));

    return useCallback(async (rawQuery: string, allowEmptyChannel = false) => {
        const query = rawQuery.trim();
        const searchableProviders = resolveSearchableLibraryProviders(playlistProviders, {
            netease: hasNeteaseSession(user),
            qq: hasQQMusicSession(),
        }, knownProviderIds);

        if (!query) {
            if (!allowEmptyChannel) return;
            setSearchProvider(searchProvider);
            if (isCuratedPeerFreeProviderId(searchProvider)) {
                openPeerSearchChannel({
                    sourceTab: searchProvider,
                    returnView: 'home',
                });
                return;
            }
            restoreSearch({
                query: '',
                sourceTab: searchProvider,
                returnView: 'home',
            });
            return;
        }

        const displayQuery = stripShortcutDisplayLabel(query);
        const resolvedProvider = resolveOnlineSearchProvider(
            query,
            searchableProviders[0] || searchProvider,
        );
        if (searchableProviders.length === 1) {
            setSearchProvider(searchableProviders[0]);
        }

        const didSearch = await submitSearch({
            query,
            displayQuery,
            sourceTab: resolvedProvider,
            providers: searchableProviders.length > 0
                ? [...searchableProviders]
                : [resolvedProvider],
            deps: {
                localSongs,
                t: (key, fallback) => t(key, fallback ?? ''),
            },
        });

        if (didSearch) {
            onSearchCommitted(displayQuery || query, resolvedProvider);
        }
    }, [
        knownProviderIds,
        localSongs,
        onSearchCommitted,
        openPeerSearchChannel,
        playlistProviders,
        restoreSearch,
        searchProvider,
        setSearchProvider,
        submitSearch,
        t,
        user,
    ]);
};
