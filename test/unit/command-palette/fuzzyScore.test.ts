import { describe, expect, it } from 'vitest';
import { scoreSubsequence } from '../../../src/components/command-palette/search/fuzzyScore';

// test/unit/command-palette/fuzzyScore.test.ts
// Fuzzy is the lowest palette tier: consecutive hits beat scattered letters.

describe('scoreSubsequence', () => {
    it('returns null when the needle is not a subsequence', () => {
        expect(scoreSubsequence('sleep timer', 'xyz')).toBeNull();
        expect(scoreSubsequence('abc', 'abcd')).toBeNull();
    });

    it('scores consecutive hits higher than gapped hits', () => {
        const consecutive = scoreSubsequence('sleep timer', 'sleep');
        const gapped = scoreSubsequence('sleep timer', 'stm');
        expect(consecutive).not.toBeNull();
        expect(gapped).not.toBeNull();
        expect(consecutive as number).toBeGreaterThan(gapped as number);
    });

    it('rejects a needle that is not a subsequence', () => {
        expect(scoreSubsequence('abcdefghijklmnopqrstuvwxyz', 'qqq')).toBeNull();
    });
});
