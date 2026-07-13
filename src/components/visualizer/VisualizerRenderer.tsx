import React from 'react';
import { type VisualizerMode } from '../../types';
import { resolveVisualizerBackgroundMode } from '../../stores/useSettingsUiStore';
import { type VisualizerSharedProps } from './definition';
import { useVisualizerRegistryEntry } from './registry';

// src/components/visualizer/VisualizerRenderer.tsx

interface VisualizerRendererProps extends VisualizerSharedProps {
    mode: VisualizerMode;
}

const VisualizerRenderer: React.FC<VisualizerRendererProps> = ({ mode, ...props }) => {
    const entry = useVisualizerRegistryEntry(mode);
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(props.visualizerBackgroundMode, mode);

    if (!entry) {
        return null;
    }

    return entry.render({
        ...props,
        visualizerMode: mode,
        resolvedVisualizerBackgroundMode: resolvedBackgroundMode,
        mineradioStageActive: resolvedBackgroundMode === 'interactive3d',
    });
};

export default VisualizerRenderer;
