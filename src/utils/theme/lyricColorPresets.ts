import type { DualTheme, Theme } from '../../types';

// src/utils/theme/lyricColorPresets.ts
// Lyric colors from Chinese traditional palette (742). Mono = one stage ink;
// combo = body + wipe/glow accent. Contrast still uses opacity ladder.

export type LyricColorPresetId =
    | 'soda-white'
    | 'foil-gold'
    | 'stage-blue'
    | 'dazibao-red'
    | 'ice-silver'
    | 'mint-lime'
    | 'hot-pink'
    | 'violet-neon'
    | 'sunset-orange'
    | 'pin-song';

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
    'neon-cyan': 'mint-lime',
    'douyin-neon': 'mint-lime',
    'douyin-yellow': 'foil-gold',
    'douyin-purple': 'violet-neon',
    'xhs-morandi': 'hot-pink',
    'xhs-hot-pink': 'hot-pink',
    // Deep red folded into 茜色; slot reused by 品红·松花.
    'deep-red': 'dazibao-red',
};

/**
 * Design notes:
 * - 6 mono + 4 combo from Chinese traditional colors (霜色 / 淡茧 / 绀青 / …).
 * - Mono: primary = accent; hierarchy via LYRIC_LINE_OPACITY only.
 * - Combo: accent ≠ primary for karaoke wipe / glow (lyricGlowUsesAccent).
 * - secondary = translation / meta (云峰灰 dark / 瓦灰 light).
 */
/**
 * Shared opacity ladder — same hue for all rows; contrast is alpha only.
 * Active stays full; neighbors drop hard so current words own the stage.
 */
export const LYRIC_LINE_OPACITY = {
    active: 1,
    /**
     * Unsung under karaoke wipe on the active line.
     * Stay above waitingNear so the current line still owns focus before the wipe.
     */
    karaokeUnsung: 0.38,
    /** Next upcoming line — readable, clearly under active / unsung. */
    waitingNear: 0.18,
    waitingFar: 0.08,
    /** Per-row step down for farther waiting lines. */
    waitingStep: 0.06,
    /** Nearest passed line. */
    passedNear: 0.14,
    passedFar: 0.06,
    /** Per-row step down for older passed lines. */
    passedStep: 0.05,
} as const;

const META_DARK = '#C1C8D6'; // 云峰灰
const META_LIGHT = '#867E76'; // 瓦灰

const monoInk = (body: string, meta: string): LyricColorPresetTextColors => ({
    primaryColor: body,
    accentColor: body,
    secondaryColor: meta,
});

/** Combo: body ink + wipe/glow accent from harmony table. */
const comboInk = (body: string, accent: string, meta: string): LyricColorPresetTextColors => ({
    primaryColor: body,
    accentColor: accent,
    secondaryColor: meta,
});

const stageMotion = (
    intensity: Theme['animationIntensity'] = 'normal',
    scale = 1.12,
    glowUsesAccent = false,
): LyricColorPresetMotion => ({
    fontStyle: 'sans',
    animationIntensity: intensity,
    lyricRhythmScaleMultiplier: scale,
    lyricGlowUsesAccent: glowUsesAccent,
});

