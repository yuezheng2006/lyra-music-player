import { describe, expect, it } from 'vitest';
import { buildFlagSuggestions } from '../../../src/components/command-palette/syntax/suggestFlags';
import { SLEEP_TIMER_COMMANDS } from '../../../src/components/command-palette/sleepTimerCommands';

// test/unit/command-palette/suggestFlags.test.ts
// Sleep timer documents --on / --off the moment the user types `--`.

describe('buildFlagSuggestions', () => {
    const spec = SLEEP_TIMER_COMMANDS[0].syntax;

    it('lists on/off when the input ends with --', () => {
        const suggestions = buildFlagSuggestions(spec, '--');
        expect(suggestions.map(item => item.flag)).toEqual(['on', 'off']);
    });

    it('filters by draft and aliases', () => {
        expect(buildFlagSuggestions(spec, '--o').map(item => item.flag)).toEqual(['on', 'off']);
        expect(buildFlagSuggestions(spec, '--en').map(item => item.flag)).toEqual(['on']);
        expect(buildFlagSuggestions(spec, '--off').map(item => item.flag)).toEqual(['off']);
    });

    it('returns nothing until a -- token is started', () => {
        expect(buildFlagSuggestions(spec, '30')).toEqual([]);
        expect(buildFlagSuggestions(spec, '')).toEqual([]);
    });

    it('keeps preceding duration text when completing a flag', () => {
        const [on] = buildFlagSuggestions(spec, '90 --o');
        expect(on?.replacement).toBe('90 --on');
    });
});
