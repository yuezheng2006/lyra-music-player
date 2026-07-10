import { useSearchNavigationStore } from '../stores/useSearchNavigationStore';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';

// src/utils/onlineBrowseOverlays.ts
// Shared helpers for clearing search + GridView browse layers.

export const GRID_VIEW_ACTIVE_COLLECTION_KEY = 'folia_gridview_active_collection';

/** Close search + GridView so "home" means the clean playlist browse surface. */
export const clearOnlineBrowseOverlays = () => {
    useSearchNavigationStore.getState().hideSearchOverlay();
    useSettingsUiStore.getState().setActiveGridViewCollection(null);
    try {
        sessionStorage.removeItem(GRID_VIEW_ACTIVE_COLLECTION_KEY);
    } catch {
        // Ignore storage failures in private mode / restricted contexts.
    }
};
