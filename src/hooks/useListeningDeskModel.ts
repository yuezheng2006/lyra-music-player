import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SongResult } from '../types';
import {
    serializeDailyRecommendProviderKey,
    useDailyRecommendStore,
} from '../stores/useDailyRecommendStore';
import { useOnlineLibraryFilterStore } from '../stores/useOnlineLibraryFilterStore';
import type { OnlineLibraryProviderId } from '../stores/useOnlineLibraryFilterStore';
import { listTodayPicksProviders } from '../services/dailyRecommendService';
import { fetchListeningDeskFallback } from '../services/listeningDeskFallback';
import { keepListeningDeskFullTracks, LISTENING_DESK_STAGE, splitListeningDeskSongs } from '../utils/home/listeningDeskMath';
import {
    flattenPeerShelfShortcuts,
} from '../utils/ui/homePeerSourceShelfMath';
import { getOnlineSearchShortcutGroups } from '../utils/onlineSearchShortcuts';
import { hasQQMusicSession } from '../utils/onlineLibraryAccess';

// src/hooks/useListeningDeskModel.ts
// Fill the desk immediately from keyword search; chart picks replace it when they arrive.

const EMPTY_SHORTCUT_LIMIT = 8;

const deskEnabledMap = (
    enabled: Partial<Record<OnlineLibraryProviderId, boolean>>,
): Partial<Record<OnlineLibraryProviderId, boolean>> => ({
    ...enabled,
    ...(hasQQMusicSession() ? {} : { qq: false }),
});

const deskMixProviders = (
    enabled: Partial<Record<OnlineLibraryProviderId, boolean>>,
) => listTodayPicksProviders(deskEnabledMap(enabled));

export const useListeningDeskModel = () => {
    const playlistProviders = useOnlineLibraryFilterStore(state => state.playlistProviders);
    const providerKey = serializeDailyRecommendProviderKey(deskEnabledMap(playlistProviders));
    const {
        songs,
        loading,
        settled,
        ensureLoaded,
    } = useDailyRecommendStore(useShallow(state => ({
        songs: state.songs,
        loading: state.loading,
        settled: state.settled,
        ensureLoaded: state.ensureLoaded,
    })));
    const [fallbackSongs, setFallbackSongs] = useState<SongResult[]>([]);
    const [fallbackLoading, setFallbackLoading] = useState(false);

    useEffect(() => {
        void ensureLoaded();
    }, [ensureLoaded, providerKey]);

    useEffect(() => {
        if (songs.length > 0) {
            setFallbackSongs([]);
            setFallbackLoading(false);
            return;
        }

        const enabled = deskEnabledMap(useOnlineLibraryFilterStore.getState().playlistProviders);
        if (deskMixProviders(enabled).length === 0) {
            setFallbackSongs([]);
            setFallbackLoading(false);
            return;
        }

        let cancelled = false;
        setFallbackLoading(true);
        void fetchListeningDeskFallback(enabled, {
            onPartial: (next) => {
                if (cancelled || next.length === 0) return;
                setFallbackSongs(next);
                setFallbackLoading(false);
            },
        }).then((next) => {
            if (cancelled) return;
            setFallbackSongs(next);
            setFallbackLoading(false);
        }).catch(() => {
            if (!cancelled) setFallbackLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [songs.length, providerKey]);

    const displaySongs = useMemo(
        () => keepListeningDeskFullTracks(songs.length > 0 ? songs : fallbackSongs),
        [songs, fallbackSongs],
    );
    const showLoading = displaySongs.length === 0 && (fallbackLoading || (loading && !settled));
    const hasPeerSources = deskMixProviders(playlistProviders).length > 0;
    const showEmpty = !showLoading && displaySongs.length === 0 && (settled || !hasPeerSources);
    const emptyNeedsSources = showEmpty && !hasPeerSources;
    const desk = useMemo(
        () => splitListeningDeskSongs(displaySongs, LISTENING_DESK_STAGE),
        [displaySongs],
    );
    const emptyShortcuts = useMemo(
        () => flattenPeerShelfShortcuts(getOnlineSearchShortcutGroups('coco'), EMPTY_SHORTCUT_LIMIT),
        [],
    );

    return {
        songs: displaySongs,
        hero: desk.hero,
        mosaic: desk.mosaic,
        showLoading,
        showEmpty,
        emptyNeedsSources,
        emptyShortcuts,
        fromFallback: songs.length === 0 && fallbackSongs.length > 0,
        enabledDeskProviderIds: deskMixProviders(playlistProviders),
    };
};
