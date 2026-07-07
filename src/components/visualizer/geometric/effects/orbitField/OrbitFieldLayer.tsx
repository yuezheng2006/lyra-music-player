import React, { useMemo } from 'react';
import { buildOrbitParticles } from '../../buildOrbitParticles';
import type { GeometricQualityProfile } from '../../geometricQuality';
import { scaleParticleTarget } from '../../geometricQuality';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';
import { drawOrbitField } from './drawOrbitField';

// src/components/visualizer/geometric/effects/orbitField/OrbitFieldLayer.tsx
// Registers orbit particles on the shared interactive background canvas.

interface OrbitFieldLayerProps {
    seed?: string | number;
    qualityProfile: GeometricQualityProfile;
}

const OrbitFieldLayer: React.FC<OrbitFieldLayerProps> = ({ seed, qualityProfile }) => {
    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'orbit-field',
        order: 20,
        onResize: (state, width, height, profile) => {
            const target = scaleParticleTarget(profile, width * height);
            state.orbit.particles = buildOrbitParticles(seed, target);
        },
        draw: (context, state, inputs, palette) => {
            if (inputs.paused) return;
            drawOrbitField(context, state.orbit.particles, inputs, palette);
        },
    }), [seed]);

    useInteractiveBackgroundEffect(handle, [handle, qualityProfile.particleTarget]);
    return null;
};

export default OrbitFieldLayer;
