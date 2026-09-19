import type { VisualizerBackgroundMode } from '../../types';

// src/utils/visualizer/retiredVisualizerBackgroundModes.ts
// interactive3d was retired: Electron could only run lite/skip-frame, and the live path
// had already fallen back to CSS cover-blur. Stored values map to common.

export const RETIRED_VISUALIZER_BACKGROUND_MODES = ['interactive3d'] as const;

export type RetiredVisualizerBackgroundMode = typeof RETIRED_VISUALIZER_BACKGROUND_MODES[number];

export const isRetiredVisualizerBackgroundMode = (
    mode: string | null | undefined,
): mode is RetiredVisualizerBackgroundMode => mode === 'interactive3d';

/** Maps a stored or requested background mode onto a still-supported engine. */
export const migrateVisualizerBackgroundMode = (
    mode: VisualizerBackgroundMode | null | undefined,
): VisualizerBackgroundMode | null => {
    if (!mode) return null;
    if (isRetiredVisualizerBackgroundMode(mode)) return 'common';
    return mode;
};
