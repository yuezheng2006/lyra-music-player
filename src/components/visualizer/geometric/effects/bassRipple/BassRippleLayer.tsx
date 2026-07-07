import React, { useMemo } from 'react';
import type { GeometricQualityProfile } from '../../geometricQuality';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';
import { advanceBassRipples } from './advanceBassRipples';
import { drawBassRipples } from './drawBassRipples';

// src/components/visualizer/geometric/effects/bassRipple/BassRippleLayer.tsx
// Registers bass-driven ripple rings on the shared interactive background canvas.

interface BassRippleLayerProps {
    qualityProfile: GeometricQualityProfile;
}

const BassRippleLayer: React.FC<BassRippleLayerProps> = ({ qualityProfile }) => {
    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'bass-ripple',
        order: 10,
        advance: (state, inputs, profile, dt) => {
            advanceBassRipples(state, inputs, profile, dt);
        },
        draw: (context, state, inputs, palette) => {
            if (inputs.paused || !qualityProfile.enableRipples) return;
            drawBassRipples(context, state.bassRipple.ripples, palette);
        },
    }), [qualityProfile.enableRipples]);

    useInteractiveBackgroundEffect(handle, [handle, qualityProfile.enableRipples]);
    return null;
};

export default BassRippleLayer;
