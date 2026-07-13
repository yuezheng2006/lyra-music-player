import { describe, expect, it } from 'vitest';
import {
    DEFAULT_VISUALIZER_MODE,
    VISUALIZER_REGISTRY,
    getVisualizerModeLabel,
    getVisualizerRegistryEntry,
    hasVisualizerMode,
    loadVisualizerRegistryEntry,
} from '@/components/visualizer/registry';

// test/unit/visualizer/registry.test.ts
// Locks the discoverable visualizer registry contract.
describe('visualizer registry', () => {
    it('auto-loads the built-in visualizer entries in stable order', () => {
        expect(VISUALIZER_REGISTRY.map(entry => entry.mode)).toEqual([
            'classic',
            'cadenza',
            'partita',
            'fume',
            'tilt',
            'claddagh',
            'monet',
            'cappella',
        ]);
    });

    it('keeps visualizer modes unique', () => {
        const modes = VISUALIZER_REGISTRY.map(entry => entry.mode);

        expect(new Set(modes).size).toBe(modes.length);
    });

    it('recognizes registered modes and rejects unknown modes', () => {
        expect(hasVisualizerMode('classic')).toBe(true);
        expect(hasVisualizerMode('fume')).toBe(true);
        expect(hasVisualizerMode('dazibao')).toBe(false);
        expect(hasVisualizerMode('karaoke')).toBe(false);
        expect(hasVisualizerMode('missing-mode')).toBe(false);
        expect(DEFAULT_VISUALIZER_MODE).toBe('classic');
    });

    it('falls back to classic for an unknown lookup', () => {
        expect(getVisualizerRegistryEntry('missing-mode' as never).mode).toBe('classic');
    });

    it('uses label fallback when the translation key is missing', () => {
        const label = getVisualizerModeLabel('partita', key => key);

        expect(label).toBe('云阶');
    });

    it('does not expose wildfire as a layout mode', () => {
        expect(VISUALIZER_REGISTRY.some(entry => entry.mode === 'dazibao')).toBe(false);
        expect(getVisualizerRegistryEntry('dazibao' as never).mode).toBe('classic');
    });

    it('lazy-loads a full visualizer entry module', async () => {
        const entry = await loadVisualizerRegistryEntry('classic');
        expect(entry.mode).toBe('classic');
        expect(typeof entry.render).toBe('function');
    });
});
