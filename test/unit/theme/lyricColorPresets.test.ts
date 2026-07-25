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
    it('ships Chinese traditional mono + combo lyric stage inks', () => {
        expect(LYRIC_COLOR_PRESETS).toHaveLength(10);
        expect(DEFAULT_LYRIC_COLOR_PRESET_ID).toBe('soda-white');
        expect(LYRIC_COLOR_PRESETS.map(preset => preset.id)).toEqual([
            'soda-white',
            'foil-gold',
            'stage-blue',
            'dazibao-red',
            'ice-silver',
            'mint-lime',
            'hot-pink',
            'violet-neon',
            'sunset-orange',
            'pin-song',
        ]);
        expect(LYRIC_COLOR_PRESETS.map(preset => preset.labelFallback)).toEqual([
            '霜色', '淡茧', '绀青', '茜色', '云峰', '松花', '海棠', '丁香', '橘霁', '品红',
        ]);
        expect(getLyricColorPresetById('soda-white')?.dark).toEqual({
            primaryColor: '#E8F4F8',
            accentColor: '#E8F4F8',
            secondaryColor: '#C1C8D6',
        });
        expect(getLyricColorPresetById('foil-gold')?.dark.primaryColor).toBe('#F9D770');
        expect(getLyricColorPresetById('stage-blue')?.dark.primaryColor).toBe('#4F84FF');
        expect(getLyricColorPresetById('dazibao-red')?.dark.primaryColor).toBe('#FF4D4D');
        expect(getLyricColorPresetById('ice-silver')?.dark.primaryColor).toBe('#C1C8D6');
        expect(getLyricColorPresetById('mint-lime')?.dark.primaryColor).toBe('#B2F0D9');
        expect(getLyricColorPresetById('hot-pink')?.dark).toEqual({
            primaryColor: '#FF6F61',
            accentColor: '#AED9D4',
            secondaryColor: '#C1C8D6',
        });
        expect(getLyricColorPresetById('violet-neon')?.dark.accentColor).toBe('#D1B3FF');
        expect(getLyricColorPresetById('sunset-orange')?.dark.primaryColor).toBe('#FBB957');
        expect(getLyricColorPresetById('pin-song')?.dark).toEqual({
            primaryColor: '#EF3473',
            accentColor: '#A0D6B4',
            secondaryColor: '#C1C8D6',
        });
    });

    it('maps legacy colorful ids onto the restored catalog', () => {
        expect(normalizeLyricColorPresetId('midnight-default')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('soda-black')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('soda-gray')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('neon-cyan')).toBe('mint-lime');
        expect(normalizeLyricColorPresetId('douyin-neon')).toBe('mint-lime');
        expect(normalizeLyricColorPresetId('douyin-yellow')).toBe('foil-gold');
        expect(normalizeLyricColorPresetId('douyin-purple')).toBe('violet-neon');
        expect(normalizeLyricColorPresetId('xhs-morandi')).toBe('hot-pink');
        expect(normalizeLyricColorPresetId('xhs-hot-pink')).toBe('hot-pink');
        expect(normalizeLyricColorPresetId('deep-red')).toBe('dazibao-red');
        expect(getLyricColorPresetById('soda-gray')?.id).toBe('soda-white');
        expect(getLyricColorPresetById('douyin-yellow')?.id).toBe('foil-gold');
        expect(getLyricColorPresetById('douyin-purple')?.id).toBe('violet-neon');
        expect(getLyricColorPresetById('deep-red')?.id).toBe('dazibao-red');
    });

    it('keeps mono stage inks on one body hue', () => {
        const inks = resolveLyricStageInkColors(getLyricColorPresetById('soda-white')!.dark);
        expect(inks.titleColor).toBe('#E8F4F8');
        expect(inks.activeColor).toBe('#E8F4F8');
        expect(inks.hintColor).toBe('#C1C8D6');
    });

    it('shows current-mode body + dimmed twin swatches for mono presets', () => {
        const frost = getLyricColorPresetById('soda-white')!;
        const darkSwatches = resolveLyricColorPresetSwatches(frost, 'dark');
        expect(darkSwatches[0]).toBe('#E8F4F8');
        expect(darkSwatches[1]).toContain('232, 244, 248');
        expect(darkSwatches[1]).toContain('0.18');
        expect(darkSwatches).toHaveLength(2);
    });

    it('shows foil gold as a metallic highlight + deep foil pair', () => {
        const foil = getLyricColorPresetById('foil-gold')!;
        const darkSwatches = resolveLyricColorPresetSwatches(foil, 'dark');
        expect(darkSwatches[0]).toBe('#F9D770');
        expect(darkSwatches[1]).toBe('#EBB10D');
        expect(foil.dark.primaryColor).toBe('#F9D770');
        expect(foil.dark.primaryColor).not.toBe(getLyricColorPresetById('stage-blue')!.dark.primaryColor);
    });

    it('shows combo presets as body + wipe accent swatches', () => {
        const begonia = getLyricColorPresetById('hot-pink')!;
        expect(resolveLyricColorPresetSwatches(begonia, 'dark')).toEqual(['#FF6F61', '#AED9D4']);
        expect(begonia.motion?.lyricGlowUsesAccent).toBe(true);
    });

    it('patches lyric colors on both modes while preserving backgrounds', () => {
        const preset = getLyricColorPresetById('stage-blue');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.backgroundColor).toBe('#f5f5f4');
        expect(next.dark.backgroundColor).toBe('#09090b');
        expect(next.light.primaryColor).toBe('#1661AB');
        expect(next.dark.primaryColor).toBe('#4F84FF');
        expect(next.dark.accentColor).toBe('#4F84FF');
    });

    it('applies distinct accent for combo presets', () => {
        const preset = getLyricColorPresetById('pin-song')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);
        expect(next.dark.primaryColor).toBe('#EF3473');
        expect(next.dark.accentColor).toBe('#A0D6B4');
        expect(next.light.primaryColor).toBe('#82111F');
        expect(next.light.accentColor).toBe('#207F4C');
    });

    it('defaults to colors-only and keeps font / animation untouched', () => {
        const preset = getLyricColorPresetById('foil-gold');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.dark.primaryColor).toBe('#F9D770');
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

    it('matches the app default dark theme as soda-white frost', () => {
        expect(matchLyricColorPresetId({
            primaryColor: '#E8F4F8',
            accentColor: '#E8F4F8',
            secondaryColor: '#C1C8D6',
        }, 'dark')).toBe('soda-white');
        expect(resolveActiveLyricColorPresetId({
            primaryColor: '#E8F4F8',
            accentColor: '#E8F4F8',
            secondaryColor: '#C1C8D6',
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
        expect(getLyricColorPresetById('douyin-neon')?.id).toBe('mint-lime');
        expect(getLyricColorPresetById('neon-cyan')?.id).toBe('mint-lime');
        expect(getLyricColorPresetById('douyin-purple')?.id).toBe('violet-neon');
        expect(getLyricColorPresetById('soda-black')?.id).toBe('soda-white');
        expect(normalizeLyricColorPresetId('midnight-default')).toBe('soda-white');
        expect(normalizeLyricColorPresetId('deep-red')).toBe('dazibao-red');
    });
});
