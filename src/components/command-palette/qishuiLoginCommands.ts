import type { CommandPaletteCommand } from './types';

// src/components/command-palette/qishuiLoginCommands.ts
// Open the account panel for Qishui official web login.

export const QISHUI_LOGIN_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'qishui-scan-login',
        group: 'panel',
        title: 'Log in to Qishui Music',
        description: 'Open the account panel to scan the official Qishui / Douyin QR code',
        keywords: [
            'qishui login',
            'soda music',
            'qishui scan',
            '汽水登录',
            '汽水音乐',
            '汽水扫码',
            'qishui',
            'qishuidenglu',
            'qishuiyinyue',
            'qs',
            'qsyy',
        ],
        execute: (_input, context) => {
            context.setPanelTab('account');
            context.setIsPanelOpen(true);
            return true;
        },
    },
];
