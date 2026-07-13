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
    it('ships soda neutrals plus vivid stage inks', () => {
        expect(LYRIC_COLOR_PRESETS).toHaveLength(6);
        expect(DEFAULT_LYRIC_COLOR_PRESET_ID).toBe('soda-white');
        expect(LYRIC_COLOR_PRESETS[0]?.id).toBe('soda-white');
        expect(LYRIC_COLOR_PRESETS.map(preset => preset.id)).toEqual([
            'soda-white',
            'soda-gray',
            'douyin-yellow',
            'foil-gold',
            'xhs-hot-pink',
            'dazibao-red',
        ]);
        expect(getLyricColorPresetById('soda-white')?.dark).toEqual({
            primaryColor: '#f4f4f5',
            accentColor: '#f4f4f5',
            secondaryColor: '#a1a1aa',
        });
        expect(getLyricColorPresetById('soda-gray')?.labelFallback).toBe('百搭灰');
        expect(getLyricColorPresetById('soda-black')).toEqual(getLyricColorPresetById('soda-gray'));
        expect(getLyricColorPresetById('douyin-yellow')?.dark.primaryColor).toBe('#ffd84d');
        expect(getLyricColorPresetById('foil-gold')?.dark.primaryColor).toBe('#d4af37');
        expect(getLyricColorPresetById('foil-gold')?.labelFallback).toBe('金箔高光');
    });

    it('maps legacy colorful ids onto current vivid/soda presets', () => {
        expect(normalizeLyricColorPresetId('midnight-default')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('soda-black')).toBe('soda-gray');
        expect(normalizeLyricColorPresetId('douyin-neon')).toBe('douyin-yellow');
        expect(normalizeLyricColorPresetId('douyin-purple')).toBe('foil-gold');
        expect(normalizeLyricColorPresetId('xhs-morandi')).toBe('xhs-hot-pink');
        expect(getLyricColorPresetById('foil-gold')?.id).toBe('foil-gold');
        expect(getLyricColorPresetById('dazibao-red')?.id).toBe('dazibao-red');
    });

    it('keeps stage inks on one body hue', () => {
        const inks = resolveLyricStageInkColors(getLyricColorPresetById('soda-white')!.dark);
        expect(inks.titleColor).toBe('#f4f4f5');
        expect(inks.activeColor).toBe('#f4f4f5');
        expect(inks.hintColor).toBe('#a1a1aa');
    });

    it('shows current-mode body + dimmed twin swatches for the picker', () => {
        const white = getLyricColorPresetById('soda-white')!;
        const darkSwatches = resolveLyricColorPresetSwatches(white, 'dark');
        expect(darkSwatches[0]).toBe('#f4f4f5');
        expect(darkSwatches[1]).toContain('244, 244, 245');
        expect(darkSwatches[1]).toContain('0.48');
        expect(darkSwatches).toHaveLength(2);
    });

    it('shows foil gold as a metallic highlight + deep foil pair, not washed yellow', () => {
        const foil = getLyricColorPresetById('foil-gold')!;
        const darkSwatches = resolveLyricColorPresetSwatches(foil, 'dark');
        expect(darkSwatches[0]).toBe('#f2d06b');
        expect(darkSwatches[1]).toBe('#a67c00');
        expect(foil.dark.primaryColor).toBe('#d4af37');
        expect(foil.dark.primaryColor).not.toBe(getLyricColorPresetById('douyin-yellow')!.dark.primaryColor);
    });

    it('patches lyric colors on both modes while preserving backgrounds', () => {
        const preset = getLyricColorPresetById('soda-gray');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.backgroundColor).toBe('#f5f5f4');
        expect(next.dark.backgroundColor).toBe('#09090b');
        expect(next.light.primaryColor).toBe('#737373');
        expect(next.dark.primaryColor).toBe('#a1a1aa');
        expect(next.dark.accentColor).toBe('#a1a1aa');
    });

    it('defaults to colors-only and keeps font / animation untouched', () => {
        const preset = getLyricColorPresetById('soda-gray');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.dark.primaryColor).toBe('#a1a1aa');
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
        const preset = getLyricColorPresetById('soda-gray')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);

        expect(matchLyricColorPresetId(next.light, 'light')).toBe('soda-gray');
        expect(matchLyricColorPresetId(next.dark, 'dark')).toBe('soda-gray');
        expect(matchLyricColorPresetId(baseDualTheme.dark, 'dark')).toBeNull();
    });

    it('matches the app default dark theme as soda-white', () => {
        expect(matchLyricColorPresetId({
            primaryColor: '#f4f4f5',
            accentColor: '#f4f4f5',
            secondaryColor: '#a1a1aa',
        }, 'dark')).toBe('soda-white');
        expect(resolveActiveLyricColorPresetId({
            primaryColor: '#f4f4f5',
            accentColor: '#f4f4f5',
            secondaryColor: '#a1a1aa',
        }, 'dark', null)).toBe('soda-white');
    });

    it('falls back to the stored preset id when theme colors no longer match', () => {
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', 'soda-black')).toBe('soda-gray');
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', null)).toBeNull();

        const preset = getLyricColorPresetById('soda-gray')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);
        expect(resolveActiveLyricColorPresetId(next.dark, 'dark', 'soda-white')).toBe('soda-gray');
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
        expect(getLyricColorPresetById('douyin-neon')?.id).toBe('douyin-yellow');
        expect(getLyricColorPresetById('douyin-purple')?.id).toBe('foil-gold');
        expect(getLyricColorPresetById('soda-black')?.id).toBe('soda-gray');
        expect(normalizeLyricColorPresetId('midnight-default')).toBe('soda-white');
    });
});
