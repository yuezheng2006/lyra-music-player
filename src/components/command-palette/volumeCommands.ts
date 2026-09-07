import type { CommandPaletteCommand } from './types';
import { parseVolumeCommandInput } from '../../utils/playback/parseVolumeCommandInput';

// src/components/command-palette/volumeCommands.ts
// Set absolute volume from the command palette (Folia-style numeric volume).

export const VOLUME_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'playback-volume-set',
        group: 'playback',
        title: 'Set volume',
        description: 'Set playback volume to 0–100',
        keywords: ['volume', 'set volume', '音量', '设置音量', 'yinliang', 'yl'],
        placeholder: '50',
        requiresInput: true,
        getPreview: (input, context) => {
            const next = parseVolumeCommandInput(input);
            if (next == null) {
                return context.t('commandPalette.previewVolumeSetEmpty', 'Type a volume: 50 or 50%');
            }
            return context.t('commandPalette.previewVolumeSet', 'Set volume to {{percent}}%')
                .replace('{{percent}}', String(Math.round(next * 100)));
        },
        execute: (input, context) => {
            const next = parseVolumeCommandInput(input);
            if (next == null) return false;
            context.setVolume(next);
            return true;
        },
    },
];
