import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import {
    BEAT_PARTICLE_SPAWN_THRESHOLD,
    MAX_BEAT_PARTICLES,
    type BeatParticleRuntimeRefs,
} from './beatParticleTypes';

// src/components/visualizer/atmosphere/useBeatParticleSpawner.ts
// Spawns short-lived particles when beatPulse crosses the spawn threshold.

type UseBeatParticleSpawnerParams = BeatParticleRuntimeRefs & {
    beatPulse: MotionValue<number>;
    cinemaScale: MotionValue<number>;
    atmosphereEnergy: MotionValue<number>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    paused: boolean;
};

export const useBeatParticleSpawner = ({
    beatPulse,
    cinemaScale,
    atmosphereEnergy,
    canvasRef,
    paused,
    particlesRef,
    cinemaScaleRef,
    energyRef,
}: UseBeatParticleSpawnerParams) => {
    const lastPulseRef = { current: 0 };

    useMotionValueEvent(beatPulse, 'change', (value) => {
        if (paused) return;
        const previous = lastPulseRef.current;
        lastPulseRef.current = value;
        if (value < BEAT_PARTICLE_SPAWN_THRESHOLD || previous >= BEAT_PARTICLE_SPAWN_THRESHOLD) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const burstCount = 4 + Math.round(value * 6 * cinemaScaleRef.current);

        for (let i = 0; i < burstCount; i += 1) {
            if (particlesRef.current.length >= MAX_BEAT_PARTICLES) break;
            const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.8;
            const speed = 40 + Math.random() * 120 * cinemaScaleRef.current;
            particlesRef.current.push({
                x: width * (0.2 + Math.random() * 0.6),
                y: height * (0.25 + Math.random() * 0.5),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                size: 1.5 + Math.random() * 3.5 * (0.6 + energyRef.current),
                life: 0,
                maxLife: 0.55 + Math.random() * 0.45,
                alpha: Math.random() > 0.5 ? 0.85 : 0.65,
                useAccent: i % 2 === 0,
            });
        }
    });

    useMotionValueEvent(cinemaScale, 'change', (value) => {
        cinemaScaleRef.current = value;
    });

    useMotionValueEvent(atmosphereEnergy, 'change', (value) => {
        energyRef.current = value;
    });
};
