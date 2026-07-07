import React, { useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import type { Theme } from '../../../types';
import { useBeatParticleCanvas } from './useBeatParticleCanvas';
import { useBeatParticleSpawner } from './useBeatParticleSpawner';
import type { BeatParticle } from './beatParticleTypes';

// src/components/visualizer/atmosphere/AtmosphereParticleLayer.tsx
// Beat-synced ambient particles inspired by Mineradio pulse/camera beat feedback.

interface AtmosphereParticleLayerProps {
    theme: Theme;
    beatPulse: MotionValue<number>;
    cinemaScale: MotionValue<number>;
    atmosphereEnergy: MotionValue<number>;
    paused?: boolean;
}

const AtmosphereParticleLayer: React.FC<AtmosphereParticleLayerProps> = ({
    theme,
    beatPulse,
    cinemaScale,
    atmosphereEnergy,
    paused = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<BeatParticle[]>([]);
    const cinemaScaleRef = useRef(0.82);
    const energyRef = useRef(0.42);

    useBeatParticleSpawner({
        beatPulse,
        cinemaScale,
        atmosphereEnergy,
        canvasRef,
        paused,
        particlesRef,
        cinemaScaleRef,
        energyRef,
    });

    useBeatParticleCanvas({
        canvasRef,
        theme,
        paused,
        particlesRef,
        cinemaScaleRef,
        energyRef,
    });

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-[1]"
            aria-hidden="true"
        />
    );
};

export default AtmosphereParticleLayer;
