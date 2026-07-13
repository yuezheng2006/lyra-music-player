import type { VisualizerMode } from '../../types';
import type { VisualizerTuningKind } from './definition';

// src/components/visualizer/registryMeta.ts
// Lightweight sync metadata so mode lists do not eager-load every visualizer module.

export type VisualizerRegistryMeta = {
    mode: VisualizerMode;
    order: number;
    labelKey: string;
    labelFallback: string;
    previewSeed: string;
    previewStartOffset: number;
    tuningKind: VisualizerTuningKind;
};

export const VISUALIZER_REGISTRY_META: VisualizerRegistryMeta[] = [
    {
        mode: 'classic',
        order: 10,
        labelKey: 'ui.visualizerClassic',
        labelFallback: '流光',
        previewSeed: 'classic',
        previewStartOffset: 0,
        tuningKind: 'classic',
    },
    {
        mode: 'cadenza',
        order: 20,
        labelKey: 'ui.visualizerCadenze',
        labelFallback: '心象',
        previewSeed: 'cadenza',
        previewStartOffset: 0,
        tuningKind: 'cadenza',
    },
    {
        mode: 'partita',
        order: 30,
        labelKey: 'ui.visualizerPartita',
        labelFallback: '云阶',
        previewSeed: 'partita',
        previewStartOffset: 0,
        tuningKind: 'partita',
    },
    {
        mode: 'fume',
        order: 40,
        labelKey: 'ui.visualizerFume',
        labelFallback: '浮名',
        previewSeed: 'fume',
        previewStartOffset: 18.4,
        tuningKind: 'fume',
    },
    {
        mode: 'tilt',
        order: 40,
        labelKey: 'ui.visualizerTilt',
        labelFallback: '倾诉',
        previewSeed: 'tilt',
        previewStartOffset: 0,
        tuningKind: 'tilt',
    },
    {
        mode: 'claddagh',
        order: 45,
        labelKey: 'ui.visualizerCladdagh',
        labelFallback: '回环',
        previewSeed: 'claddagh',
        previewStartOffset: 0,
        tuningKind: 'claddagh',
    },
    {
        mode: 'monet',
        order: 45,
        labelKey: 'ui.visualizerMonet',
        labelFallback: '莫奈',
        previewSeed: 'monet',
        previewStartOffset: 0,
        tuningKind: 'monet',
    },
    {
        mode: 'cappella',
        order: 50,
        labelKey: 'ui.visualizerCappella',
        labelFallback: '群唱',
        previewSeed: 'cappella',
        previewStartOffset: 0,
        tuningKind: 'cappella',
    },
];
