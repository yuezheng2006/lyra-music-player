import { describe, expect, it } from 'vitest';
import {
    DEFAULT_LYRIC_FONT_PRESET_ID,
    getLyricFontPresetById,
    parseLyricFontPresetId,
} from '@/utils/lyricFontPresets';
import {
    combineShadowEffects,
    DEFAULT_LYRIC_VISUAL_EFFECT_INTENSITY,
    generateIntenseGlow,
    getRecommendedEffectConfig,
    parseLyricVisualEffectIntensity,
} from '@/utils/lyricVisualEffects';

// test/unit/theme/lyricVisualEffects.test.ts

describe('lyricFontPresets', () => {
    it('parses known preset ids and falls back to default', () => {
        expect(parseLyricFontPresetId('calligraphy-bold')).toBe('calligraphy-bold');
        expect(parseLyricFontPresetId('missing')).toBe(DEFAULT_LYRIC_FONT_PRESET_ID);
        expect(getLyricFontPresetById(DEFAULT_LYRIC_FONT_PRESET_ID)?.dramatic).toBe(true);
    });
});

describe('lyricVisualEffects', () => {
    it('parses intensity and falls back to default', () => {
        expect(parseLyricVisualEffectIntensity('extreme')).toBe('extreme');
        expect(parseLyricVisualEffectIntensity('nope')).toBe(DEFAULT_LYRIC_VISUAL_EFFECT_INTENSITY);
    });

    it('builds valid rgba glow layers for hex and rgba inputs', () => {
        const hexGlow = generateIntenseGlow('#ff3366', 'strong', false);
        expect(hexGlow).toContain('rgba(');
        expect(hexGlow).not.toMatch(/rgba\([^)]+,\s*[^)]+,\s*[^)]+,\s*[^)]+,\s*[^)]+\)/);

        const rgbaGlow = generateIntenseGlow('rgba(255, 51, 102, 0.8)', 'strong', false);
        expect(rgbaGlow).toContain('rgba(255, 51, 102,');
        expect(rgbaGlow).not.toMatch(/rgba\(255, 51, 102, 0\.8,/);
    });

    it('enables stroke and keeps soft glow off for recommended configs', () => {
        const strong = getRecommendedEffectConfig(false, true, 'strong');
        expect(strong.enable3D).toBe(false);
        expect(strong.enableIntenseGlow).toBe(false);
        expect(strong.enableStroke).toBe(true);
        expect(strong.intensity).toBe('strong');

        const combined = combineShadowEffects('#111111', '#ff3366', strong);
        expect(combined).toContain('0 1px 0');
    });
});
