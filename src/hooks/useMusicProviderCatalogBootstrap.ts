import { useEffect } from 'react';
import { useMusicProviderCatalogStore } from '../stores/useMusicProviderCatalogStore';
import { useOnlineLibraryFilterStore } from '../stores/useOnlineLibraryFilterStore';
import { resetSidecarProviderClientCache } from '../services/musicProviders/sidecarProviderClient';
import { mergeProviderCatalogIds } from '../utils/musicProviders/providerManifestMath';

// src/hooks/useMusicProviderCatalogBootstrap.ts
// Load sidecar provider catalog once and sync open-mode plugins into search pills.

export function useMusicProviderCatalogBootstrap() {
  const refresh = useMusicProviderCatalogStore((state) => state.refresh);
  const providers = useMusicProviderCatalogStore((state) => state.providers);
  const syncKnownProviders = useOnlineLibraryFilterStore((state) => state.syncKnownProviders);

  useEffect(() => {
    // Drop any stale base URL from a previous session before first catalog fetch.
    resetSidecarProviderClientCache();
    void refresh();
  }, [refresh]);

  useEffect(() => {
    syncKnownProviders(mergeProviderCatalogIds(providers));
  }, [providers, syncKnownProviders]);
}
