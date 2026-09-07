import type * as THREE from 'three';
import type { AudioBands, Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { CoverParticleAudioSmoother } from './coverParticleAudioUniforms';
import type { CoverParticleBurstSmoother } from './coverParticleBurstSmoother';
import type { CoverParticleUniforms } from './coverParticleMaterials';
import type { CoverParticleRippleField } from './coverParticleRipples';
import { resolveCoverParticlePointScale } from './coverParticleDisplayTuning';
import { resolveCoverParticlePresetModule } from './presets';
import {
    shouldEnableBassRippleWebGL,
    tickBassRippleWebGL,
} from './effects/bassRippleWebGL';
import { applyBloomWebGL } from './effects/bloomWebGL';

// src/components/visualizer/geometric/webgl/coverParticleCoverTick.ts
// One cover-mode frame: audio, preset uniforms, bass ripple, bloom.

export interface CoverParticleCoverTickResult {
    presetModule: ReturnType<typeof resolveCoverParticlePresetModule>;
    presetProfile: ReturnType<ReturnType<typeof resolveCoverParticlePresetModule>['resolveRuntimeProfile']>;
    audioUniforms: {
        bass: number;
        mid: number;
        treble: number;
        beat: number;
        energy: number;
    };
    vinylSpin: number;
}

/** Advance cover-particle uniforms for one rendered frame. */
export const tickCoverParticleCoverFrame = (input: {
    uniforms: CoverParticleUniforms;
    tuning?: Interactive3dSceneTuning;
    qualityProfile?: GeometricQualityProfile;
    audioSmoother: CoverParticleAudioSmoother;
    burstSmoother: CoverParticleBurstSmoother;
    rippleField: CoverParticleRippleField;
    bloomPoints: THREE.Points | null;
    coverPoints: THREE.Points | null;
    audioBands?: AudioBands;
    directedBeat: number;
    intensity: number;
    dt: number;
    elapsed: number;
    musicActive: boolean;
    directedAtmosphereEnergy: number;
    smartAtmosphereEnabled: boolean;
    vinylSpin: number;
    coverResolution: number;
    contrastLift: number;
    pointerX: number;
    pointerY: number;
    pointerActive: boolean;
    interactivePointer: { x: number; y: number; active: boolean };
}): CoverParticleCoverTickResult => {
    const presetModule = resolveCoverParticlePresetModule(input.tuning?.visualPreset);
    const presetProfile = presetModule.resolveRuntimeProfile();
    const audioUniforms = input.audioSmoother.tick(
        input.audioBands,
        input.directedBeat,
        input.intensity,
        input.dt,
        input.musicActive,
        input.directedAtmosphereEnergy,
        presetModule.id,
    );
    const burstAmt = input.burstSmoother.tick(audioUniforms.beat, input.dt);
    const rippleEnabled = shouldEnableBassRippleWebGL({
        tuning: input.tuning,
        qualityProfile: input.qualityProfile,
        presetModule,
        smartAtmosphereEnabled: input.smartAtmosphereEnabled,
    });
    const rippleCount = tickBassRippleWebGL({
        rippleField: input.rippleField,
        dt: input.dt,
        elapsed: input.elapsed,
        bass: audioUniforms.bass,
        mid: audioUniforms.mid,
        treble: audioUniforms.treble,
        enabled: rippleEnabled,
        paused: !input.musicActive,
    });
    applyBloomWebGL({
        tuning: input.tuning,
        tier: input.qualityProfile?.tier ?? 'balanced',
        smartAtmosphereEnabled: input.smartAtmosphereEnabled,
        presetModule,
        uniforms: input.uniforms,
        bloomPoints: input.bloomPoints,
        coverPoints: input.coverPoints,
    });

    const { uniforms } = input;
    uniforms.uRippleCount.value = rippleCount;
    uniforms.uTime.value = input.elapsed;
    uniforms.uSpeed.value = (
        input.smartAtmosphereEnabled
            ? 0.85 + input.intensity * 0.35
            : 0.34 + input.intensity * 0.18
    ) * presetProfile.speedMul;
    uniforms.uIntensity.value = input.intensity;
    uniforms.uCoverRes.value = input.coverResolution;
    uniforms.uBass.value = audioUniforms.bass;
    uniforms.uMid.value = audioUniforms.mid;
    uniforms.uTreble.value = audioUniforms.treble;
    uniforms.uBeat.value = audioUniforms.beat;
    uniforms.uEnergy.value = audioUniforms.energy;
    uniforms.uBurstAmt.value = burstAmt;
    uniforms.uPointScale.value = resolveCoverParticlePointScale(presetProfile.pointScale);
    const vinylSpin = (
        input.vinylSpin + input.dt * (0.40 + audioUniforms.bass * 0.09) * uniforms.uSpeed.value
    ) % (Math.PI * 2);
    uniforms.uVinylSpin.value = vinylSpin;
    if (input.interactivePointer.active) {
        uniforms.uMouseXY.value.set(input.interactivePointer.x, input.interactivePointer.y);
        uniforms.uMouseActive.value = 1;
    } else {
        uniforms.uMouseXY.value.set(input.pointerX * 2.1, input.pointerY * 2.1);
        uniforms.uMouseActive.value = input.pointerActive ? 1 : 0;
    }
    uniforms.uParticleDim.value = input.contrastLift;

    presetModule.applyUniforms({
        uniforms,
        intensity: input.intensity,
        smartAtmosphereEnabled: input.smartAtmosphereEnabled,
        elapsed: input.elapsed,
        vinylSpin,
    });

    return {
        presetModule,
        presetProfile,
        audioUniforms,
        vinylSpin,
    };
};
