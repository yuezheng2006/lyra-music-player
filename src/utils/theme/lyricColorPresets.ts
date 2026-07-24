import type { DualTheme, Theme } from '../../types';

// src/utils/theme/lyricColorPresets.ts
// Lyric colors: four high-contrast defaults (白/金/蓝/红). One hue; contrast via opacity + active stroke.

export type LyricColorPresetId =
    | 'soda-white'
    | 'foil-gold'
    | 'stage-blue'
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

/** Maps retired preset ids so stored preferences still resolve. */
const LEGACY_LYRIC_COLOR_PRESET_IDS: Record<string, LyricColorPresetId> = {
    'midnight-default': 'soda-white',
    'soda-black': 'soda-white',
    'soda-gray': 'soda-white',
    'douyin-neon': 'foil-gold',
    'douyin-yellow': 'foil-gold',
    'douyin-purple': 'foil-gold',
    'xhs-morandi': 'dazibao-red',
    'xhs-hot-pink': 'dazibao-red',
};

/**
 * Design notes:
 * - Defaults are white / gold / blue / red — bright enough for dark cover stages.
 * - primary = the only lyric body hue; active / inactive share it.
 * - Contrast = opacity (LYRIC_LINE_OPACITY) + active highlight stroke.
 * - accent mirrors primary so chrome does not invent a second lyric fill.
 * - secondary = translation / meta only.
 */
/** Shared opacity ladder — keep inactive lines readable on dark / cover stages. */
export const LYRIC_LINE_OPACITY = {
    active: 1,
    /**
     * Unsung under karaoke wipe on the active line.
     * Stay above waitingNear so the current line still owns focus before the wipe.
     */
    karaokeUnsung: 0.72,
    /** Next upcoming line — readable, clearly under active / unsung. */
    waitingNear: 0.58,
    waitingFar: 0.24,
    /** Per-row step down for farther waiting lines. */
    waitingStep: 0.11,
    /** Nearest passed line. */
    passedNear: 0.46,
    passedFar: 0.18,
    /** Per-row step down for older passed lines. */
    passedStep: 0.09,
} as const;

const neutralInk = (body: string, meta: string): LyricColorPresetTextColors => ({
    primaryColor: body,
    accentColor: body,
    secondaryColor: meta,
});

