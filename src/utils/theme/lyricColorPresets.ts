import type { DualTheme, Theme } from '../../types';

// src/utils/theme/lyricColorPresets.ts
// Lyric colors: soda neutrals for clarity + vivid stage inks. One hue; contrast via opacity + active stroke.

export type LyricColorPresetId =
    | 'soda-white'
    | 'soda-gray'
    | 'douyin-yellow'
    | 'foil-gold'
    | 'xhs-hot-pink'
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
    'soda-black': 'soda-gray',
    'douyin-neon': 'douyin-yellow',
    'douyin-purple': 'foil-gold',
    'xhs-morandi': 'xhs-hot-pink',
};

/**
 * Design notes:
 * - 汽水灰/白 = clarity reference (same hue, opacity contrast), not the whole palette.
 * - Vivid presets add stage personality while keeping one body hue.
 * - primary = the only lyric body hue; active / inactive share it.
 * - Contrast = opacity (LYRIC_LINE_OPACITY) + active highlight stroke.
 * - accent mirrors primary so chrome does not invent a second lyric fill.
 * - secondary = translation / meta only.
 */
/** Shared opacity ladder — reference: bright active + stepped fade (not near-black). */
export const LYRIC_LINE_OPACITY = {
    active: 1,
    /**
     * Unsung under karaoke wipe on the active line.
     * Stay above waitingNear so the current line still owns focus before the wipe.
     */
    karaokeUnsung: 0.62,
    /** Next upcoming line — readable, clearly under active / unsung. */
    waitingNear: 0.48,
    waitingFar: 0.16,
    /** Per-row step down for farther waiting lines. */
    waitingStep: 0.11,
    /** Nearest passed line. */
    passedNear: 0.36,
    passedFar: 0.12,
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
        labelFallback: '明亮白',
        light: neutralInk('#fafafa', '#a1a1aa'),
        dark: neutralInk('#f4f4f5', '#a1a1aa'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.08,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'soda-gray',
        labelKey: 'options.lyricColorPreset.sodaGray',
        labelFallback: '百搭灰',
        light: neutralInk('#737373', '#57534e'),
        dark: neutralInk('#a1a1aa', '#71717a'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.08,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'douyin-yellow',
        labelKey: 'options.lyricColorPreset.douyinYellow',
        labelFallback: '综艺金黄',
        // Punchy variety-show yellow — deliberately more lemon than foil gold.
        light: neutralInk('#b45309', '#78716c'),
        dark: neutralInk('#ffd84d', '#a1a1aa'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.22,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'foil-gold',
        labelKey: 'options.lyricColorPreset.foilGold',
        labelFallback: '金箔高光',
        // Classic metallic foil (#D4AF37 family) — warm amber-bronze, not lemon yellow.
        light: neutralInk('#8b6914', '#78716c'),
        dark: neutralInk('#d4af37', '#a1a1aa'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'normal',
            lyricRhythmScaleMultiplier: 1.14,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'xhs-hot-pink',
        labelKey: 'options.lyricColorPreset.xhsHotPink',
        labelFallback: '卖点玫红',
        light: neutralInk('#be123c', '#78716c'),
        dark: neutralInk('#ff6b9d', '#a1a1aa'),
        motion: {
            fontStyle: 'sans',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.2,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'dazibao-red',
        labelKey: 'options.lyricColorPreset.dazibaoRed',
        labelFallback: '朱砂余烬',
        light: neutralInk('#b91c1c', '#78716c'),
        dark: neutralInk('#ff5a45', '#a1a1aa'),
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

/** App default lyric color preset — 明亮白. */
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
            ? ['#f2d06b', '#a67c00']
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
