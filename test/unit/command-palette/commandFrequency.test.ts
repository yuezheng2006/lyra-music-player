import { describe, expect, it } from 'vitest';
import {
    FREQUENCY_BONUS_MAX,
    createEmptyCommandFrequencyState,
    decayCommandFrequencyState,
    getCommandFrequencyBonus,
    recordCommandUse,
} from '../../../src/components/command-palette/commandFrequency';
import { rankCommands } from '../../../src/components/command-palette/search/rankCommands';
import type { CommandPaletteCommand } from '../../../src/components/command-palette/types';

// test/unit/command-palette/commandFrequency.test.ts
// Frequency never outranks exact/prefix or MRU; it only reorders the rest.

const command = (id: string, keywords: string[]): CommandPaletteCommand => ({
    id,
    group: 'settings',
    title: id,
    description: id,
    keywords,
    execute: () => true,
});

describe('commandFrequency', () => {
    it('keeps bonus in [0, FREQUENCY_BONUS_MAX]', () => {
        expect(getCommandFrequencyBonus({}, 'missing')).toBe(0);
        expect(getCommandFrequencyBonus({ sleep: 1 }, 'sleep')).toBeGreaterThan(0);
        expect(getCommandFrequencyBonus({ sleep: 32 }, 'sleep')).toBe(FREQUENCY_BONUS_MAX);
        expect(getCommandFrequencyBonus({ sleep: 99 }, 'sleep')).toBe(FREQUENCY_BONUS_MAX);
    });

    it('decays stale counts and drops near-zero leftovers', () => {
        const now = 1_700_000_000_000;
        const state = createEmptyCommandFrequencyState(now - 30 * 24 * 60 * 60 * 1000);
        state.counts = { hot: 8, stale: 0.6 };
        const decayed = decayCommandFrequencyState(state, now);
        expect(decayed.counts.hot).toBeLessThan(8);
        expect(decayed.counts.stale).toBeUndefined();
        expect(decayed.anchor).toBe(now);
    });

    it('does not let frequency outrank an exact match or the MRU list', () => {
        const sleep = command('sleep-timer', ['sleep timer']);
        const volume = command('volume-up', ['volume up']);
        const ranked = rankCommands(
            'sleep',
            [sleep, volume],
            ['volume-up'],
            { 'volume-up': 32 },
        );
        expect(ranked[0]?.command.id).toBe('sleep-timer');
    });

    it('uses frequency only when neither side is in the MRU list', () => {
        const alpha = command('alpha', ['alpha command']);
        const bravo = command('bravo', ['bravo command']);
        const ranked = rankCommands(
            'command',
            [alpha, bravo],
            [],
            { bravo: 20 },
        );
        expect(ranked[0]?.command.id).toBe('bravo');
        expect(ranked[1]?.command.id).toBe('alpha');
    });
});

describe('recordCommandUse', () => {
    it('increments a count without throwing when window is missing', () => {
        const next = recordCommandUse('sleep-timer', createEmptyCommandFrequencyState(0), 1);
        expect(next.counts['sleep-timer']).toBe(1);
    });
});
