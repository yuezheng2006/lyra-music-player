import React, { useMemo } from 'react';
import type { Interactive3dSceneTuning } from '../../../../../types';
import type { GeometricQualityProfile } from '../../geometricQuality';
import { scaleParticleTarget } from '../../geometricQuality';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';
import { buildBloomParticles } from './buildBloomParticles';
import { drawBloomParticles } from './drawBloomParticles';

// src/components/visualizer/geometric/effects/bloomParticle/BloomParticleLayer.tsx
// Mineradio bloom particle layer registered on the shared canvas loop.

interface BloomParticleLayerProps {
    seed?: string | number;
    qualityProfile: GeometricQualityProfile;
    sceneTuning?: Interactive3dSceneTuning;
}

const BloomParticleLayer: React.FC<BloomParticleLayerProps> = ({
    seed,
    qualityProfile,
    sceneTuning,
}) => {
    const bloomStrength = sceneTuning?.bloomStrength ?? 0.62;
    const rhythmIntensity = sceneTuning?.rhythmIntensity ?? 0.85;

    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'bloom-particles',
        order: 25,
        onResize: (state, width, height, profile) => {
            const target = Math.min(320, Math.round(scaleParticleTarget(profile, width * height) * 0.42));
            state.bloom.particles = buildBloomParticles(target, seed);
        },
        draw: (context, state, inputs, palette) => {
            if (inputs.paused) return;
            drawBloomParticles(
                context,
                state.bloom.particles,
                inputs,
                palette,
                bloomStrength,
                rhythmIntensity,
            );
        },
    }), [bloomStrength, rhythmIntensity, seed]);

    useInteractiveBackgroundEffect(handle, [handle, qualityProfile.particleTarget]);
    return null;
};

export default BloomParticleLayer;
