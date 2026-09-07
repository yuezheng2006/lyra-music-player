import type { VisualizerMode } from '../../types';
import type { CommandPaletteCommand } from './types';

// src/components/command-palette/visualizerCommands.ts
// Switch lyric layout modes from the command palette.

const createVisualizerCommand = (
    mode: VisualizerMode,
    title: string,
    description: string,
    keywords: string[],
): CommandPaletteCommand => ({
    id: `visualizer-${mode}`,
    group: 'visualizer',
    title,
    description,
    keywords,
    execute: (_input, context) => {
        context.setVisualizerMode(mode);
        return true;
    },
});

export const VISUALIZER_MODE_COMMANDS: CommandPaletteCommand[] = [
    createVisualizerCommand('classic', 'Visualizer: Luminous', 'Switch to classic visualizer', ['visualizer classic', 'classic', '流光', 'liuguang', 'lg']),
    createVisualizerCommand('cadenza', 'Visualizer: Mindscape', 'Switch to cadenza visualizer', ['visualizer cadenza', 'cadenza', 'mindscape', '心象', 'xinxiang', 'xx']),
    createVisualizerCommand('partita', 'Visualizer: Partita', 'Switch to partita visualizer', ['visualizer partita', 'partita', '云阶', 'yunjie', 'yj']),
    createVisualizerCommand('fume', 'Visualizer: Fume', 'Switch to fume visualizer', ['visualizer fume', 'fume', '浮名', 'fuming', 'fm']),
    createVisualizerCommand('cappella', 'Visualizer: Cappella', 'Switch to cappella visualizer', ['visualizer cappella', 'cappella', '群唱', 'qunchang', 'qc']),
    createVisualizerCommand('tilt', 'Visualizer: Tilt', 'Switch to tilt visualizer', ['visualizer tilt', 'tilt', '倾诉', 'qingsu', 'qs']),
    createVisualizerCommand('claddagh', 'Visualizer: Claddagh', 'Switch to Claddagh visualizer', ['visualizer claddagh', 'claddagh', '回环', 'jiezhi', 'jz']),
    createVisualizerCommand('monet', 'Visualizer: Monet', 'Switch to Monet visualizer', ['visualizer monet', 'monet', '莫奈', 'monai', 'mn', '切换到可视化：莫奈', '切换到可视化莫奈']),
    createVisualizerCommand('pendolo', 'Visualizer: Pendolo', 'Switch to pendolo visualizer', ['visualizer pendolo', 'pendolo', '时计', 'shiji', 'sj']),
    createVisualizerCommand('still', 'Visualizer: Still', 'Switch to static lyrics without a background renderer', ['visualizer still', 'still', '静帧', 'jingzhen', 'jz', '静态歌词']),
];
