import type { DualTheme, Theme } from '../../types';

// src/utils/theme/lyricColorPresets.ts
// High-contrast lyric palettes. Motion stays optional for theme editors.

export type LyricColorPresetId =
    | 'midnight-default'
    | 'douyin-neon'
    | 'douyin-purple'
    | 'xhs-morandi'
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
    /**
     * When true, apply animation / rhythm / accent-glow from motion,
     * but never overwrite theme.fontStyle (font presets stay independent).
     */
    includeEmphasis?: boolean;
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
        light: { primaryColor: '#050508', accentColor: '#ff0040', secondaryColor: '#00f0ff' },
        dark: { primaryColor: '#dffffa', accentColor: '#00ffe0', secondaryColor: '#ff1a5c' },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.38,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'douyin-purple',
        labelKey: 'options.lyricColorPreset.douyinPurple',
        labelFallback: '抖音紫电',
        light: { primaryColor: '#0e0418', accentColor: '#b026ff', secondaryColor: '#ff2eb8' },
        dark: { primaryColor: '#f8e5ff', accentColor: '#f0abff', secondaryColor: '#4ef0ff' },
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.32,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'xhs-morandi',
        labelKey: 'options.lyricColorPreset.xhsMorandi',
        labelFallback: '小红书莫兰迪',
        light: { primaryColor: '#261f1d', accentColor: '#e8437a', secondaryColor: '#a0786c' },
        dark: { primaryColor: '#ffe6ef', accentColor: '#ff5c82', secondaryColor: '#f5a3ff' },
        motion: {
            fontStyle: 'serif',
            animationIntensity: 'calm',
            lyricRhythmScaleMultiplier: 1.16,
            lyricGlowUsesAccent: true,
        },
    },
    {
        id: 'dazibao-red',
        labelKey: 'options.lyricColorPreset.dazibaoRed',
        labelFallback: '野火红',
        light: {
            // 浅底用正红，避免粉橘稀释
            primaryColor: '#140101',
            accentColor: '#d40000',
            secondaryColor: '#ff1f00',
        },
        dark: {
            // 暗底：底色偏火、高亮纯红、提示焰橙 —— 整句都要红得浓
            primaryColor: '#ffb09e',
            accentColor: '#ff0000',
            secondaryColor: '#ff4d00',
        },
        motion: {
            fontStyle: 'serif',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.6,
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

/** Patches lyric text colors on both light/dark themes. Motion / emphasis are opt-in. */
export const applyLyricColorPresetToDualTheme = (
    dualTheme: DualTheme,
    preset: LyricColorPreset,
    options: ApplyLyricColorPresetOptions = {},
): DualTheme => {
    const includeMotion = options.includeMotion === true;
    const includeEmphasis = options.includeEmphasis === true;
    const motion = includeMotion || includeEmphasis ? preset.motion : undefined;
    return {
        light: applyLyricColorPresetToTheme(dualTheme.light, preset.light, motion, {
            applyFontStyle: includeMotion,
        }),
        dark: applyLyricColorPresetToTheme(dualTheme.dark, preset.dark, motion, {
            applyFontStyle: includeMotion,
        }),
    };
};

const applyLyricColorPresetToTheme = (
    theme: Theme,
    colors: LyricColorPresetTextColors,
    motion?: LyricColorPresetMotion,
    options: { applyFontStyle?: boolean } = {},
): Theme => {
    const next: Theme = {
        ...theme,
        ...colors,
    };

    if (motion) {
        if (options.applyFontStyle) {
            next.fontStyle = motion.fontStyle;
        }
        next.animationIntensity = motion.animationIntensity;
        next.lyricRhythmScaleMultiplier = motion.lyricRhythmScaleMultiplier;
        next.lyricGlowUsesAccent = motion.lyricGlowUsesAccent;
        return next;
    }

    return next;
};
