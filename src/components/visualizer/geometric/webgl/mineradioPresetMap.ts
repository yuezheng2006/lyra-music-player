import type { MineradioVisualPresetId } from '../../../../types';

// src/components/visualizer/geometric/webgl/mineradioPresetMap.ts
// Maps interactive 3D visual presets to cover particle shader uPreset indices.

export const INTERACTIVE3D_WEBGL_PRESET_INDEX: Record<MineradioVisualPresetId, number> = {
    emily: 0,
    tunnel: 1,
    starfield: 5,
};

/** @deprecated use INTERACTIVE3D_WEBGL_PRESET_INDEX */
export const MINERADIO_WEBGL_PRESET_INDEX = INTERACTIVE3D_WEBGL_PRESET_INDEX;

export const shouldRenderMineradioWebGL = (
    _visualPreset: MineradioVisualPresetId,
    enableCoverParticles: boolean,
): boolean => enableCoverParticles;

export const resolveWebGLPresetIndex = (visualPreset: MineradioVisualPresetId): number =>
    INTERACTIVE3D_WEBGL_PRESET_INDEX[visualPreset] ?? 0;
