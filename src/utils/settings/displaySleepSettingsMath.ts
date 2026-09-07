// src/utils/settings/displaySleepSettingsMath.ts
// Desktop-only display-sleep preference persistence.

export const PREVENT_DISPLAY_SLEEP_DURING_PLAYBACK_STORAGE_KEY = 'prevent_display_sleep_during_playback';

export const readStoredPreventDisplaySleepDuringPlayback = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PREVENT_DISPLAY_SLEEP_DURING_PLAYBACK_STORAGE_KEY) === 'true';
};

export const persistPreventDisplaySleepDuringPlayback = (enabled: boolean): boolean => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(PREVENT_DISPLAY_SLEEP_DURING_PLAYBACK_STORAGE_KEY, enabled ? 'true' : 'false');
    }
    return enabled;
};
