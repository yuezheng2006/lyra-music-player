// src/utils/lyricVisualEffects.ts
// 歌词视觉效果增强 - 提供强烈的 3D 效果、发光、渐变等

export type LyricVisualEffectIntensity = 'subtle' | 'normal' | 'strong' | 'extreme';

export interface LyricVisualEffectConfig {
    /** 效果强度等级 */
    intensity: LyricVisualEffectIntensity;
    /** 是否启用 3D 立体效果 */
    enable3D: boolean;
    /** 是否启用强烈发光 */
    enableIntenseGlow: boolean;
    /** 是否启用颜色渐变 */
    enableGradient: boolean;
    /** 是否启用描边 */
    enableStroke: boolean;
    /** 是否为沉浸模式（全屏） */
    immersive: boolean;
}

export const LYRIC_VISUAL_EFFECT_INTENSITY_STORAGE_KEY = 'lyric_visual_effect_intensity';
export const DEFAULT_LYRIC_VISUAL_EFFECT_INTENSITY: LyricVisualEffectIntensity = 'strong';

const isLyricVisualEffectIntensity = (value: unknown): value is LyricVisualEffectIntensity => (
    value === 'subtle' || value === 'normal' || value === 'strong' || value === 'extreme'
);

export const parseLyricVisualEffectIntensity = (value: unknown): LyricVisualEffectIntensity => (
    isLyricVisualEffectIntensity(value) ? value : DEFAULT_LYRIC_VISUAL_EFFECT_INTENSITY
);

