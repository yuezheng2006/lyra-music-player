// src/types/visualizerModes.ts
// Static builtin mode ids so persistence / OBS / import can validate without importing registry.tsx.

export const BUILTIN_VISUALIZER_MODES = [
    'still',
    'classic',
    'cadenza',
    'partita',
    'fume',
    'tilt',
    'claddagh',
    'pendolo',
    'monet',
    'cappella',
] as const;

export type BuiltinVisualizerMode = typeof BUILTIN_VISUALIZER_MODES[number];

export const DEFAULT_VISUALIZER_MODE: BuiltinVisualizerMode = 'classic';

const BUILTIN_VISUALIZER_MODE_SET = new Set<string>(BUILTIN_VISUALIZER_MODES);

export const isBuiltinVisualizerMode = (mode: string | null | undefined): mode is BuiltinVisualizerMode => (
    Boolean(mode) && BUILTIN_VISUALIZER_MODE_SET.has(mode as string)
);
