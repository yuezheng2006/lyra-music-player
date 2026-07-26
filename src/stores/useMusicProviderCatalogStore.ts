import { create } from 'zustand';
import type { ProviderCatalogEntry } from '../utils/musicProviders/providerManifestMath';
import { mergeProviderCatalogIds } from '../utils/musicProviders/providerManifestMath';
import {
  fetchMusicProviderCatalog,
  reloadMusicProviderCatalog,
} from '../services/musicProviders/sidecarProviderClient';

// src/stores/useMusicProviderCatalogStore.ts
// Sidecar provider catalog for open-mode plugins + curated sources.

type MusicProviderCatalogState = {
  providers: ProviderCatalogEntry[];
  userPluginsDir: string | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  getProviderIds: () => string[];
  getProvider: (id: string) => ProviderCatalogEntry | undefined;
};

export const useMusicProviderCatalogStore = create<MusicProviderCatalogState>((set, get) => ({
  providers: [],
  userPluginsDir: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
  getProviderIds: () => mergeProviderCatalogIds(get().providers),
  getProvider: (id) => get().providers.find((entry) => entry.id === id),
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const catalog = await fetchMusicProviderCatalog();
      set({
        providers: catalog.providers,
        userPluginsDir: catalog.userPluginsDir,
        loading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
  reload: async () => {
    set({ loading: true, error: null });
    try {
      const catalog = await reloadMusicProviderCatalog();
      set({
        providers: catalog.providers,
        userPluginsDir: catalog.userPluginsDir,
        loading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
}));