export const LYRIC_COLOR_PRESETS: readonly LyricColorPreset[] = [
    {
        // App default — first in UI; aligns with DEFAULT_THEME body.
        id: 'soda-white',
        labelKey: 'options.lyricColorPreset.sodaWhite',
        labelFallback: '白',
        light: neutralInk('#fafafa', '#71717a'),
        dark: neutralInk('#ffffff', '#d4d4d8'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.08,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'foil-gold',
        labelKey: 'options.lyricColorPreset.foilGold',
        labelFallback: '金',
        // Bright champagne foil — high luminance on dark / cover stages.
        light: neutralInk('#8b6914', '#78716c'),
        dark: neutralInk('#f5d76e', '#e4e4e7'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.14,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'stage-blue',
        labelKey: 'options.lyricColorPreset.stageBlue',
        labelFallback: '蓝',
        // Cool sky blue — stays clear on warm and dark covers.
        light: neutralInk('#1d4ed8', '#64748b'),
        dark: neutralInk('#6ec8ff', '#e4e4e7'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.12,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'dazibao-red',
        labelKey: 'options.lyricColorPreset.dazibaoRed',
        labelFallback: '红',
        light: neutralInk('#b91c1c', '#78716c'),
        dark: neutralInk('#ff7a62', '#e4e4e7'),
        motion: {
            fontStyle: 'serif',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.28,
            lyricGlowUsesAccent: false,
        },
    },
];

export const LYRIC_COLOR_PRESET_STORAGE_KEY = 'lyric_color_preset_id';

export const LYRIC_BODY_COLOR_STORAGE_KEY = 'lyric_body_color';

/** App default lyric color preset — 白. */
export const DEFAULT_LYRIC_COLOR_PRESET_ID: LyricColorPresetId = 'soda-white';

/** Resolves current or legacy preset ids. */
export const normalizeLyricColorPresetId = (presetId: string | null | undefined): LyricColorPresetId | null => {
    if (!presetId) return null;
    if (LYRIC_COLOR_PRESETS.some(preset => preset.id === presetId)) {
        return presetId as LyricColorPresetId;
    }
    return LEGACY_LYRIC_COLOR_PRESET_IDS[presetId] ?? null;
};

/** Returns a preset by id for quick-apply UI actions. */
export const getLyricColorPresetById = (presetId: string): LyricColorPreset | undefined => {
    const normalized = normalizeLyricColorPresetId(presetId);
    return normalized ? LYRIC_COLOR_PRESETS.find(preset => preset.id === normalized) : undefined;
};

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
    const normalized = normalizeLyricColorPresetId(stored);
    if (normalized && normalized !== stored) {
        localStorage.setItem(LYRIC_COLOR_PRESET_STORAGE_KEY, normalized);
    }
    return normalized;
};

/**
 * Active chip for lyric-color UI: prefer exact color match, then the last applied preset id.
 * Stored id alone keeps selection visible after theme source / stage remaps.
 */
export const resolveActiveLyricColorPresetId = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'> | null | undefined,
    mode: 'light' | 'dark' = 'dark',
    storedPresetId?: string | null,
): LyricColorPresetId | null => {
    const matched = matchLyricColorPresetId(theme, mode);
    if (matched) return matched;
    const stored = storedPresetId === undefined ? readStoredLyricColorPresetId() : storedPresetId;
    return normalizeLyricColorPresetId(stored);
};

export const saveStoredLyricColorPresetId = (presetId: LyricColorPresetId | null) => {
    if (typeof window === 'undefined') return;
    if (!presetId) {
        localStorage.removeItem(LYRIC_COLOR_PRESET_STORAGE_KEY);
        return;
    }
    localStorage.setItem(LYRIC_COLOR_PRESET_STORAGE_KEY, presetId);
    // Preset wins over free-picked body color for AI / cover re-pin.
    localStorage.removeItem(LYRIC_BODY_COLOR_STORAGE_KEY);
};

export const readStoredLyricBodyColor = (): string | null => {
    if (typeof window === 'undefined') return null;
    return normalizeHexColor(localStorage.getItem(LYRIC_BODY_COLOR_STORAGE_KEY));
};

export const saveStoredLyricBodyColor = (color: string | null) => {
    if (typeof window === 'undefined') return;
    if (!color) {
        localStorage.removeItem(LYRIC_BODY_COLOR_STORAGE_KEY);
        return;
    }
    const hex = normalizeHexColor(color);
    if (!hex) return;
    localStorage.setItem(LYRIC_BODY_COLOR_STORAGE_KEY, hex);
    // Free pick clears preset chip / re-pin preference.
    localStorage.removeItem(LYRIC_COLOR_PRESET_STORAGE_KEY);
};

/**
 * Stage text inks from the lyric-color triad.
 * - titleColor / body = primary (the only lyric hue)
 * - activeColor kept for legacy callers; Monet wipe uses body opacity, not a second fill hue
 * - hintColor = secondary (translation / meta)
 */
export const resolveLyricStageInkColors = (
    theme: Pick<Theme, 'primaryColor' | 'accentColor' | 'secondaryColor'>,
) => ({
    titleColor: theme.primaryColor,
    activeColor: theme.primaryColor,
    hintColor: theme.secondaryColor,
});

const hexToRgba = (hex: string, alpha: number): string => {
    const normalized = normalizeHexColor(hex);
    if (!normalized) {
        return `rgba(244, 244, 245, ${alpha})`;
    }
    const value = normalized.slice(1);
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * UI swatches for a preset chip: current-mode body + dimmed same hue.
 * Foil gold uses a metallic pair (highlight + deep foil) so it doesn't read as flat yellow.
 */
export const resolveLyricColorPresetSwatches = (
    preset: LyricColorPreset,
    mode: 'light' | 'dark' = 'dark',
): readonly [string, string] => {
    if (preset.id === 'foil-gold') {
        return mode === 'dark'
            ? ['#ffe9a0', '#c9a227']
            : ['#c9a227', '#6b4f00'];
    }
    const body = preset[mode].primaryColor;
    return [body, hexToRgba(body, LYRIC_LINE_OPACITY.waitingNear)];
};

/** Re-applies last lyric color preference (preset or free pick) onto AI / cover themes. */
export const applyStoredLyricColorPresetToDualTheme = (dualTheme: DualTheme): DualTheme => {
    const presetId = readStoredLyricColorPresetId();
    const preset = presetId ? getLyricColorPresetById(presetId) : undefined;
    if (preset) {
        return applyLyricColorPresetToDualTheme(dualTheme, preset);
    }
    const custom = readStoredLyricBodyColor();
    if (custom) {
        return applyLyricBodyColorToDualTheme(dualTheme, custom) ?? dualTheme;
    }
    return dualTheme;
};

/**
 * Free lyric body color: one hue for primary + accent on both modes.
 * Secondary (translation / meta) stays untouched.
 */
export const applyLyricBodyColorToDualTheme = (
    dualTheme: DualTheme,
    color: string,
): DualTheme | null => {
    const hex = normalizeHexColor(color);
    if (!hex) return null;
    const patch = (theme: Theme): Theme => ({
        ...theme,
        primaryColor: hex,
        accentColor: hex,
    });
    return {
        light: patch(dualTheme.light),
        dark: patch(dualTheme.dark),
    };
};

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