/** Rebuild rgba() with a new alpha so hex / existing rgba inputs stay valid CSS. */
const withAlpha = (color: string, alpha: number): string => {
    const clamped = Math.max(0, Math.min(1, alpha));
    const trimmed = typeof color === 'string' ? color.trim() : '';
    if (!trimmed) {
        return `rgba(255, 255, 255, ${clamped})`;
    }

    if (trimmed.startsWith('#')) {
        const hex = trimmed.slice(1);
        const parse = (value: string) => Number.parseInt(value, 16);
        if (/^[0-9a-fA-F]{3}$/.test(hex)) {
            return `rgba(${parse(hex[0] + hex[0])}, ${parse(hex[1] + hex[1])}, ${parse(hex[2] + hex[2])}, ${clamped})`;
        }
        if (/^[0-9a-fA-F]{6}$/.test(hex)) {
            return `rgba(${parse(hex.slice(0, 2))}, ${parse(hex.slice(2, 4))}, ${parse(hex.slice(4, 6))}, ${clamped})`;
        }
        return `rgba(255, 255, 255, ${clamped})`;
    }

    const rgbMatch = trimmed.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i);
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${clamped})`;
    }

    return trimmed;
};

/**
 * 生成 3D 立体文字阴影
 * 参考图片中的效果：多层阴影叠加，营造强烈的立体感
 */
export const generate3DTextShadow = (
    color: string,
    intensity: LyricVisualEffectIntensity = 'normal',
    immersive: boolean = false
): string => {
    const baseAlpha = immersive ? 0.85 : 0.7;
    const layerCount = immersive ? 12 : 8;

    const shadows: string[] = [];

    switch (intensity) {
        case 'extreme': {
            for (let i = 1; i <= layerCount; i++) {
                const distance = i * (immersive ? 3.5 : 2.5);
                const alpha = baseAlpha * Math.pow(1 - i / layerCount, 0.6);
                const blur = i * (immersive ? 4 : 2.5);
                shadows.push(`${distance}px ${distance}px ${blur}px ${withAlpha(color, alpha)}`);
            }
            shadows.push(`0 ${layerCount * (immersive ? 4 : 3)}px ${layerCount * (immersive ? 8 : 5)}px ${withAlpha(color, baseAlpha * 0.4)}`);
            break;
        }
        case 'strong': {
            for (let i = 1; i <= Math.floor(layerCount * 0.75); i++) {
                const distance = i * (immersive ? 2.8 : 2);
                const alpha = baseAlpha * Math.pow(1 - i / (layerCount * 0.75), 0.7);
                const blur = i * (immersive ? 3 : 2);
                shadows.push(`${distance}px ${distance}px ${blur}px ${withAlpha(color, alpha)}`);
            }
            shadows.push(`0 ${layerCount * (immersive ? 3 : 2)}px ${layerCount * (immersive ? 6 : 4)}px ${withAlpha(color, baseAlpha * 0.35)}`);
            break;
        }
        case 'normal': {
            for (let i = 1; i <= Math.floor(layerCount * 0.5); i++) {
                const distance = i * (immersive ? 2 : 1.5);
                const alpha = baseAlpha * Math.pow(1 - i / (layerCount * 0.5), 0.8);
                const blur = i * (immersive ? 2.5 : 1.8);
                shadows.push(`${distance}px ${distance}px ${blur}px ${withAlpha(color, alpha)}`);
            }
            shadows.push(`0 ${layerCount * (immersive ? 2 : 1.5)}px ${layerCount * (immersive ? 4 : 3)}px ${withAlpha(color, baseAlpha * 0.3)}`);
            break;
        }
        case 'subtle': {
            for (let i = 1; i <= Math.floor(layerCount * 0.3); i++) {
                const distance = i * 1.2;
                const alpha = baseAlpha * 0.7 * (1 - i / (layerCount * 0.3));
                const blur = i * 1.5;
                shadows.push(`${distance}px ${distance}px ${blur}px ${withAlpha(color, alpha)}`);
            }
            break;
        }
    }

    return shadows.join(', ');
};

/**
 * 生成强烈的发光效果
 * 参考图片中红色/金色发光的效果
 */
export const generateIntenseGlow = (
    color: string,
    intensity: LyricVisualEffectIntensity = 'normal',
    immersive: boolean = false
): string => {
    const glows: string[] = [];
    const baseRadius = immersive ? 45 : 30;
    const layerCount = immersive ? 5 : 3;

    switch (intensity) {
        case 'extreme': {
            for (let i = 0; i < layerCount; i++) {
                const radius = baseRadius * (i + 1) * 0.85;
                const alpha = 0.55 - i * 0.1;
                glows.push(`0 0 ${radius}px ${withAlpha(color, alpha)}`);
            }
            glows.push(`0 0 ${baseRadius * layerCount * 1.2}px ${withAlpha(color, 0.28)}`);
            break;
        }
        case 'strong': {
            for (let i = 0; i < layerCount; i++) {
                const radius = baseRadius * (i + 1) * 0.7;
                const alpha = 0.48 - i * 0.1;
                glows.push(`0 0 ${radius}px ${withAlpha(color, alpha)}`);
            }
            glows.push(`0 0 ${baseRadius * layerCount * 1.05}px ${withAlpha(color, 0.22)}`);
            break;
        }
        case 'normal': {
            for (let i = 0; i < Math.max(layerCount - 1, 2); i++) {
                const radius = baseRadius * (i + 1) * 0.55;
                const alpha = 0.38 - i * 0.12;
                glows.push(`0 0 ${radius}px ${withAlpha(color, alpha)}`);
            }
            glows.push(`0 0 ${baseRadius * layerCount * 0.75}px ${withAlpha(color, 0.16)}`);
            break;
        }
        case 'subtle': {
            const radius = baseRadius * 0.4;
            glows.push(`0 0 ${radius}px ${withAlpha(color, 0.32)}`);
            glows.push(`0 0 ${radius * 1.6}px ${withAlpha(color, 0.14)}`);
            break;
        }
    }

    return glows.join(', ');
};

/**
 * 组合 3D 和发光效果。
 * 默认偏克制：描边负责对比，阴影只作少量硬边缘，避免糊成一团。
 */
export const combineShadowEffects = (
    baseColor: string,
    glowColor: string,
    config: LyricVisualEffectConfig
): string => {
    const effects: string[] = [];

    if (config.enable3D) {
        effects.push(generate3DTextShadow(baseColor, config.intensity, config.immersive));
    }

    if (config.enableIntenseGlow) {
        effects.push(generateIntenseGlow(glowColor, config.intensity, config.immersive));
    }

    // 无 3D/发光时，只留一层极轻硬影，配合 stroke 抬可读性。
    if (effects.length === 0) {
        return '0 1px 0 rgba(0, 0, 0, 0.72)';
    }

    return effects.filter(Boolean).join(', ');
};

/**
 * 生成渐变色文字填充
 * 参考图片中金色到红色的渐变效果
 */
export const generateGradientFill = (
    color1: string,
    color2: string,
    angle: number = 135
): string => {
    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 50%, ${color1} 100%)`;
};

