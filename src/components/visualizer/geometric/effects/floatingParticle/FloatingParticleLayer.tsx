import React, { useMemo } from 'react';
import type { Interactive3dSceneTuning } from '../../../../../types';
import type { GeometricQualityProfile } from '../../geometricQuality';
import { scaleParticleTarget } from '../../geometricQuality';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';
import { buildFloatingParticles } from './buildFloatingParticles';
import { drawFloatingParticles } from './drawFloatingParticles';

// src/components/visualizer/geometric/effects/floatingParticle/FloatingParticleLayer.tsx
// Mineradio floating particle layer registered on the shared canvas loop.

interface FloatingParticleLayerProps {
    seed?: string | number;
    qualityProfile: GeometricQualityProfile;
    sceneTuning?: Interactive3dSceneTuning;
}

const FloatingParticleLayer: React.FC<FloatingParticleLayerProps> = ({
    seed,
    qualityProfile,
    sceneTuning,
}) => {
    const rhythmIntensity = sceneTuning?.rhythmIntensity ?? 0.85;

    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'floating-particles',
        order: 15,
        onResize: (state, width, height, profile) => {
            const target = Math.min(520, Math.round(scaleParticleTarget(profile, width * height) * 0.55));
            state.floating.particles = buildFloatingParticles(target, seed);
        },
        draw: (context, state, inputs, palette) => {
            if (inputs.paused) return;
            drawFloatingParticles(context, state.floating.particles, inputs, palette, rhythmIntensity);
        },
    }), [rhythmIntensity, seed]);

    useInteractiveBackgroundEffect(handle, [handle, qualityProfile.particleTarget]);
    return null;
};

export default FloatingParticleLayer;
