import { describe, expect, it } from 'vitest';
import { shouldPreferMonetTitleNowrap } from '@/utils/visualizer/monetTitleLayoutMath';

// test/unit/visualizer/monetTitleLayoutMath.test.ts

describe('shouldPreferMonetTitleNowrap', () => {
    it('keeps medium Chinese titles on one line', () => {
        expect(shouldPreferMonetTitleNowrap('爱江山更爱美人 ( Cover 李丽芬 )')).toBe(true);
        expect(shouldPreferMonetTitleNowrap('一半一半')).toBe(true);
    });

    it('allows wrap for very long titles', () => {
        expect(shouldPreferMonetTitleNowrap(
            '这是一首特别特别长的歌曲标题用来测试换行策略是否会在超长时放开',
        )).toBe(false);
    });
});
