import type { BeatParticle } from '../../atmosphere/beatParticleTypes';
import type { BloomParticle } from '../effects/bloomParticle/buildBloomParticles';
import type { FloatingParticle } from '../effects/floatingParticle/buildFloatingParticles';
import type { OrbitParticle } from '../buildOrbitParticles';
import type { MineradioVisualPresetId } from '../../../../types';

// src/components/visualizer/geometric/interactiveBackground/types.ts
// Shared contracts for composable interactive background canvas effects.

export interface InteractiveBackgroundPalette {
    primary: string;
    secondary: string;
    accent: string;
    primarySoft: string;
    secondarySoft: string;
    accentSoft: string;
}

export interface InteractiveBackgroundFrameInputs {
    now: number;
    width: number;
    height: number;
    beatPulse: number;
    cinemaScale: number;
    cameraPunch: number;
    atmosphereEnergy: number;
    bassLevel: number;
    pointerX: number;
    pointerY: number;
    paused: boolean;
    visualPreset: MineradioVisualPresetId;
    rhythmIntensity: number;
}

export interface BassRipple {
    x: number;
    y: number;
    radius: number;
    strength: number;
    life: number;
    maxLife: number;
}

export interface InteractiveBackgroundCompositeState {
    orbit: {
        particles: OrbitParticle[];
    };
    bassRipple: {
        ripples: BassRipple[];
        lastBassLevel: number;
        rippleCooldown: number;
    };
    beatBurst: {
        particles: BeatParticle[];
        lastBeatPulse: number;
    };
    bloom: {
        particles: BloomParticle[];
    };
    floating: {
        particles: FloatingParticle[];
    };
    palette: InteractiveBackgroundPalette | null;
}

export const createInteractiveBackgroundCompositeState = (): InteractiveBackgroundCompositeState => ({
    orbit: { particles: [] },
    bassRipple: {
        ripples: [],
        lastBassLevel: 0,
        rippleCooldown: 0,
    },
    beatBurst: {
        particles: [],
        lastBeatPulse: 0,
    },
    bloom: { particles: [] },
    floating: { particles: [] },
    palette: null,
});
