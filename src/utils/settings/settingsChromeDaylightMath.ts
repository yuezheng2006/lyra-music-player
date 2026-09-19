export type SettingsChromeDaylightMode = 'follow' | 'light' | 'dark';

// src/utils/settings/settingsChromeDaylightMath.ts
// Settings panel chrome can follow the player theme or stay independently light/dark.

export const SETTINGS_CHROME_DAYLIGHT_MODE_STORAGE_KEY = 'settings_chrome_daylight_mode';
export const DEFAULT_SETTINGS_CHROME_DAYLIGHT_MODE: SettingsChromeDaylightMode = 'follow';

export const parseSettingsChromeDaylightMode = (raw: string | null | undefined): SettingsChromeDaylightMode => (
    raw === 'light' || raw === 'dark' ? raw : DEFAULT_SETTINGS_CHROME_DAYLIGHT_MODE
);

export const resolveSettingsChromeDaylight = (
    mode: SettingsChromeDaylightMode,
    playerIsDaylight: boolean,
): boolean => (mode === 'follow' ? playerIsDaylight : mode === 'light');

export const cycleSettingsChromeDaylightMode = (
    mode: SettingsChromeDaylightMode,
): SettingsChromeDaylightMode => {
    if (mode === 'follow') return 'light';
    if (mode === 'light') return 'dark';
    return 'follow';
};

export const readStoredSettingsChromeDaylightMode = (): SettingsChromeDaylightMode => {
    if (typeof window === 'undefined') {
        return DEFAULT_SETTINGS_CHROME_DAYLIGHT_MODE;
    }
    return parseSettingsChromeDaylightMode(localStorage.getItem(SETTINGS_CHROME_DAYLIGHT_MODE_STORAGE_KEY));
};
