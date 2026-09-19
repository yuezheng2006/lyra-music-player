import type { CommandPaletteCommand } from './types';

// src/components/command-palette/neteaseDiscoveryCommands.ts
// Command-palette actions for NetEase Personal FM and Heartbeat.

export const NETEASE_DISCOVERY_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'playback-netease-personal-fm',
        group: 'playback',
        title: 'NetEase: Personal FM',
        description: 'Start NetEase Personal FM',
        keywords: ['personal fm', 'private fm', '私人fm', '私人漫游', 'srmy', 'netease fm'],
        execute: async (_input, context) => context.startNeteasePersonalFm(),
    },
    {
        id: 'playback-netease-heartbeat',
        group: 'playback',
        title: 'NetEase: Heartbeat',
        description: 'Start Heartbeat mode from liked songs',
        keywords: ['heartbeat', 'intelligence', '心动模式', '心动', 'xdms', 'netease heartbeat'],
        execute: async (_input, context) => context.startNeteaseHeartbeat(),
    },
];
