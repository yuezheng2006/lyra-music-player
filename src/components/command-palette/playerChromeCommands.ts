import type { CommandPaletteCommand } from './types';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';

// src/components/command-palette/playerChromeCommands.ts
// Player-page chrome auto-hide and idle cursor hide (Folia #378).

export const PLAYER_CHROME_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'toggle-auto-hide-player-chrome',
        group: 'settings',
        title: 'Toggle auto-hide player controls',
        description: 'Hide the docked player bar after idle, or reveal it again',
        keywords: [
            'auto hide player',
            'hide controls',
            'idle hide',
            '自动隐藏控制栏',
            '隐藏播控',
            'zidongyincang',
            'zdyckz',
        ],
        execute: () => {
            const store = useSettingsUiStore.getState();
            store.handleToggleAutoHidePlayerChrome(!store.autoHidePlayerChrome);
            return true;
        },
    },
    {
        id: 'toggle-auto-hide-cursor-with-player-chrome',
        group: 'settings',
        title: 'Toggle hide cursor with player controls',
        description: 'Hide the mouse pointer on the lyric stage when controls auto-hide',
        keywords: [
            'hide cursor',
            'auto hide cursor',
            'cursor none',
            '隐藏鼠标',
            '隐藏指针',
            'yincangshubiao',
            'ycsb',
        ],
        execute: () => {
            const store = useSettingsUiStore.getState();
            store.handleToggleAutoHideCursorWithPlayerChrome(!store.autoHideCursorWithPlayerChrome);
            return true;
        },
    },
];
