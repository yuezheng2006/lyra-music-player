import type { VisualizerBackgroundMode } from '../../types';

// src/components/visualizer/resolveShellGeometricBackground.ts
// Keeps per-mode geometric preferences from overriding interactive 3D backgrounds.

export const resolveShellGeometricBackgroundDisabled = (
    appDisabled: boolean,
    backgroundMode: VisualizerBackgroundMode | undefined,
    modePrefersDisabled = false,
): boolean => {
    if (backgroundMode === 'interactive3d') {
        return appDisabled;
    }
    return appDisabled || modePrefersDisabled;
};