/**
 * 获取描边样式配置 —— 歌词突出的主手段（相对 text-shadow 更清晰）。
 */
export const getStrokeStyle = (
    color: string,
    width: number = 2,
    immersive: boolean = false
): {
    WebkitTextStroke: string;
    textStroke: string;
    paintOrder: string;
} => {
    const strokeWidth = immersive ? width * 1.35 : width;
    return {
        WebkitTextStroke: `${strokeWidth}px ${color}`,
        textStroke: `${strokeWidth}px ${color}`,
        paintOrder: 'stroke fill',
    };
};

/** 舞台歌词描边色：浅色细描边，在暗底 / 粒子网上抬边缘，不糊字。 */
export const LYRIC_STAGE_STROKE_COLOR = 'rgba(255, 255, 255, 0.78)';

export type LyricStrokeStyle = {
    WebkitTextStroke: string;
    paintOrder: 'stroke fill' | 'normal';
    textShadow?: string;
};

const NO_LYRIC_STROKE: LyricStrokeStyle = {
    WebkitTextStroke: '0',
    paintOrder: 'normal',
    textShadow: 'none',
};

const parseCssRgbChannels = (color: string): { r: number; g: number; b: number } | null => {
    const trimmed = typeof color === 'string' ? color.trim() : '';
    if (!trimmed) return null;

    if (trimmed.startsWith('#')) {
        const hex = trimmed.slice(1);
        const parse = (value: string) => Number.parseInt(value, 16);
        if (/^[0-9a-fA-F]{3}$/.test(hex)) {
            return { r: parse(hex[0] + hex[0]), g: parse(hex[1] + hex[1]), b: parse(hex[2] + hex[2]) };
        }
        if (/^[0-9a-fA-F]{6}$/.test(hex)) {
            return {
                r: parse(hex.slice(0, 2)),
                g: parse(hex.slice(2, 4)),
                b: parse(hex.slice(4, 6)),
            };
        }
        return null;
    }

    const rgbMatch = trimmed.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i);
    if (!rgbMatch) return null;
    return {
        r: Number(rgbMatch[1]),
        g: Number(rgbMatch[2]),
        b: Number(rgbMatch[3]),
    };
};

/**
 * Karaoke outline color — 红字白边 / 黄字白边 style.
 * White rim for chromatic fills; dark rim only for near-white / pale-gray fills.
 */
export const resolveLyricContrastStrokeColor = (fillColor: string): string => {
    const rgb = parseCssRgbChannels(fillColor);
    if (!rgb) return '#ffffff';
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max <= 0 ? 0 : (max - min) / max;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Pale neutrals cannot use a white rim — fall back to ink outline.
    if (luminance >= 0.78 && saturation < 0.2) {
        return 'rgba(24, 18, 12, 0.92)';
    }
    return '#ffffff';
};

