import { describe, expect, it } from 'vitest';
import {
    isRetiredVisualizerBackgroundMode,
    migrateVisualizerBackgroundMode,
} from '@/utils/visualizer/retiredVisualizerBackgroundModes';

// test/unit/visualizer/retiredVisualizerBackgroundModes.test.ts
// Stored interactive3d configs must land on common, not a dead WebGL path.

describe('retiredVisualizerBackgroundModes', () => {
    it('maps interactive3d to common and leaves other engines alone', () => {
        expect(migrateVisualizerBackgroundMode('interactive3d')).toBe('common');
        expect(migrateVisualizerBackgroundMode('common')).toBe('common');
        expect(migrateVisualizerBackgroundMode('nomand')).toBe('nomand');
        expect(migrateVisualizerBackgroundMode(null)).toBeNull();
        expect(isRetiredVisualizerBackgroundMode('interactive3d')).toBe(true);
        expect(isRetiredVisualizerBackgroundMode('common')).toBe(false);
    });
});
