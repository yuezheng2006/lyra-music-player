import { resolvePlayerGeometricBackgroundDisabled } from '@/components/visualizer/resolveInteractive3dFumeLayering';
import type { VisualizerBackgroundMode } from '@/types';

// src/utils/visualizer/resolveAppPlayerGeometricBackgroundDisabled.ts
// Geometric background unmount policy only — mode-switch uses particle yield, not unmount.

/** True when the player shell should unmount interactive3d WebGL (video stage / non-3d policy). */
export function resolveAppPlayerGeometricBackgroundDisabled(input: {
    videoStageActive: boolean;
    backgroundMode: VisualizerBackgroundMode | null | undefined;
    settingsSubviewOpen: boolean;
}): boolean {
    return input.videoStageActive
        || resolvePlayerGeometricBackgroundDisabled(
            input.backgroundMode,
            input.settingsSubviewOpen,
        );
}
