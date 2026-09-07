import type { CommandPaletteCommand } from './types';
import { buildObsCustomCss } from '../../utils/obs/buildObsCustomCss';

// src/components/command-palette/obsCommands.ts
// Copy OBS overlay Custom CSS from the command palette.

export const OBS_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'copy-obs-custom-css',
        group: 'settings',
        title: 'Copy OBS Custom CSS',
        description: 'Copy uploaded visualizer assets as OBS Browser Source Custom CSS',
        keywords: ['obs css', 'custom css', 'obs资源', 'obs样式', 'obscss'],
        execute: async () => {
            try {
                const result = await buildObsCustomCss();
                await navigator.clipboard.writeText(result.css);
                return true;
            } catch {
                return false;
            }
        },
    },
];
