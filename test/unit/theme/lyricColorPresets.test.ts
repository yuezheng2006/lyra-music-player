import { describe, expect, it } from 'vitest';
import {
    applyLyricBodyColorToDualTheme,
    applyLyricColorPresetToDualTheme,
    DEFAULT_LYRIC_COLOR_PRESET_ID,
    getLyricColorPresetById,
    LYRIC_COLOR_PRESETS,
    matchLyricColorPresetId,
    normalizeLyricColorPresetId,
    resolveActiveLyricColorPresetId,
    resolveLyricColorPresetSwatches,
    resolveLyricStageInkColors,
} from '@/utils/theme/lyricColorPresets';

// test/unit/theme/lyricColorPresets.test.ts

const baseDualTheme = {
    light: {
        name: 'Light',
        backgroundColor: '#f5f5f4',
        primaryColor: '#1c1917',
        accentColor: '#ea580c',
        secondaryColor: '#44403c',
        fontStyle: 'serif' as const,
        animationIntensity: 'calm' as const,
    },
    dark: {
        name: 'Dark',
        backgroundColor: '#09090b',
        primaryColor: '#e4e4e7',
        accentColor: '#e4e4e7',
        secondaryColor: '#71717a',
        fontStyle: 'serif' as const,
        animationIntensity: 'calm' as const,
    },
};

