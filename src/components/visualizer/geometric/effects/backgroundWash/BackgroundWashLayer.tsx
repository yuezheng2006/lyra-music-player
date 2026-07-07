import React, { useMemo } from 'react';
import { drawBackgroundWash } from './drawBackgroundWash';
import {
    useInteractiveBackgroundEffect,
    type InteractiveBackgroundEffectHandle,
} from '../../interactiveBackground/InteractiveBackgroundContext';

// src/components/visualizer/geometric/effects/backgroundWash/BackgroundWashLayer.tsx
// Registers the base canvas wash on the shared interactive background loop.

const BackgroundWashLayer: React.FC = () => {
    const handle = useMemo<InteractiveBackgroundEffectHandle>(() => ({
        id: 'background-wash',
        order: 0,
        draw: (context, _state, inputs, palette) => {
            drawBackgroundWash(context, inputs.width, inputs.height, palette);
        },
    }), []);

    useInteractiveBackgroundEffect(handle, [handle]);
    return null;
};

export default BackgroundWashLayer;
