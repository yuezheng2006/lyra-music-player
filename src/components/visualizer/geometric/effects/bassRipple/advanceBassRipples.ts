import type { GeometricQualityProfile } from '../../geometricQuality';
import type {
    InteractiveBackgroundCompositeState,
    InteractiveBackgroundFrameInputs,
} from '../../interactiveBackground/types';

// src/components/visualizer/geometric/effects/bassRipple/advanceBassRipples.ts
// Spawns and integrates bass-triggered ripple rings (Mineradio 9-grid for Emily preset).

const EMILY_RIPPLE_REGIONS = Array.from({ length: 9 }, (_, index) => {
    const rx = index % 3;
    const ry = Math.floor(index / 3);
    return {
        nx: (rx / 2 - 0.5) * 0.72,
        ny: (ry / 2 - 0.5) * 0.72,
    };
});

const spawnRipple = (
    state: InteractiveBackgroundCompositeState,
    inputs: InteractiveBackgroundFrameInputs,
    x: number,
    y: number,
    strength: number,
) => {
    if (state.bassRipple.ripples.length >= 8) return;
    state.bassRipple.ripples.push({
        x,
        y,
        radius: 12 + Math.random() * 18,
        strength,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
    });
};

export const advanceBassRipples = (
    state: InteractiveBackgroundCompositeState,
    inputs: InteractiveBackgroundFrameInputs,
    profile: GeometricQualityProfile,
    dt: number,
) => {
    const rippleState = state.bassRipple;
    if (!profile.enableRipples || inputs.paused) {
        rippleState.ripples.length = 0;
        return;
    }

    rippleState.rippleCooldown = Math.max(0, rippleState.rippleCooldown - dt * 0.8);
    const bassRising = inputs.bassLevel > rippleState.lastBassLevel + 0.035;
    rippleState.lastBassLevel = inputs.bassLevel;
    const bassHit = bassRising && inputs.bassLevel > 0.38;

    if (bassHit && rippleState.rippleCooldown <= 0) {
        rippleState.rippleCooldown = inputs.visualPreset === 'emily' ? 0.45 : 1;
        const cx = inputs.width * 0.5 + (inputs.pointerX - 0.5) * inputs.width * 0.04;
        const cy = inputs.height * 0.5 + (inputs.pointerY - 0.5) * inputs.height * 0.03;

        if (inputs.visualPreset === 'emily') {
            const count = 2 + (Math.random() < 0.5 ? 0 : 1);
            const used = new Set<number>();
            for (let k = 0; k < count; k += 1) {
                let idx = Math.floor(Math.random() * EMILY_RIPPLE_REGIONS.length);
                let tries = 0;
                while (used.has(idx) && tries < 12) {
                    idx = Math.floor(Math.random() * EMILY_RIPPLE_REGIONS.length);
                    tries += 1;
                }
                used.add(idx);
                const region = EMILY_RIPPLE_REGIONS[idx];
                const jx = cx + region.nx * inputs.width * 0.36 + (Math.random() - 0.5) * inputs.width * 0.04;
                const jy = cy + region.ny * inputs.height * 0.36 + (Math.random() - 0.5) * inputs.height * 0.04;
                const strength = 0.65 + inputs.bassLevel * 1.4 * inputs.rhythmIntensity + Math.random() * 0.25;
                spawnRipple(state, inputs, jx, jy, strength);
            }
        } else {
            const spawnCount = inputs.cameraPunch > 0.35 ? 3 : 2;
            for (let i = 0; i < spawnCount; i += 1) {
                spawnRipple(
                    state,
                    inputs,
                    cx + (Math.random() - 0.5) * inputs.width * 0.08,
                    cy + (Math.random() - 0.5) * inputs.height * 0.08,
                    0.65 + inputs.bassLevel * 0.8 * inputs.rhythmIntensity + inputs.cameraPunch * 0.25,
                );
            }
        }
    }

    const nextRipples = [];
    for (const ripple of rippleState.ripples) {
        ripple.life += dt;
        if (ripple.life >= ripple.maxLife) continue;
        ripple.radius += (80 + ripple.strength * 120) * dt;
        nextRipples.push(ripple);
    }
    rippleState.ripples = nextRipples;
};
