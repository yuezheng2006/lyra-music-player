import React from 'react';
import { DEFAULT_PENDOLO_TUNING } from '../../../types';
import { defineVisualizer } from '../definition';
import PendoloSettingsPanel from './PendoloSettingsPanel';
import VisualizerPendolo from './VisualizerPendolo';

// src/components/visualizer/pendolo/entry.tsx
// Registers Pendolo and its preview tuning panel.

export default defineVisualizer({
    mode: 'pendolo',
    order: 48,
    labelKey: 'ui.visualizerPendolo',
    labelFallback: '时计',
    previewSeed: 'pendolo',
    previewStartOffset: 0,
    tuningKind: 'pendolo',
    // Song-scoped seed resets Pendolo lyric rail state before the next track starts.
    render: props => <VisualizerPendolo key={props.seed} {...props} />,
    renderSettingsPanel: props => <PendoloSettingsPanel {...props} />,
    resetSettings: ({ resetPendoloTuning, setDraftPendoloTuning }) => {
        setDraftPendoloTuning?.(DEFAULT_PENDOLO_TUNING);
        resetPendoloTuning?.();
    },
});
