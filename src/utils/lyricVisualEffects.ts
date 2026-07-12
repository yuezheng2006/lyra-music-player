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
                const radius = baseRadius * (i + 1) * 1.75;
                const alpha = 0.95 - i * 0.12;
                glows.push(`0 0 ${radius}px ${withAlpha(color, alpha)}`);
            }
            glows.push(`0 0 ${baseRadius * layerCount * 2.4}px ${withAlpha(color, 0.5)}`);
            break;
        }
        case 'strong': {
            for (let i = 0; i < layerCount; i++) {
                const radius = baseRadius * (i + 1) * 1.4;
                const alpha = 0.88 - i * 0.15;
                glows.push(`0 0 ${radius}px ${withAlpha(color, alpha)}`);
            }
            glows.push(`0 0 ${baseRadius * layerCount * 1.9}px ${withAlpha(color, 0.42)}`);
            break;
        }
        case 'normal': {
            for (let i = 0; i < Math.max(layerCount - 1, 2); i++) {
                const radius = baseRadius * (i + 1);
                const alpha = 0.7 - i * 0.2;
                glows.push(`0 0 ${radius}px ${withAlpha(color, alpha)}`);
            }
            glows.push(`0 0 ${baseRadius * layerCount * 1.3}px ${withAlpha(color, 0.3)}`);
            break;
        }
        case 'subtle': {
            const radius = baseRadius * 0.7;
            glows.push(`0 0 ${radius}px ${withAlpha(color, 0.6)}`);
            glows.push(`0 0 ${radius * 2}px ${withAlpha(color, 0.3)}`);
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

/** 舞台歌词描边色：白描边 + 彩色字，在粒子/暗底上更突出。 */
export const LYRIC_STAGE_STROKE_COLOR = 'rgba(255, 255, 255, 0.96)';

/** em 相对描边，随字号缩放。 */
export const buildLyricStageStroke = (
    intensity: LyricVisualEffectIntensity = 'strong',
    strokeColor: string = LYRIC_STAGE_STROKE_COLOR,
): { WebkitTextStroke: string; paintOrder: 'stroke fill' } => {
    // 白描边略加粗，避免被红字吃掉边缘。
    const widthEm = intensity === 'extreme'
        ? 0.1
        : intensity === 'strong'
            ? 0.082
            : intensity === 'normal'
                ? 0.068
                : 0.05;
    return {
        WebkitTextStroke: `${widthEm}em ${strokeColor}`,
        paintOrder: 'stroke fill',
    };
};

/**
 * 根据模式获取推荐的视觉效果配置。
 * 突出策略：描边优先；软发光 / 多层 3D 阴影默认关闭，避免糊边。
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
            enableStroke: wantPunch,
            immersive: true,
        };
    }

    return {
        intensity,
        enable3D: false,
        enableIntenseGlow: false,
        enableGradient: false,
        enableStroke: wantPunch,
        immersive: false,
    };
};

/**
 * 获取沉浸模式下的字体放大系数
 */
export const getImmersiveFontScale = (baseScale: number = 1): number => {
    return baseScale * 1.45; // 沉浸模式字体放大 45%
};