/** 8-direction outline via text-shadow — reinforces rim on CJK calligraphy. */
export const buildLyricOutlineShadow = (strokeColor: string, spreadEm: number): string => {
    const s = Math.max(0.028, spreadEm);
    const offsets: Array<[number, number]> = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [1, -1], [-1, 1], [1, 1],
        [-2, 0], [2, 0], [0, -2], [0, 2],
        [-2, -1], [2, -1], [-2, 1], [2, 1],
        [-1, -2], [1, -2], [-1, 2], [1, 2],
    ];
    return offsets
        .map(([x, y]) => `${x * s * 0.5}em ${y * s * 0.5}em 0 ${strokeColor}`)
        .join(', ');
};

/** Pixel outline width from font size — used by drop-shadow rings. */
export const resolveLyricOutlineWidthPx = (
    fontPx: number,
    intensity: LyricVisualEffectIntensity = 'strong',
): number => {
    const scale = intensity === 'extreme'
        ? 0.1
        : intensity === 'strong'
            ? 0.085
            : intensity === 'normal'
                ? 0.07
                : 0.055;
    return Math.min(16, Math.max(4, Math.round(fontPx * scale)));
};

/**
 * Scale factor for a solid rim glyph behind the fill.
 * Calligraphy often ignores -webkit-text-stroke; a larger solid twin stays visible.
 */
export const resolveLyricRimScale = (
    intensity: LyricVisualEffectIntensity = 'strong',
): number => (
    intensity === 'extreme'
        ? 1.16
        : intensity === 'strong'
            ? 1.13
            : intensity === 'normal'
                ? 1.1
                : 1.08
);

/** em 相对描边，随字号缩放。统一走细描边，抬可读性但不糊边。 */
export const buildLyricStageStroke = (
    intensity: LyricVisualEffectIntensity = 'strong',
    strokeColor: string = LYRIC_STAGE_STROKE_COLOR,
): LyricStrokeStyle => {
    const widthEm = intensity === 'extreme'
        ? 0.048
        : intensity === 'strong'
            ? 0.038
            : intensity === 'normal'
                ? 0.032
                : 0.024;
    return {
        WebkitTextStroke: `${widthEm}em ${strokeColor}`,
        paintOrder: 'stroke fill',
        textShadow: buildLyricOutlineShadow(strokeColor, widthEm * 0.7),
    };
};

/** Width ladder for karaoke 色字白边 outline (legacy em stroke helpers). */
export const resolveLyricHighlightStrokeWidthEm = (
    intensity: LyricVisualEffectIntensity = 'strong',
): number => (
    intensity === 'extreme'
        ? 0.14
        : intensity === 'strong'
            ? 0.11
            : intensity === 'normal'
                ? 0.09
                : 0.07
);

/**
 * drop-shadow outline — follows glyph alpha, works on calligraphy where WebkitTextStroke vanishes.
 * Prefer this on Monet wipe fill (no Framer filter: none conflict). Avoid on Classic/Partita body
 * layers that animate filter to 'none'.
 */
