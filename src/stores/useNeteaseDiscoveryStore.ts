import { create } from 'zustand';
import type { NeteaseUser, SongResult } from '../types';
import {
    fetchHeartbeatSongs,
    fetchPersonalFmSongs,
    fetchRadarPlaylistSongs,
    fetchRadarShelfItems,
    type NeteaseRadarShelfItem,
} from '../services/neteaseDiscoveryService';

// src/stores/useNeteaseDiscoveryStore.ts
// Cached radar shelf plus one-shot FM / heartbeat loaders.

type NeteaseDiscoveryState = {
    radarItems: NeteaseRadarShelfItem[];
    radarLoading: boolean;
    radarSettled: boolean;
    actionBusy: 'fm' | 'heartbeat' | number | null;
    error: string | null;
    ensureRadarLoaded: (options?: { force?: boolean }) => Promise<void>;
    startPersonalFm: () => Promise<SongResult[]>;
    startHeartbeat: (input: {
        user: Pick<NeteaseUser, 'userId'>;
        likedPlaylistId: number;
    }) => Promise<SongResult[]>;
    loadRadarSongs: (playlistId: number) => Promise<SongResult[]>;
};

export const useNeteaseDiscoveryStore = create<NeteaseDiscoveryState>((set, get) => ({
    radarItems: [],
    radarLoading: false,
    radarSettled: false,
    actionBusy: null,
    error: null,
    ensureRadarLoaded: async (options) => {
        if (!options?.force && (get().radarLoading || get().radarSettled)) return;
        set({ radarLoading: true, error: null });
        try {
            const radarItems = await fetchRadarShelfItems();
            set({ radarItems, radarLoading: false, radarSettled: true });
        } catch (error) {
            set({
                radarLoading: false,
                radarSettled: true,
                error: error instanceof Error ? error.message : 'radar-load-failed',
            });
        }
    },
    startPersonalFm: async () => {
        set({ actionBusy: 'fm', error: null });
        try {
            return await fetchPersonalFmSongs();
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'fm-start-failed' });
            return [];
        } finally {
            set({ actionBusy: null });
        }
    },
    startHeartbeat: async (input) => {
        set({ actionBusy: 'heartbeat', error: null });
        try {
            return await fetchHeartbeatSongs(input);
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'heartbeat-start-failed' });
            return [];
        } finally {
            set({ actionBusy: null });
        }
    },
    loadRadarSongs: async (playlistId) => {
        set({ actionBusy: playlistId, error: null });
        try {
            return await fetchRadarPlaylistSongs(playlistId);
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'radar-play-failed' });
            return [];
        } finally {
            set({ actionBusy: null });
        }
    },
}));
