import React, { useMemo } from 'react';
import type { GeometricQualityProfile } from '../../geometricQuality';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';
import { advanceBeatBursts } from './advanceBeatBursts';
import { drawBeatBursts } from './drawBeatBursts';

// src/components/visualizer/geometric/effects/beatBurst/BeatBurstLayer.tsx
// Registers beat-synced particle bursts on the shared interactive background canvas.

interface BeatBurstLayerProps {
    enabled: boolean;
    qualityProfile: GeometricQualityProfile;
}

const BeatBurstLayer: React.FC<BeatBurstLayerProps> = ({ enabled, qualityProfile }) => {
    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'beat-burst',
        order: 30,
        advance: (state, inputs, profile, dt) => {
            advanceBeatBursts(state, inputs, enabled ? profile : { ...profile, enableBeatBursts: false }, dt);
        },
        draw: (context, state, inputs, palette) => {
            if (inputs.paused || !enabled || !qualityProfile.enableBeatBursts) return;
            drawBeatBursts(context, state.beatBurst.particles, palette, inputs.atmosphereEnergy);
        },
    }), [enabled, qualityProfile.enableBeatBursts]);

    useInteractiveBackgroundEffect(handle, [handle, enabled, qualityProfile.enableBeatBursts]);
    return null;
};

export default BeatBurstLayer;
