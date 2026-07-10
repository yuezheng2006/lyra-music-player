import type { DualTheme, Theme } from '../../types';

// src/utils/theme/lyricColorPresets.ts
// High-contrast lyric palettes. Controls apply colors only; motion stays optional for theme editors.

export type LyricColorPresetId =
    | 'midnight-default'
    | 'douyin-neon'
    | 'douyin-purple'
    | 'xhs-morandi'
    | 'xhs-note-red'
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
    /** Optional look profile for theme editors; Controls never apply this. */
    motion?: LyricColorPresetMotion;
}

export type ApplyLyricColorPresetOptions = {
    /** When true, also patch font/animation fields from preset.motion. Default false. */
    includeMotion?: boolean;
};

export const LYRIC_COLOR_PRESETS: readonly LyricColorPreset[] = [
    {
        // 1:1 with DEFAULT_THEME (dark) + DAYLIGHT_THEME (light) in appConstants.
        id: 'midnight-default',
        labelKey: 'options.lyricColorPreset.midnightDefault',
        labelFallback: '默认素白',
        light: { primaryColor: '#1c1917', accentColor: '#ea580c', secondaryColor: '#44403c' },
        dark: { primaryColor: '#fafafa', accentColor: '#ffffff', secondaryColor: '#b8b8c2' },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.0,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'douyin-neon',
        labelKey: 'options.lyricColorPreset.douyinNeon',
        labelFallback: '抖音霓虹',
        light: { primaryColor: '#111113', accentColor: '#ff2d55', secondaryColor: '#1bd8e8' },
        // Dark primaries stay light for readability but carry a clear palette tint
        // so title / meta text also shift when switching presets (not only accent).
        dark: { primaryColor: '#d8fffa', accentColor: '#12f7d6', secondaryColor: '#ff3b6b' },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.22,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'douyin-purple',
        labelKey: 'options.lyricColorPreset.douyinPurple',
        labelFallback: '抖音紫电',
        light: { primaryColor: '#160826', accentColor: '#8b5cf6', secondaryColor: '#ec4899' },
        dark: { primaryColor: '#f0d9ff', accentColor: '#d946ef', secondaryColor: '#7dd3fc' },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.16,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'xhs-morandi',
        labelKey: 'options.lyricColorPreset.xhsMorandi',
        labelFallback: '小红书莫兰迪',
        light: { primaryColor: '#2f2927', accentColor: '#df6f8f', secondaryColor: '#8f7b72' },
        dark: { primaryColor: '#ffd6e4', accentColor: '#fb7185', secondaryColor: '#f0abfc' },
        motion: {
            fontStyle: 'serif',
            animationIntensity: 'calm',
            lyricRhythmScaleMultiplier: 1.06,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'xhs-note-red',
        labelKey: 'options.lyricColorPreset.xhsNoteRed',
        labelFallback: '笔记红字',
        light: { primaryColor: '#18181b', accentColor: '#ff2442', secondaryColor: '#fb7185' },
        dark: { primaryColor: '#ffd0d9', accentColor: '#ff2d55', secondaryColor: '#fecdd3' },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.12,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'dazibao-red',
        labelKey: 'options.lyricColorPreset.dazibaoRed',
        labelFallback: '大字报红',
        light: {
            primaryColor: '#120a05',
            accentColor: '#ff2a1f',
            secondaryColor: '#ff6b35',
        },
        dark: {
            primaryColor: '#ffe0a8',
            accentColor: '#ff3b30',
            secondaryColor: '#ffd166',
        },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.35,
            lyricGlowUsesAccent: true,
        },
    },
];

export const LYRIC_COLOR_PRESET_STORAGE_KEY = 'lyric_color_preset_id';

/** Returns a preset by id for quick-apply UI actions. */
export const getLyricColorPresetById = (presetId: string): LyricColorPreset | undefined =>
    LYRIC_COLOR_PRESETS.find(preset => preset.id === presetId);

const normalizeHexColor = (value: string | undefined | null): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().toLowerCase();
    const short = /^#([0-9a-f]{3})$/.exec(trimmed);
    if (short) {
        return `#${short[1].split('').map(char => `${char}${char}`).join('')}`;
    }
    return /^#([0-9a-f]{6})$/.test(trimmed) ? trimmed : null;
};

const colorsMatch = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'>,
    colors: LyricColorPresetTextColors,
) => {
    const primary = normalizeHexColor(theme.primaryColor);
    const accent = normalizeHexColor(theme.accentColor);
    const secondary = normalizeHexColor(theme.secondaryColor);
    return (
        primary === normalizeHexColor(colors.primaryColor)
        && accent === normalizeHexColor(colors.accentColor)
        && secondary === normalizeHexColor(colors.secondaryColor)
    );
};

/** Resolves which lyric-color preset matches the current theme colors, if any. */
export const matchLyricColorPresetId = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'> | null | undefined,
    mode: 'light' | 'dark' = 'dark',
): LyricColorPresetId | null => {
    if (!theme) return null;
    const matched = LYRIC_COLOR_PRESETS.find(preset => colorsMatch(theme, preset[mode]));
    return matched?.id ?? null;
};

export const readStoredLyricColorPresetId = (): LyricColorPresetId | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(LYRIC_COLOR_PRESET_STORAGE_KEY);
    if (!stored) return null;
    return getLyricColorPresetById(stored)?.id ?? null;
};

/**
 * Active chip for lyric-color UI: prefer exact color match, then the last applied preset id.
 * Stored id alone keeps selection visible after theme source / stage remaps.
 */
export const resolveActiveLyricColorPresetId = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'> | null | undefined,
    mode: 'light' | 'dark' = 'dark',
    storedPresetId?: LyricColorPresetId | null,
): LyricColorPresetId | null => {
    const matched = matchLyricColorPresetId(theme, mode);
    if (matched) return matched;
    const stored = storedPresetId === undefined ? readStoredLyricColorPresetId() : storedPresetId;
    return stored && getLyricColorPresetById(stored) ? stored : null;
};

export const saveStoredLyricColorPresetId = (presetId: LyricColorPresetId | null) => {
    if (typeof window === 'undefined') return;
    if (!presetId) {
        localStorage.removeItem(LYRIC_COLOR_PRESET_STORAGE_KEY);
        return;
    }
    localStorage.setItem(LYRIC_COLOR_PRESET_STORAGE_KEY, presetId);
};

/**
 * Stage text inks from the lyric-color triad.
 * title = primary, active lyric = accent, hints / inactive = secondary.
 */
export const resolveLyricStageInkColors = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'>,
) => ({
    titleColor: theme.primaryColor,
    activeColor: theme.accentColor,
    hintColor: theme.secondaryColor,
});

/** Patches lyric text colors on both light/dark themes. Motion is opt-in. */
export const applyLyricColorPresetToDualTheme = (
    dualTheme: DualTheme,
    preset: LyricColorPreset,
    options: ApplyLyricColorPresetOptions = {},
): DualTheme => {
    const includeMotion = options.includeMotion === true;
    return {
        light: applyLyricColorPresetToTheme(dualTheme.light, preset.light, includeMotion ? preset.motion : undefined),
        dark: applyLyricColorPresetToTheme(dualTheme.dark, preset.dark, includeMotion ? preset.motion : undefined),
    };
};

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

    return next;
};
