import { describe, expect, it } from 'vitest';
import {
    applyLyricColorPresetToDualTheme,
    getLyricColorPresetById,
    LYRIC_COLOR_PRESETS,
    matchLyricColorPresetId,
    resolveActiveLyricColorPresetId,
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
        primaryColor: '#f4f4f5',
        accentColor: '#f4f4f5',
        secondaryColor: '#71717a',
        fontStyle: 'serif' as const,
        animationIntensity: 'calm' as const,
    },
};

describe('lyricColorPresets', () => {
    it('includes the default theme palette plus Douyin / Xiaohongshu / Wildfire presets', () => {
        expect(LYRIC_COLOR_PRESETS).toHaveLength(5);
        expect(getLyricColorPresetById('midnight-default')?.dark).toEqual({
            primaryColor: '#fafafa',
            accentColor: '#ffffff',
            secondaryColor: '#b8b8c2',
        });
        expect(getLyricColorPresetById('midnight-default')?.light).toEqual({
            primaryColor: '#1c1917',
            accentColor: '#ea580c',
            secondaryColor: '#44403c',
        });
        expect(getLyricColorPresetById('douyin-neon')?.light.accentColor).toBe('#ff0040');
        expect(getLyricColorPresetById('douyin-neon')?.dark.accentColor).toBe('#00ffe0');
        expect(getLyricColorPresetById('douyin-neon')?.dark.primaryColor).toBe('#dffffa');
        expect(getLyricColorPresetById('douyin-purple')?.dark.primaryColor).toBe('#f8e5ff');
        expect(getLyricColorPresetById('dazibao-red')?.light.accentColor).toBe('#d40000');
        expect(getLyricColorPresetById('dazibao-red')?.dark.accentColor).toBe('#ff0000');
        expect(getLyricColorPresetById('xhs-note-red')).toBeUndefined();
    });

    it('maps stage inks so active lyrics use accent and hints use secondary', () => {
        const preset = getLyricColorPresetById('douyin-purple')!;
        expect(resolveLyricStageInkColors(preset.dark)).toEqual({
            titleColor: '#f8e5ff',
            activeColor: '#f0abff',
            hintColor: '#4ef0ff',
        });
    });

    it('patches lyric colors on both modes while preserving backgrounds', () => {
        const preset = getLyricColorPresetById('xhs-morandi');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.backgroundColor).toBe('#f5f5f4');
        expect(next.dark.backgroundColor).toBe('#09090b');
        expect(next.light.primaryColor).toBe('#261f1d');
        expect(next.dark.accentColor).toBe('#ff5c82');
        expect(next.dark.primaryColor).toBe('#ffe6ef');
    });

    it('defaults to colors-only and keeps font / animation untouched', () => {
        const preset = getLyricColorPresetById('dazibao-red');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.accentColor).toBe('#d40000');
        expect(next.dark.accentColor).toBe('#ff0000');
        expect(next.light.animationIntensity).toBe('calm');
        expect(next.light.fontStyle).toBe('serif');
        expect(next.light.lyricRhythmScaleMultiplier).toBeUndefined();
        expect(next.dark.primaryColor).toBe('#ffb09e');
    });

    it('can apply emphasis without overwriting fontStyle', () => {
        const preset = getLyricColorPresetById('dazibao-red');
        expect(preset).toBeDefined();

        const sansBase = {
            light: { ...baseDualTheme.light, fontStyle: 'sans' as const },
            dark: { ...baseDualTheme.dark, fontStyle: 'sans' as const },
        };
        const next = applyLyricColorPresetToDualTheme(sansBase, preset!, { includeEmphasis: true });

        expect(next.light.animationIntensity).toBe('chaotic');
        expect(next.light.fontStyle).toBe('sans');
        expect(next.light.lyricRhythmScaleMultiplier).toBe(1.6);
        expect(next.light.lyricGlowUsesAccent).toBe(true);
    });

    it('can still apply full motion when explicitly requested by theme editors', () => {
        const preset = getLyricColorPresetById('dazibao-red');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!, { includeMotion: true });

        expect(next.light.animationIntensity).toBe('chaotic');
        expect(next.light.fontStyle).toBe('serif');
        expect(next.light.lyricRhythmScaleMultiplier).toBe(1.6);
        expect(next.light.lyricGlowUsesAccent).toBe(true);
    });

    it('matches the active lyric color preset from current theme colors', () => {
        const preset = getLyricColorPresetById('douyin-neon')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);

        expect(matchLyricColorPresetId(next.light, 'light')).toBe('douyin-neon');
        expect(matchLyricColorPresetId(next.dark, 'dark')).toBe('douyin-neon');
        // baseDualTheme.light is 1:1 with DAYLIGHT_THEME / midnight-default light.
        expect(matchLyricColorPresetId(baseDualTheme.light, 'light')).toBe('midnight-default');
        expect(matchLyricColorPresetId(baseDualTheme.dark, 'dark')).toBeNull();
    });

    it('matches the app default dark theme as midnight-default', () => {
        expect(matchLyricColorPresetId({
            primaryColor: '#fafafa',
            accentColor: '#ffffff',
            secondaryColor: '#b8b8c2',
        }, 'dark')).toBe('midnight-default');
        expect(resolveActiveLyricColorPresetId({
            primaryColor: '#fafafa',
            accentColor: '#ffffff',
            secondaryColor: '#b8b8c2',
        }, 'dark', null)).toBe('midnight-default');
    });

    it('falls back to the stored preset id when theme colors no longer match', () => {
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', 'dazibao-red')).toBe('dazibao-red');
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', null)).toBeNull();

        const preset = getLyricColorPresetById('douyin-purple')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);
        expect(resolveActiveLyricColorPresetId(next.dark, 'dark', 'dazibao-red')).toBe('douyin-purple');
    });
});