export const LYRIC_COLOR_PRESETS: readonly LyricColorPreset[] = [
    {
        // App default — 霜色; aligns with DEFAULT_THEME body.
        id: 'soda-white',
        labelKey: 'options.lyricColorPreset.sodaWhite',
        labelFallback: '霜色',
        light: monoInk('#2A3C5C', META_LIGHT), // 黛蓝
        dark: monoInk('#E8F4F8', META_DARK), // 霜色
        motion: stageMotion('normal', 1.08),
    },
    {
        id: 'foil-gold',
        labelKey: 'options.lyricColorPreset.foilGold',
        labelFallback: '淡茧',
        light: monoInk('#EBB10D', META_LIGHT), // 栀子黄
        dark: monoInk('#F9D770', META_DARK), // 淡茧黄
        motion: stageMotion('normal', 1.14),
    },
    {
        id: 'stage-blue',
        labelKey: 'options.lyricColorPreset.stageBlue',
        labelFallback: '绀青',
        light: monoInk('#1661AB', META_LIGHT), // 靛青
        dark: monoInk('#4F84FF', META_DARK), // 绀青
        motion: stageMotion('normal', 1.12),
    },
    {
        id: 'dazibao-red',
        labelKey: 'options.lyricColorPreset.dazibaoRed',
        labelFallback: '茜色',
        light: monoInk('#D92121', META_LIGHT), // 朱砂红
        dark: monoInk('#FF4D4D', META_DARK), // 茜色
        motion: {
            fontStyle: 'serif',
            animationIntensity: 'chaotic',
            lyricRhythmScaleMultiplier: 1.28,
            lyricGlowUsesAccent: false,
        },
    },
    {
        id: 'ice-silver',
        labelKey: 'options.lyricColorPreset.iceSilver',
        labelFallback: '云峰',
        light: monoInk('#2B333E', META_LIGHT), // 青灰
        dark: monoInk('#C1C8D6', '#E4DFD7'), // 云峰灰 / 珍珠灰 meta
        motion: stageMotion('calm', 1.06),
    },
    {
        id: 'mint-lime',
        labelKey: 'options.lyricColorPreset.mintLime',
        labelFallback: '松花',
        light: monoInk('#207F4C', META_LIGHT), // 薄荷绿
        dark: monoInk('#B2F0D9', META_DARK), // 浅薄荷绿
        motion: stageMotion('normal', 1.14),
    },
    {
        // 海棠 · 天水 — warm body + cool wipe
        id: 'hot-pink',
        labelKey: 'options.lyricColorPreset.hotPink',
        labelFallback: '海棠',
        light: comboInk('#EF3473', '#63BBD0', META_LIGHT), // 品红 / 霁青
        dark: comboInk('#FF6F61', '#AED9D4', META_DARK), // 海棠 / 天水碧
        motion: stageMotion('normal', 1.18, true),
    },
    {
        // 丁香 · 藤萝 — same-family violet glow
        id: 'violet-neon',
        labelKey: 'options.lyricColorPreset.violetNeon',
        labelFallback: '丁香',
        light: comboInk('#681752', '#9B8AE8', META_LIGHT), // 牵牛紫 / 紫藤萝
        dark: comboInk('#C8A2C8', '#D1B3FF', META_DARK), // 丁香紫 / 浅紫藤萝
        motion: stageMotion('normal', 1.16, true),
    },
    {
        // 橘橙 · 霁青 — warm/cool karaoke
        id: 'sunset-orange',
        labelKey: 'options.lyricColorPreset.sunsetOrange',
        labelFallback: '橘霁',
        light: comboInk('#F97D1C', '#1661AB', META_LIGHT), // 橘橙 / 靛青
        dark: comboInk('#FBB957', '#63BBD0', META_DARK), // 蜜黄 / 霁青
        motion: stageMotion('normal', 1.16, true),
    },
    {
        // 品红 · 松花 — split-complementary memory color
        id: 'pin-song',
        labelKey: 'options.lyricColorPreset.pinSong',
        labelFallback: '品红',
        light: comboInk('#82111F', '#207F4C', META_LIGHT), // 殷红 / 薄荷绿
        dark: comboInk('#EF3473', '#A0D6B4', META_DARK), // 品红 / 松花绿
        motion: stageMotion('normal', 1.2, true),
    },
];

export const LYRIC_COLOR_PRESET_STORAGE_KEY = 'lyric_color_preset_id';

export const LYRIC_BODY_COLOR_STORAGE_KEY = 'lyric_body_color';

/** App default lyric color preset — 霜色. */
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
 * - titleColor / body = primary (the only lyric hue for mono)
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

const isComboPreset = (preset: LyricColorPreset): boolean => (
    normalizeHexColor(preset.dark.primaryColor) !== normalizeHexColor(preset.dark.accentColor)
);

/**
 * UI swatches for a preset chip: body + twin (dimmed mono, or wipe accent for combo).
 * Foil gold uses a metallic pair (淡茧黄 highlight + 栀子黄 deep).
 */
export const resolveLyricColorPresetSwatches = (
    preset: LyricColorPreset,
    mode: 'light' | 'dark' = 'dark',
): readonly [string, string] => {
    if (preset.id === 'foil-gold') {
        return mode === 'dark'
            ? ['#F9D770', '#EBB10D']
            : ['#EBB10D', '#8B6914'];
    }
    const colors = preset[mode];
    if (isComboPreset(preset)) {
        return [colors.primaryColor, colors.accentColor];
    }
    const body = colors.primaryColor;
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
