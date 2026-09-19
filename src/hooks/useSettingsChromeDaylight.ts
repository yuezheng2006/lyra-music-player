import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import { resolveSettingsChromeDaylight } from '../utils/settings/settingsChromeDaylightMath';

// src/hooks/useSettingsChromeDaylight.ts
// Settings chrome daylight, independent from the player theme when not set to follow.

export const useSettingsChromeDaylight = (): boolean => {
    const playerIsDaylight = useSettingsUiStore(state => state.isDaylight);
    const mode = useSettingsUiStore(state => state.settingsChromeDaylightMode);
    return resolveSettingsChromeDaylight(mode, playerIsDaylight);
};
