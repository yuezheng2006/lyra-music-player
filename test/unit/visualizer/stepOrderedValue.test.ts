import { describe, expect, it } from 'vitest';
import { stepOrderedValue } from '@/utils/visualizer/stepOrderedValue';

describe('stepOrderedValue', () => {
    it('wraps forward and backward through an ordered list', () => {
        const modes = ['classic', 'cadenza', 'partita'] as const;
        expect(stepOrderedValue(modes, 'classic', 1)).toBe('cadenza');
        expect(stepOrderedValue(modes, 'partita', 1)).toBe('classic');
        expect(stepOrderedValue(modes, 'classic', -1)).toBe('partita');
    });

    it('falls back to the first value when the current item is missing', () => {
        expect(stepOrderedValue(['classic', 'cadenza'], 'still', 1)).toBe('classic');
        expect(stepOrderedValue([], 'classic', 1)).toBe('classic');
    });
});
