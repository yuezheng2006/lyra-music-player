import type { VisualizerBackgroundMode } from '../../types';

// src/components/visualizer/resolveInteractive3dFumeLayering.ts
// Keeps WebGL cover background and Fume lyric canvas composited without double backgrounds.

export const isInteractive3dBackgroundMode = (
    backgroundMode: VisualizerBackgroundMode | undefined,
): boolean => backgroundMode === 'interactive3d';

/** Fume canvas should not paint its own geometric backdrop when Shell already renders 3D cover stage. */
export const shouldDrawFumeCanvasBackground = (
    backgroundMode: VisualizerBackgroundMode | undefined,
    staticMode: boolean,
): boolean => !isInteractive3dBackgroundMode(backgroundMode) && !staticMode;

/** Shell keeps WebGL geometric background visible even while player settings sub-panels are open. */
export const resolvePlayerGeometricBackgroundDisabled = (
    backgroundMode: VisualizerBackgroundMode | undefined,
    settingsSubviewOpen: boolean,
): boolean => {
    if (isInteractive3dBackgroundMode(backgroundMode)) {
        return false;
    }
    return settingsSubviewOpen || !isInteractive3dBackgroundMode(backgroundMode);
};
