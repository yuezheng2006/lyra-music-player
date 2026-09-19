import type { CommandPaletteCommand } from './types';

// src/components/command-palette/neteaseApiCommands.ts
// Restart the local NetEase API sidecar after an Electron backend failure.

export const NETEASE_API_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'netease-restart-api',
        group: 'settings',
        title: 'Restart NetEase API',
        description: 'Restart the local NetEase API after a backend startup failure',
        keywords: [
            'restart netease',
            'netease api',
            'restart backend',
            '重启网易云',
            '重启接口',
            '重启后端',
            'wangyiyun',
            'wyycq',
            'jiekou',
        ],
        execute: async () => {
            const restart = window.electron?.restartNeteaseApi;
            if (!restart) return false;
            try {
                const status = await restart();
                return status.status === 'running';
            } catch {
                return false;
            }
        },
    },
];
