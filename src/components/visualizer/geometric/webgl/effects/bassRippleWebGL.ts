import type { Interactive3dSceneTuning } from '../../../../../types';
import type { GeometricQualityProfile } from '../../geometricQuality';
import type { CoverParticleRippleField } from '../coverParticleRipples';
import type { CoverParticlePresetModule } from '../presets/types';

// src/components/visualizer/geometric/webgl/effects/bassRippleWebGL.ts
// WebGL bass-ripple effect gate + tick for cover particles (emily-only).

export const BASS_RIPPLE_WEBGL_EFFECT = {
    id: 'bass-ripple' as const,
    tuningKey: 'enableBassRipples' as const,
    moduleName: 'bassRippleWebGL',
};

/** Whether bass ripples should advance for the current preset / quality / tuning. */
export const shouldEnableBassRippleWebGL = (input: {
    tuning?: Interactive3dSceneTuning;
    qualityProfile?: GeometricQualityProfile;
    presetModule: CoverParticlePresetModule;
    smartAtmosphereEnabled: boolean;
}): boolean => (
    input.smartAtmosphereEnabled
    && input.presetModule.supportsBassRipples
    && (input.tuning?.enableBassRipples ?? true)
    && (input.qualityProfile?.enableRipples ?? true)
);

/** Tick ripple field and return active slot count for `uRippleCount`. */
export const tickBassRippleWebGL = (input: {
    rippleField: CoverParticleRippleField;
    dt: number;
    elapsed: number;
    bass: number;
    mid: number;
    treble: number;
    enabled: boolean;
    paused: boolean;
}): number => input.rippleField.tick(
    input.dt,
    input.elapsed,
    input.bass,
    input.mid,
    input.treble,
    input.enabled,
    input.paused,
);
