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
    buildLyricActiveStrokeOrNone,
    buildLyricHighlightStroke,
    buildLyricKaraokeOutlineLayers,
    buildLyricKaraokeOutlinePair,
    buildLyricOutlineDropShadowFilter,
    buildLyricStageStroke,
    parseLyricVisualEffectIntensity,
    resolveLyricContrastStrokeColor,
    resolveLyricOutlineWidthPx,
    resolveLyricRimScale,
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

    it('always enables fine stroke and keeps soft glow off for recommended configs', () => {
        const strong = getRecommendedEffectConfig(false, true, 'strong');
        expect(strong.enable3D).toBe(false);
        expect(strong.enableIntenseGlow).toBe(false);
        expect(strong.enableStroke).toBe(true);
        expect(strong.intensity).toBe('strong');

        const subtle = getRecommendedEffectConfig(false, false, 'subtle');
        expect(subtle.enableStroke).toBe(true);

        const combined = combineShadowEffects('#111111', '#ff3366', strong);
        expect(combined).toContain('0 1px 0');
    });

    it('keeps stage stroke fine relative to previous thick outline', () => {
        expect(buildLyricStageStroke('strong').WebkitTextStroke).toMatch(/^0\.038em /);
        expect(buildLyricStageStroke('subtle').WebkitTextStroke).toMatch(/^0\.024em /);
    });

    it('builds karaoke 色字白边 outline (white rim on chromatic fills)', () => {
        expect(resolveLyricContrastStrokeColor('#ff3b30')).toBe('#ffffff');
        expect(resolveLyricContrastStrokeColor('#ffe566')).toBe('#ffffff');
        expect(resolveLyricContrastStrokeColor('#111111')).toBe('#ffffff');
        expect(resolveLyricContrastStrokeColor('#ffffff')).toContain('24, 18, 12');

        const pair = buildLyricKaraokeOutlinePair('strong', '#ff3b30');
        expect(pair.outline.color).toBe('#ffffff');
        expect(pair.outline.WebkitTextStroke).toMatch(/^0\.11em /);
        expect(pair.outline.textShadow).toContain('#ffffff');
        expect(pair.fill.color).toBe('#ff3b30');
        expect(pair.fill.WebkitTextStroke).toBe('0');

        const highlight = buildLyricHighlightStroke('strong', '#ff3b30');
        expect(highlight.WebkitTextStroke).toMatch(/^0\.11em #ffffff/);
        expect(buildLyricActiveStrokeOrNone(false, 'strong', '#fff').WebkitTextStroke).toBe('0');
        expect(buildLyricActiveStrokeOrNone(true, 'strong', '#b91c1c').WebkitTextStroke).toMatch(/^0\.11em #ffffff/);

        const drop = buildLyricOutlineDropShadowFilter('#ffffff', 6);
        expect(drop).toContain('drop-shadow(');
        expect(drop).toContain('#ffffff');
        expect(drop.split('drop-shadow').length).toBeGreaterThan(8);

        const layers = buildLyricKaraokeOutlineLayers('#ff3b30', 64, 'strong');
        expect(layers.rimColor).toBe('#ffffff');
        expect(layers.rimScale).toBe(resolveLyricRimScale('strong'));
        expect(layers.rimScale).toBeGreaterThan(1.1);
        expect(layers.rimTextShadow).toContain('#ffffff');
        expect(layers.fillFilter).toContain('drop-shadow(');
        expect(resolveLyricOutlineWidthPx(64, 'strong')).toBeGreaterThanOrEqual(4);
    });
});
