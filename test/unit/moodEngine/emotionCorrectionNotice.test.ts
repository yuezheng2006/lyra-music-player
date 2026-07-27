import { describe, expect, it } from 'vitest';
import { buildEmotionCorrectionNotice } from '../../../src/types/moodEngine';

// test/unit/moodEngine/emotionCorrectionNotice.test.ts

describe('buildEmotionCorrectionNotice', () => {
    it('names the ambient strategy when ambient is already on', () => {
        expect(buildEmotionCorrectionNotice('uplifting', true)).toContain('振奋');
        expect(buildEmotionCorrectionNotice('uplifting', true)).toContain('粒子氛围');
    });

    it('mentions enabling ambient when it was off', () => {
        const text = buildEmotionCorrectionNotice('sad', false);
        expect(text).toContain('主视觉氛围');
        expect(text).toContain('几何氛围');
    });

    it('calls out auto-enable after correction', () => {
        const text = buildEmotionCorrectionNotice('angry', true, { ambientJustEnabled: true });
        expect(text).toContain('开启主视觉氛围');
        expect(text).toContain('几何氛围');
    });
});