export const buildLyricOutlineDropShadowFilter = (
    outlineColor: string,
    widthPx: number,
): string => {
    const w = Math.max(3, widthPx);
    const ring: Array<[number, number]> = [
        [-w, 0], [w, 0], [0, -w], [0, w],
        [-w, -w], [w, -w], [-w, w], [w, w],
        [-w * 1.35, 0], [w * 1.35, 0], [0, -w * 1.35], [0, w * 1.35],
    ];
    const inner = w * 0.5;
    const innerRing: Array<[number, number]> = [
        [-inner, 0], [inner, 0], [0, -inner], [0, inner],
        [-inner, -inner], [inner, -inner], [-inner, inner], [inner, inner],
    ];
    return [...ring, ...innerRing]
        .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${outlineColor})`)
        .join(' ');
};

export type LyricKaraokeOutlineLayers = {
    rimColor: string;
    rimScale: number;
    /** text-shadow on the rim twin — thickens without -webkit-text-stroke */
    rimTextShadow: string;
    /** drop-shadow filter for fill faces that do not fight Framer filter animation */
    fillFilter: string;
};

/**
 * Karaoke 色字白边 layers: solid scaled rim + optional fill drop-shadow.
 * Primary technique is the rim twin (font-agnostic). Drop-shadow is Monet-friendly reinforcement.
 */
export const buildLyricKaraokeOutlineLayers = (
    fillColor: string,
    fontPx: number,
    intensity: LyricVisualEffectIntensity = 'strong',
): LyricKaraokeOutlineLayers => {
    const rimColor = resolveLyricContrastStrokeColor(fillColor);
    const widthPx = resolveLyricOutlineWidthPx(fontPx, intensity);
    const widthEm = widthPx / Math.max(fontPx, 1);
    return {
        rimColor,
        rimScale: resolveLyricRimScale(intensity),
        rimTextShadow: buildLyricOutlineShadow(rimColor, Math.max(0.04, widthEm * 0.85)),
        fillFilter: buildLyricOutlineDropShadowFilter(rimColor, widthPx),
    };
};

/**
 * Active sung-glyph outline styles for dual-layer karaoke text:
 * outline layer (white/dark rim) sits under the colored fill layer.
 * Prefer buildLyricKaraokeOutlineLayers + scaled DOM rim for calligraphy fonts.
 */
export const buildLyricKaraokeOutlinePair = (
    intensity: LyricVisualEffectIntensity = 'strong',
    fillColor: string = '#ff3b30',
): { outline: LyricStrokeStyle & { color: string }; fill: LyricStrokeStyle & { color: string } } => {
    const widthEm = resolveLyricHighlightStrokeWidthEm(intensity);
    const outlineColor = resolveLyricContrastStrokeColor(fillColor);
    return {
        outline: {
            color: outlineColor,
            WebkitTextStroke: `${widthEm}em ${outlineColor}`,
            paintOrder: 'stroke fill',
            textShadow: buildLyricOutlineShadow(outlineColor, widthEm),
        },
        fill: {
            color: fillColor,
            WebkitTextStroke: '0',
            paintOrder: 'normal',
            textShadow: 'none',
        },
    };
};

/**
 * Active sung-glyph outline: Webkit stroke + shadow ring (single-layer fallback).
 * Prefer buildLyricKaraokeOutlinePair + dual DOM layers for calligraphy fonts.
 */
export const buildLyricHighlightStroke = (
    intensity: LyricVisualEffectIntensity = 'strong',
    fillColor: string = '#ffffff',
): LyricStrokeStyle => {
    const { outline } = buildLyricKaraokeOutlinePair(intensity, fillColor);
    return {
        WebkitTextStroke: outline.WebkitTextStroke,
        paintOrder: 'stroke fill',
        textShadow: outline.textShadow,
    };
};

export const buildLyricActiveStrokeOrNone = (
    isActive: boolean,
    intensity: LyricVisualEffectIntensity = 'strong',
    fillColor: string = '#ffffff',
): LyricStrokeStyle => (
    isActive ? buildLyricHighlightStroke(intensity, fillColor) : NO_LYRIC_STROKE
);

/**
 * 根据模式获取推荐的视觉效果配置。
 * 突出策略：细描边始终开启；软发光 / 多层 3D 阴影默认关闭，避免糊边。
 */
export const getRecommendedEffectConfig = (
    immersive: boolean,
    isDramaticFont: boolean = false,
    intensity: LyricVisualEffectIntensity = immersive ? 'extreme' : 'strong',
): LyricVisualEffectConfig => {
    const wantPunch = intensity !== 'subtle';
    if (immersive) {
        return {
            intensity,
            enable3D: false,
            enableIntenseGlow: intensity === 'extreme',
            enableGradient: isDramaticFont && wantPunch,
            enableStroke: true,
            immersive: true,
        };
    }

    return {
        intensity,
        enable3D: false,
        enableIntenseGlow: false,
        enableGradient: false,
        enableStroke: true,
        immersive: false,
    };
};

/**
 * 获取沉浸模式下的字体放大系数
 */
export const getImmersiveFontScale = (baseScale: number = 1): number => {
    return baseScale * 1.45; // 沉浸模式字体放大 45%
};
