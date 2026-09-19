import type { MineradioVisualPresetId } from '../../../../../types';
import type { CoverParticlePresetRuntimeProfile } from '../coverParticlePresetRuntime';
import type { CoverParticleUniforms } from '../coverParticleMaterials';

// src/components/visualizer/geometric/webgl/presets/types.ts
// Shared contracts for cover-particle visual preset modules.

export interface CoverParticlePresetOrbitBaseline {
    theta: number;
    phi: number;
    radius: number;
}

export interface CoverParticlePresetApplyContext {
    uniforms: CoverParticleUniforms;
    intensity: number;
    smartAtmosphereEnabled: boolean;
    elapsed: number;
    vinylSpin: number;
}

export interface CoverParticlePresetModule {
    id: MineradioVisualPresetId;
    /** Shader `uPreset` index. */
    shaderPresetIndex: number;
    moduleName: string;
    supportsBassRipples: boolean;
    /** Hide cover/bloom points (retired quantum path). */
    hidesParticlePoints: boolean;
    orbitBaseline: CoverParticlePresetOrbitBaseline;
    resolveRuntimeProfile: () => CoverParticlePresetRuntimeProfile;
    /** Apply per-preset uniform differences after shared audio uniforms are set. */
    applyUniforms: (ctx: CoverParticlePresetApplyContext) => void;
    /** CSS wash behind the WebGL canvas (stage shell). */
    resolveStageBackground: () => string;
}
