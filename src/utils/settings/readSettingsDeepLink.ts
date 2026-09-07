import type { SettingsModalInitialTab, SettingsSubviewId } from '../../stores/settingsUi/types';

// src/utils/settings/readSettingsDeepLink.ts
// Parses ?settings= / ?settingsTab= query params for preview deep-links.

const SUBVIEW_IDS = new Set<SettingsSubviewId>([
    'appearance',
    'general',
    'playback',
    'integration',
    'storage',
    'desktop',
    'lab',
    'visualizer',
    'themePark',
    'lyricFilter',
    'trackAtmosphereLight',
]);

export type SettingsDeepLink = {
    tab: SettingsModalInitialTab;
    subview: SettingsSubviewId | null;
};

/** Returns a settings deep-link from the current URL search params, if present. */
export const readSettingsDeepLink = (
    search = typeof window !== 'undefined' ? window.location.search : '',
): SettingsDeepLink | null => {
    const params = new URLSearchParams(search);
    const settings = params.get('settings')?.trim();
    if (!settings) return null;

    const tabParam = params.get('settingsTab');
    const tab: SettingsModalInitialTab = tabParam === 'help' ? 'help' : 'options';

    if (settings === '1' || settings === 'options' || settings === 'help') {
        return {
            tab: settings === 'help' ? 'help' : tab,
            subview: null,
        };
    }

    if (SUBVIEW_IDS.has(settings as SettingsSubviewId)) {
        return {
            tab,
            subview: settings as SettingsSubviewId,
        };
    }

    return null;
};
