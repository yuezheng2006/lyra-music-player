import React from 'react';
import { type VisualizerMode } from '../../types';
import { resolveVisualizerBackgroundMode } from '../../stores/useSettingsUiStore';
import { type VisualizerSharedProps } from './definition';
import { getVisualizerRegistryEntry } from './registry';

interface VisualizerRendererProps extends VisualizerSharedProps {
    mode: VisualizerMode;
}

const VisualizerRenderer: React.FC<VisualizerRendererProps> = ({ mode, ...props }) => {
    const resolvedBackgroundMode = resolveVisualizerBackgroundMode(props.visualizerBackgroundMode, mode);
    return getVisualizerRegistryEntry(mode).render({
        ...props,
        visualizerMode: mode,
        resolvedVisualizerBackgroundMode: resolvedBackgroundMode,
        mineradioStageActive: resolvedBackgroundMode === 'interactive3d',
    });
};

export default VisualizerRenderer;
