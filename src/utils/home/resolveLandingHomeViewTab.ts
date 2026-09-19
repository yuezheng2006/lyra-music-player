import type { HomeViewTab } from '../../types';

// src/utils/home/resolveLandingHomeViewTab.ts
// Search replaces the empty guest home. Playlist stays only after login.

export const DEFAULT_BROWSE_TAB: HomeViewTab = 'charts';

export const resolveHomeViewTabForSession = (
    tab: HomeViewTab,
    hasPersonalLibrary: boolean,
): HomeViewTab => {
    if (tab === 'playlist' && !hasPersonalLibrary) {
        return DEFAULT_BROWSE_TAB;
    }
    return tab;
};
