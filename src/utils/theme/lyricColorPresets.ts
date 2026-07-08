import type { DualTheme, Theme } from '../../types';

// src/utils/theme/lyricColorPresets.ts
// High-contrast lyric palettes tuned for dynamic karaoke-style lyric emphasis.

export type LyricColorPresetId =
    | 'douyin-neon'
    | 'douyin-purple'
    | 'douyin-gold'
    | 'xhs-cream'
    | 'xhs-morandi'
    | 'xhs-wine'
    | 'xhs-note-red'
    | 'xhs-matcha'
    | 'dazibao-red';

export interface LyricColorPresetTextColors {
    primaryColor: string;
    accentColor: string;
    secondaryColor: string;
}

export interface LyricColorPresetMotion {
    fontStyle: Theme['fontStyle'];
    animationIntensity: Theme['animationIntensity'];
    lyricRhythmScaleMultiplier?: number;
    lyricGlowUsesAccent?: boolean;
}

export interface LyricColorPreset {
    id: LyricColorPresetId;
    labelKey: string;
    labelFallback: string;
    light: LyricColorPresetTextColors;
    dark: LyricColorPresetTextColors;
    motion?: LyricColorPresetMotion;
}

export const LYRIC_COLOR_PRESETS: readonly LyricColorPreset[] = [
    {
        id: 'douyin-neon',
        labelKey: 'options.lyricColorPreset.douyinNeon',
        labelFallback: '抖音霓虹',
        light: { primaryColor: '#0a0a0a', accentColor: '#fe2c55', secondaryColor: '#52525b' },
        dark: { primaryColor: '#ffffff', accentColor: '#00f5ff', secondaryColor: '#67e8f9' },
    },
    {
        id: 'douyin-purple',
        labelKey: 'options.lyricColorPreset.douyinPurple',
        labelFallback: '抖音紫电',
        light: { primaryColor: '#12082a', accentColor: '#9333ea', secondaryColor: '#6366f1' },
        dark: { primaryColor: '#faf5ff', accentColor: '#e879f9', secondaryColor: '#c084fc' },
    },
    {
        id: 'douyin-gold',
        labelKey: 'options.lyricColorPreset.douyinGold',
        labelFallback: '抖音金黄',
        light: { primaryColor: '#1a1208', accentColor: '#eab308', secondaryColor: '#a16207' },
        dark: { primaryColor: '#fffbeb', accentColor: '#fde047', secondaryColor: '#fbbf24' },
    },
    {
        id: 'xhs-cream',
        labelKey: 'options.lyricColorPreset.xhsCream',
        labelFallback: '小红书奶油',
        light: { primaryColor: '#2d1f18', accentColor: '#e85d4c', secondaryColor: '#a16207' },
        dark: { primaryColor: '#fff5ee', accentColor: '#ff7043', secondaryColor: '#ffab91' },
    },
    {
        id: 'xhs-morandi',
        labelKey: 'options.lyricColorPreset.xhsMorandi',
        labelFallback: '小红书莫兰迪',
        light: { primaryColor: '#3d2f2e', accentColor: '#d4738f', secondaryColor: '#9a6b7a' },
        dark: { primaryColor: '#fce4ec', accentColor: '#f48fb1', secondaryColor: '#ce93d8' },
    },
    {
        id: 'xhs-wine',
        labelKey: 'options.lyricColorPreset.xhsWine',
        labelFallback: '小红书酒红',
        light: { primaryColor: '#1a0a0e', accentColor: '#c41e3a', secondaryColor: '#7f1d1d' },
        dark: { primaryColor: '#fff0f3', accentColor: '#ff1744', secondaryColor: '#ff5252' },
    },
    {
        id: 'xhs-note-red',
        labelKey: 'options.lyricColorPreset.xhsNoteRed',
        labelFallback: '笔记红字',
        light: { primaryColor: '#171717', accentColor: '#ff2442', secondaryColor: '#525252' },
        dark: { primaryColor: '#ffffff', accentColor: '#ff2442', secondaryColor: '#ffb3c1' },
    },
    {
        id: 'xhs-matcha',
        labelKey: 'options.lyricColorPreset.xhsMatcha',
        labelFallback: '小红书抹茶',
        light: { primaryColor: '#1a2e1a', accentColor: '#16a34a', secondaryColor: '#4b5563' },
        dark: { primaryColor: '#ecfdf5', accentColor: '#4ade80', secondaryColor: '#86efac' },
    },
    {
        id: 'dazibao-red',
        labelKey: 'options.lyricColorPreset.dazibaoRed',
        labelFallback: '大字报红',
        light: {
            primaryColor: '#0a0a0a',
            accentColor: '#de2910',
            secondaryColor: '#404040',
        },
        dark: {
            primaryColor: '#faf3e8',
            accentColor: '#ff3b30',
            secondaryColor: '#ffc9c4',
        },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.35,
            lyricGlowUsesAccent: true,
        },
    },
];

/** Returns a preset by id for quick-apply UI actions. */
export const getLyricColorPresetById = (presetId: string): LyricColorPreset | undefined =>
    LYRIC_COLOR_PRESETS.find(preset => preset.id === presetId);

/** Patches lyric colors and optional motion profile on both light/dark themes. */
export const applyLyricColorPresetToDualTheme = (
    dualTheme: DualTheme,
    preset: LyricColorPreset,
): DualTheme => ({
    light: applyLyricColorPresetToTheme(dualTheme.light, preset.light, preset.motion),
    dark: applyLyricColorPresetToTheme(dualTheme.dark, preset.dark, preset.motion),
});

const applyLyricColorPresetToTheme = (
    theme: Theme,
    colors: LyricColorPresetTextColors,
    motion?: LyricColorPresetMotion,
): Theme => {
    const next: Theme = {
        ...theme,
        ...colors,
    };

    if (motion) {
        next.fontStyle = motion.fontStyle;
        next.animationIntensity = motion.animationIntensity;
        next.lyricRhythmScaleMultiplier = motion.lyricRhythmScaleMultiplier;
        next.lyricGlowUsesAccent = motion.lyricGlowUsesAccent;
        return next;
    }

    delete next.lyricRhythmScaleMultiplier;
    delete next.lyricGlowUsesAccent;
    return next;
};
