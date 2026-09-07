import { describe, expect, it } from 'vitest';
import { VISUALIZER_REGISTRY_META } from '../../../src/components/visualizer/registryMeta';
import {
    BUILTIN_VISUALIZER_MODES,
    DEFAULT_VISUALIZER_MODE,
    isBuiltinVisualizerMode,
} from '../../../src/types/visualizerModes';

// test/unit/visualizer/builtinVisualizerModes.test.ts
// Persistence/OBS validate against this list, not the globbing registry module.

describe('builtin visualizer modes', () => {
    it('matches registry metadata 1:1', () => {
        expect([...BUILTIN_VISUALIZER_MODES].sort()).toEqual(
            VISUALIZER_REGISTRY_META.map(entry => entry.mode).sort(),
        );
    });

    it('accepts listed ids and rejects retired dazibao', () => {
        expect(isBuiltinVisualizerMode(DEFAULT_VISUALIZER_MODE)).toBe(true);
        expect(isBuiltinVisualizerMode('cadenza')).toBe(true);
        expect(isBuiltinVisualizerMode('dazibao')).toBe(false);
        expect(isBuiltinVisualizerMode('karaoke')).toBe(false);
        expect(isBuiltinVisualizerMode(null)).toBe(false);
    });
});
