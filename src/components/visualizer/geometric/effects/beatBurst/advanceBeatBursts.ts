import { shouldTriggerBeatBurst } from '../../../../../utils/atmosphere/rhythmPresentation';
import type { GeometricQualityProfile } from '../../geometricQuality';
import type {
    InteractiveBackgroundCompositeState,
    InteractiveBackgroundFrameInputs,
} from '../../interactiveBackground/types';

// src/components/visualizer/geometric/effects/beatBurst/advanceBeatBursts.ts
// Spawns and integrates beat-synced particle bursts.

export const advanceBeatBursts = (
    state: InteractiveBackgroundCompositeState,
    inputs: InteractiveBackgroundFrameInputs,
    profile: GeometricQualityProfile,
    dt: number,
) => {
    const burstState = state.beatBurst;
    const previousBeatPulse = burstState.lastBeatPulse;
    burstState.lastBeatPulse = inputs.beatPulse;

    if (!profile.enableBeatBursts || inputs.paused) {
        burstState.particles.length = 0;
        return;
    }

    if (shouldTriggerBeatBurst(inputs.beatPulse, previousBeatPulse)) {
        const burstCount = 4 + Math.round(inputs.beatPulse * 6 * inputs.cinemaScale);
        for (let i = 0; i < burstCount; i += 1) {
            if (burstState.particles.length >= profile.maxBeatParticles) break;
            const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.8;
            const speed = 40 + Math.random() * 120 * inputs.cinemaScale;
            burstState.particles.push({
                x: inputs.width * (0.2 + Math.random() * 0.6),
                y: inputs.height * (0.25 + Math.random() * 0.5),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                size: 1.5 + Math.random() * 3.5 * (0.6 + inputs.atmosphereEnergy),
                life: 0,
                maxLife: 0.55 + Math.random() * 0.45,
                alpha: Math.random() > 0.5 ? 0.85 : 0.65,
                useAccent: i % 2 === 0,
            });
        }
    }

    const nextParticles = [];
    for (const particle of burstState.particles) {
        particle.life += dt;
        if (particle.life >= particle.maxLife) continue;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 18 * dt;
        particle.vx *= 1 - dt * 0.8;
        nextParticles.push(particle);
    }
    burstState.particles = nextParticles;
};
