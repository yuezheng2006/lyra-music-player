import type { CommandPaletteCommand } from './types';

// src/components/command-palette/backgroundNomandCommands.ts
// Command-palette actions for the Nomand Paper-effect background.

export const NOMAND_BACKGROUND_COMMANDS: CommandPaletteCommand[] = [
    {
        id: 'background-nomand',
        group: 'visualizer',
        title: 'Background: Nomand',
        description: 'Switch background to Paper image effects',
        keywords: [
            'nomand',
            'paper',
            'dithering',
            'fluted glass',
            '漫游',
            '像素画',
            '纹理玻璃',
            'my',
            '背景切换到漫游',
            '背景切换到 Nomand',
        ],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('nomand');
            return true;
        },
    },
    {
        id: 'background-nomand-dithering',
        group: 'visualizer',
        title: 'Nomand: Dithering',
        description: 'Switch Nomand to the dithering effect',
        keywords: ['nomand dithering', '漫游像素画', '像素画', 'myssh', '背景切换到漫游：像素画'],
        execute: (_input, context) => {
            context.setVisualizerBackgroundMode('nomand');
            context.setNomandBackgroundTuning({ effect: 'dithering' });
            return true;
        },
    },
];
