import type { CommandPaletteCommand } from './types';

// src/components/command-palette/kugouLoginCommands.ts
// Open the account panel for Kugou official QR login.

export const KUGOU_LOGIN_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'kugou-scan-login',
        group: 'panel',
        title: 'Log in to Kugou Music',
        description: 'Show the official Kugou QR in the account panel',
        keywords: [
            'kugou login',
            'kugou scan',
            '酷狗登录',
            '酷狗音乐',
            '酷狗扫码',
            'kugou',
            'kugoudenglu',
            'kugouyinyue',
            'kg',
            'kgyy',
        ],
        execute: (_input, context) => {
            context.setPanelTab('account');
            context.setIsPanelOpen(true);
            return true;
        },
    },
];
