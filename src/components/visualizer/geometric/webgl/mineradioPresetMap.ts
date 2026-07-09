import type { MineradioVisualPresetId } from '../../../../types';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';

// src/components/visualizer/geometric/webgl/mineradioPresetMap.ts
// Maps interactive 3D visual presets to cover particle shader uPreset indices.

export const INTERACTIVE3D_WEBGL_PRESET_INDEX: Record<MineradioVisualPresetId, number> = {
    emily: 0,
    starfield: 1,
    tunnel: 5,
    nebula: 2,
    terrain: 3,
    quantumCube: 4,
    aurora: 6,
    mineradioTunnel: 7,
    mineradioOrbit: 8,
    mineradioVoid: 9,
    mineradioVinyl: 10,
    mineradioGalaxy: 11,
};

/** @deprecated use INTERACTIVE3D_WEBGL_PRESET_INDEX */
export const MINERADIO_WEBGL_PRESET_INDEX = INTERACTIVE3D_WEBGL_PRESET_INDEX;

export const shouldRenderMineradioWebGL = (
    _visualPreset: MineradioVisualPresetId,
    enableCoverParticles: boolean,
): boolean => enableCoverParticles;

export const resolveWebGLPresetIndex = (visualPreset: MineradioVisualPresetId): number =>
    INTERACTIVE3D_WEBGL_PRESET_INDEX[normalizeInteractive3dVisualPreset(visualPreset)] ?? 0;
