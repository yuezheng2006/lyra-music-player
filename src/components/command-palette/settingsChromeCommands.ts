import type { CommandPaletteCommand } from './types';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';
import { cycleSettingsChromeDaylightMode } from '../../utils/settings/settingsChromeDaylightMath';

// src/components/command-palette/settingsChromeCommands.ts
// Cycle the settings panel chrome between follow / light / dark.

export const SETTINGS_CHROME_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'settings-chrome-daylight',
        group: 'settings',
        title: 'Settings panel light/dark',
        description: 'Keep the settings panel light, dark, or following the player',
        keywords: [
            'settings daylight',
            'settings light',
            'settings dark',
            '设置面板浅色',
            '设置面板深色',
            '设置日光',
            'shezhimianban',
            'szmb',
        ],
        getPreview: (_input, context) => {
            const mode = useSettingsUiStore.getState().settingsChromeDaylightMode;
            if (mode === 'light') {
                return context.t('commandPalette.previewSettingsChromeLight', 'Settings panel: always light');
            }
            if (mode === 'dark') {
                return context.t('commandPalette.previewSettingsChromeDark', 'Settings panel: always dark');
            }
            return context.t('commandPalette.previewSettingsChromeFollow', 'Settings panel: follow player');
        },
        execute: () => {
            const store = useSettingsUiStore.getState();
            store.handleSetSettingsChromeDaylightMode(
                cycleSettingsChromeDaylightMode(store.settingsChromeDaylightMode),
            );
            return true;
        },
    },
];
