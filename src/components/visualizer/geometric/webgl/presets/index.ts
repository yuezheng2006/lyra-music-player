import type { MineradioVisualPresetId } from '../../../../../types';
import { normalizeInteractive3dVisualPreset } from '../../mineradioVisualPresets';
import { emilyPreset } from './emilyPreset';
import { galaxyPreset } from './galaxyPreset';
import { tunnelPreset } from './tunnelPreset';
import type { CoverParticlePresetModule } from './types';

// src/components/visualizer/geometric/webgl/presets/index.ts
// Registry of shipped cover-particle visual preset modules.

export type { CoverParticlePresetModule, CoverParticlePresetApplyContext } from './types';
export { emilyPreset } from './emilyPreset';
export { tunnelPreset } from './tunnelPreset';
export { galaxyPreset } from './galaxyPreset';

/** Shipped interactive3d visual presets (UI-exposed). */
export const COVER_PARTICLE_PRESET_MODULES: CoverParticlePresetModule[] = [
    emilyPreset,
    tunnelPreset,
    galaxyPreset,
];

const PRESET_BY_ID: Record<string, CoverParticlePresetModule> = {
    emily: emilyPreset,
    mineradioTunnel: tunnelPreset,
    mineradioGalaxy: galaxyPreset,
    // Legacy ids normalize to shipped modules before lookup; keep aliases for safety.
    mineradioOrbit: emilyPreset,
    mineradioVinyl: emilyPreset,
    mineradioVoid: emilyPreset,
    starfield: emilyPreset,
    nebula: emilyPreset,
    quantumCube: emilyPreset,
    aurora: galaxyPreset,
};

/** Resolve the active preset module after legacy-id normalization. */
export const resolveCoverParticlePresetModule = (
    preset: unknown = 'emily',
): CoverParticlePresetModule => {
    const normalized = normalizeInteractive3dVisualPreset(preset) as MineradioVisualPresetId;
    return PRESET_BY_ID[normalized] ?? emilyPreset;
};

export const INTERACTIVE3D_VISUAL_PRESET_REGISTRY = COVER_PARTICLE_PRESET_MODULES.map((module) => ({
    id: module.id,
    moduleName: module.moduleName,
    shaderPresetIndex: module.shaderPresetIndex,
    supportsBassRipples: module.supportsBassRipples,
}));
