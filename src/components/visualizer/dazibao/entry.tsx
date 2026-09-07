import React from 'react';
import { defineVisualizer } from '../definition';
import VisualizerDazibao from './VisualizerDazibao';

// src/components/visualizer/dazibao/entry.tsx
// Wildfire layout is kept as a module but not registered in the product picker.

export default defineVisualizer({
    mode: 'dazibao',
    order: 42,
    labelKey: 'ui.visualizerDazibao',
    labelFallback: '野火',
    previewSeed: 'dazibao',
    previewStartOffset: 0,
    tuningKind: 'none',
    render: props => <VisualizerDazibao {...props} />,
});
