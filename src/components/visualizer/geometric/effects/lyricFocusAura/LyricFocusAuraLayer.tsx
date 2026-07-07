import React, { useMemo } from 'react';
import { drawLyricFocusAura } from './drawLyricFocusAura';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';

// src/components/visualizer/geometric/effects/lyricFocusAura/LyricFocusAuraLayer.tsx
// Beat-reactive glow behind the lyric focal point on the shared canvas.

const LyricFocusAuraLayer: React.FC = () => {
    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'lyric-focus-aura',
        order: 15,
        draw: (context, _state, inputs, palette) => {
            if (inputs.paused) return;
            drawLyricFocusAura(context, inputs, palette.accentSoft);
        },
    }), []);

    useInteractiveBackgroundEffect(handle, [handle]);
    return null;
};

export default LyricFocusAuraLayer;
