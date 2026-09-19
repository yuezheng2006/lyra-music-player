import type { CommandPaletteCommand } from './types';
import { useSettingsUiStore } from '../../stores/useSettingsUiStore';

// src/components/command-palette/autoPlayOnLaunchCommands.ts
// Lab toggle: restore last song and start playback on launch (off by default).

export const AUTO_PLAY_ON_LAUNCH_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'toggle-auto-play-on-launch',
        group: 'settings',
        title: 'Toggle autoplay on launch',
        description: 'Resume the last song automatically when the app starts',
        keywords: [
            'autoplay on launch',
            'auto play on launch',
            'resume on launch',
            '启动自动续播',
            '自动续播',
            '开机播放',
            'qidongzidongxubo',
            'zidongxubo',
            'qdzdxb',
            'zdxb',
        ],
        execute: () => {
            const store = useSettingsUiStore.getState();
            store.handleToggleAutoPlayOnLaunch(!store.autoPlayOnLaunch);
            return true;
        },
    },
];