describe('lyricColorPresets', () => {
    it('ships four high-contrast defaults: white, gold, blue, red', () => {
        expect(LYRIC_COLOR_PRESETS).toHaveLength(4);
        expect(DEFAULT_LYRIC_COLOR_PRESET_ID).toBe('soda-white');
        expect(LYRIC_COLOR_PRESETS.map(preset => preset.id)).toEqual([
            'soda-white',
            'foil-gold',
            'stage-blue',
            'dazibao-red',
        ]);
        expect(LYRIC_COLOR_PRESETS.map(preset => preset.labelFallback)).toEqual(['白', '金', '蓝', '红']);
        expect(getLyricColorPresetById('soda-white')?.dark).toEqual({
            primaryColor: '#ffffff',
            accentColor: '#ffffff',
            secondaryColor: '#d4d4d8',
        });
        expect(getLyricColorPresetById('foil-gold')?.dark.primaryColor).toBe('#f5d76e');
        expect(getLyricColorPresetById('stage-blue')?.dark.primaryColor).toBe('#6ec8ff');
        expect(getLyricColorPresetById('dazibao-red')?.dark.primaryColor).toBe('#ff7a62');
    });

    it('maps legacy colorful ids onto the four defaults', () => {
        expect(normalizeLyricColorPresetId('midnight-default')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('soda-black')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('soda-gray')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('douyin-neon')).toBe('foil-gold');
        expect(normalizeLyricColorPresetId('douyin-yellow')).toBe('foil-gold');
        expect(normalizeLyricColorPresetId('douyin-purple')).toBe('foil-gold');
        expect(normalizeLyricColorPresetId('xhs-morandi')).toBe('dazibao-red');
        expect(normalizeLyricColorPresetId('xhs-hot-pink')).toBe('dazibao-red');
        expect(getLyricColorPresetById('soda-gray')?.id).toBe('soda-white');
        expect(getLyricColorPresetById('douyin-yellow')?.id).toBe('foil-gold');
    });

    it('keeps stage inks on one body hue', () => {
        const inks = resolveLyricStageInkColors(getLyricColorPresetById('soda-white')!.dark);
        expect(inks.titleColor).toBe('#ffffff');
        expect(inks.activeColor).toBe('#ffffff');
        expect(inks.hintColor).toBe('#d4d4d8');
    });

    it('shows current-mode body + dimmed twin swatches for the picker', () => {
        const white = getLyricColorPresetById('soda-white')!;
        const darkSwatches = resolveLyricColorPresetSwatches(white, 'dark');
        expect(darkSwatches[0]).toBe('#ffffff');
        expect(darkSwatches[1]).toContain('255, 255, 255');
        expect(darkSwatches[1]).toContain('0.58');
        expect(darkSwatches).toHaveLength(2);
    });

    it('shows foil gold as a metallic highlight + deep foil pair, not washed yellow', () => {
        const foil = getLyricColorPresetById('foil-gold')!;
        const darkSwatches = resolveLyricColorPresetSwatches(foil, 'dark');
        expect(darkSwatches[0]).toBe('#ffe9a0');
        expect(darkSwatches[1]).toBe('#c9a227');
        expect(foil.dark.primaryColor).toBe('#f5d76e');
        expect(foil.dark.primaryColor).not.toBe(getLyricColorPresetById('stage-blue')!.dark.primaryColor);
    });

    it('patches lyric colors on both modes while preserving backgrounds', () => {
        const preset = getLyricColorPresetById('stage-blue');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.backgroundColor).toBe('#f5f5f4');
        expect(next.dark.backgroundColor).toBe('#09090b');
        expect(next.light.primaryColor).toBe('#1d4ed8');
        expect(next.dark.primaryColor).toBe('#6ec8ff');
        expect(next.dark.accentColor).toBe('#6ec8ff');
    });

    it('defaults to colors-only and keeps font / animation untouched', () => {
        const preset = getLyricColorPresetById('foil-gold');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.dark.primaryColor).toBe('#f5d76e');
        expect(next.light.animationIntensity).toBe('calm');
        expect(next.light.fontStyle).toBe('serif');
        expect(next.light.lyricRhythmScaleMultiplier).toBeUndefined();
    });

    it('can apply emphasis without overwriting fontStyle', () => {
        const preset = getLyricColorPresetById('soda-white');
        expect(preset).toBeDefined();

        const sansBase = {
            light: { ...baseDualTheme.light, fontStyle: 'sans' as const },
            dark: { ...baseDualTheme.dark, fontStyle: 'sans' as const },
        };
        const next = applyLyricColorPresetToDualTheme(sansBase, preset!, { includeEmphasis: true });

        expect(next.light.animationIntensity).toBe('normal');
        expect(next.light.fontStyle).toBe('sans');
        expect(next.light.lyricRhythmScaleMultiplier).toBe(1.08);
        expect(next.light.lyricGlowUsesAccent).toBe(false);
    });

    it('matches the active lyric color preset from current theme colors', () => {
        const preset = getLyricColorPresetById('stage-blue')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);

        expect(matchLyricColorPresetId(next.light, 'light')).toBe('stage-blue');
        expect(matchLyricColorPresetId(next.dark, 'dark')).toBe('stage-blue');
        expect(matchLyricColorPresetId(baseDualTheme.dark, 'dark')).toBeNull();
    });

    it('matches the app default dark theme as soda-white', () => {
        expect(matchLyricColorPresetId({
            primaryColor: '#ffffff',
            accentColor: '#ffffff',
            secondaryColor: '#d4d4d8',
        }, 'dark')).toBe('soda-white');
        expect(resolveActiveLyricColorPresetId({
            primaryColor: '#ffffff',
            accentColor: '#ffffff',
            secondaryColor: '#d4d4d8',
        }, 'dark', null)).toBe('soda-white');
    });

    it('falls back to the stored preset id when theme colors no longer match', () => {
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', 'soda-black')).toBe('soda-white');
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', null)).toBeNull();

        const preset = getLyricColorPresetById('foil-gold')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);
        expect(resolveActiveLyricColorPresetId(next.dark, 'dark', 'soda-white')).toBe('foil-gold');
    });

    it('applies a free lyric body color to primary and accent on both modes', () => {
        const next = applyLyricBodyColorToDualTheme(baseDualTheme, '#FF3366');
        expect(next).not.toBeNull();
        expect(next!.dark.primaryColor).toBe('#ff3366');
        expect(next!.dark.accentColor).toBe('#ff3366');
        expect(next!.light.primaryColor).toBe('#ff3366');
        expect(next!.light.accentColor).toBe('#ff3366');
        expect(next!.dark.secondaryColor).toBe(baseDualTheme.dark.secondaryColor);
        expect(applyLyricBodyColorToDualTheme(baseDualTheme, 'not-a-color')).toBeNull();
    });

    it('resolves legacy stored preset ids', () => {
        expect(getLyricColorPresetById('douyin-neon')?.id).toBe('foil-gold');
        expect(getLyricColorPresetById('douyin-purple')?.id).toBe('foil-gold');
        expect(getLyricColorPresetById('soda-black')?.id).toBe('soda-white');
        expect(normalizeLyricColorPresetId('midnight-default')).toBe('soda-white');
    });
});
