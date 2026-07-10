import { describe, expect, it } from 'vitest';
import {
    applyLyricColorPresetToDualTheme,
    getLyricColorPresetById,
    LYRIC_COLOR_PRESETS,
    matchLyricColorPresetId,
    resolveActiveLyricColorPresetId,
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
    it('includes the default theme palette plus Douyin / Xiaohongshu presets', () => {
        expect(LYRIC_COLOR_PRESETS).toHaveLength(6);
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
        expect(getLyricColorPresetById('douyin-neon')?.light.accentColor).toBe('#ff2d55');
        expect(getLyricColorPresetById('douyin-neon')?.dark.accentColor).toBe('#12f7d6');
        expect(getLyricColorPresetById('xhs-note-red')?.light.accentColor).toBe('#ff2442');
    });

    it('patches lyric colors on both modes while preserving backgrounds', () => {
        const preset = getLyricColorPresetById('xhs-morandi');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.backgroundColor).toBe('#f5f5f4');
        expect(next.dark.backgroundColor).toBe('#09090b');
        expect(next.light.primaryColor).toBe('#2f2927');
        expect(next.dark.accentColor).toBe('#fb7185');
    });

    it('defaults to colors-only and keeps font / animation untouched', () => {
        const preset = getLyricColorPresetById('dazibao-red');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!);

        expect(next.light.accentColor).toBe('#ff2a1f');
        expect(next.light.animationIntensity).toBe('calm');
        expect(next.light.fontStyle).toBe('serif');
        expect(next.light.lyricRhythmScaleMultiplier).toBeUndefined();
        expect(next.dark.primaryColor).toBe('#fff4df');
    });

    it('can still apply motion when explicitly requested by theme editors', () => {
        const preset = getLyricColorPresetById('dazibao-red');
        expect(preset).toBeDefined();

        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset!, { includeMotion: true });

        expect(next.light.animationIntensity).toBe('chaotic');
        expect(next.light.fontStyle).toBe('sans');
        expect(next.light.lyricRhythmScaleMultiplier).toBe(1.35);
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
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', 'xhs-note-red')).toBe('xhs-note-red');
        expect(resolveActiveLyricColorPresetId(baseDualTheme.dark, 'dark', null)).toBeNull();

        const preset = getLyricColorPresetById('douyin-purple')!;
        const next = applyLyricColorPresetToDualTheme(baseDualTheme, preset);
        expect(resolveActiveLyricColorPresetId(next.dark, 'dark', 'xhs-note-red')).toBe('douyin-purple');
    });
});
