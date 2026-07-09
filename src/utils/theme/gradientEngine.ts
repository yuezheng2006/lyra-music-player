import { mixColors, parseColorChannels } from '../../components/visualizer/colorMix';

// src/utils/theme/gradientEngine.ts
// Lyric gradient helpers for preset previews and audio-reactive text styling.

export type GradientType = 'linear' | 'radial' | 'conic';
export type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';

export interface GradientConfig {
    type: GradientType;
    colors: string[];
    angle?: number; // 0-360, for linear/conic
    positions?: number[]; // 0-1, color stops
    animated?: boolean;
    animationDuration?: number; // ms
    animationEasing?: EasingFunction;
    centerX?: number; // 0-1, for radial/conic
    centerY?: number; // 0-1, for radial/conic
}

export interface AudioReactiveGradientConfig extends GradientConfig {
    audioReactive?: boolean;
    hueShiftRange?: number; // 0-360
    saturationBoost?: number; // 0-1
    brightnessBoost?: number; // 0-1
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const nr = r / 255;
    const ng = g / 255;
    const nb = b / 255;
    const max = Math.max(nr, ng, nb);
    const min = Math.min(nr, ng, nb);
    const lightness = (max + min) / 2;

    if (max === min) {
        return { h: 0, s: 0, l: lightness };
    }

    const delta = max - min;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    const hue = max === nr
        ? ((ng - nb) / delta + (ng < nb ? 6 : 0)) / 6
        : max === ng
            ? ((nb - nr) / delta + 2) / 6
            : ((nr - ng) / delta + 4) / 6;

    return { h: hue * 360, s: saturation, l: lightness };
};

const hslToHex = ({ h, s, l }: { h: number; s: number; l: number }) => {
    const hue = (((h % 360) + 360) % 360) / 360;
    const saturation = clamp(s, 0, 1);
    const lightness = clamp(l, 0, 1);

    if (saturation === 0) {
        const channel = Math.round(lightness * 255).toString(16).padStart(2, '0');
        return `#${channel}${channel}${channel}`;
    }

    const hueToRgb = (p: number, q: number, t: number) => {
        let nextT = t;
        if (nextT < 0) nextT += 1;
        if (nextT > 1) nextT -= 1;
        if (nextT < 1 / 6) return p + (q - p) * 6 * nextT;
        if (nextT < 1 / 2) return q;
        if (nextT < 2 / 3) return p + (q - p) * (2 / 3 - nextT) * 6;
        return p;
    };

    const q = lightness < 0.5
        ? lightness * (1 + saturation)
        : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    const channels = [
        hueToRgb(p, q, hue + 1 / 3),
        hueToRgb(p, q, hue),
        hueToRgb(p, q, hue - 1 / 3),
    ];

    return `#${channels.map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
};

const shiftColor = (
    color: string,
    hueShift: number,
    saturationDelta = 0,
    lightnessDelta = 0,
) => {
    const channels = parseColorChannels(color);
    if (!channels) return color;
    const hsl = rgbToHsl(channels);
    return hslToHex({
        h: hsl.h + hueShift,
        s: clamp(hsl.s + saturationDelta, 0, 1),
        l: clamp(hsl.l + lightnessDelta, 0, 1),
    });
};

/**
 * 创建 CSS 渐变字符串
 */
export const createGradientCSS = (config: GradientConfig): string => {
    const { type, colors, angle = 0, positions, centerX = 0.5, centerY = 0.5 } = config;

    // 标准化颜色和位置
    const colorStops = colors.map((color, index) => {
        const position = positions?.[index] ?? index / (colors.length - 1);
        return `${color} ${(position * 100).toFixed(1)}%`;
    }).join(', ');

    switch (type) {
        case 'linear':
            return `linear-gradient(${angle}deg, ${colorStops})`;

        case 'radial':
            return `radial-gradient(circle at ${centerX * 100}% ${centerY * 100}%, ${colorStops})`;

        case 'conic':
            return `conic-gradient(from ${angle}deg at ${centerX * 100}% ${centerY * 100}%, ${colorStops})`;

        default:
            return `linear-gradient(${angle}deg, ${colorStops})`;
    }
};

/**
 * 生成色彩丰富的渐变色板 (基于基础色)
 */
export const generateRichGradientPalette = (baseColor: string, count: number = 5): string[] => {
    const channels = parseColorChannels(baseColor);
    if (!channels) {
        return Array.from({ length: count }, () => baseColor);
    }
    const base = rgbToHsl(channels);
    const safeCount = Math.max(1, count);

    return Array.from({ length: safeCount }, (_, i) => {
        const progress = safeCount === 1 ? 0.5 : i / (safeCount - 1);
        const hueOffset = (progress - 0.5) * 64;
        const saturationLift = Math.sin(progress * Math.PI) * 0.12;
        const lightnessLift = (0.5 - Math.abs(progress - 0.5)) * 0.16;
        return hslToHex({
            h: base.h + hueOffset,
            s: clamp(base.s + saturationLift, 0, 1),
            l: clamp(base.l + lightnessLift, 0, 1),
        });
    });
};

/**
 * 音频反应渐变色调整
 */
export const applyAudioReactiveGradient = (
    config: AudioReactiveGradientConfig,
    audioData: {
        bassLevel: number; // 0-1
        volumeLevel: number; // 0-1
        frequencyAverage: number; // 0-1
    }
): GradientConfig => {
    if (!config.audioReactive) {
        return config;
    }

    const { bassLevel, volumeLevel, frequencyAverage } = audioData;
    const { hueShiftRange = 30, saturationBoost = 0.2, brightnessBoost = 0.3 } = config;

    // 音频驱动色相偏移
    const hueShift = (frequencyAverage - 0.5) * hueShiftRange;

    // 调整颜色
    const modifiedColors = config.colors.map(color => shiftColor(
        color,
        hueShift,
        bassLevel * saturationBoost,
        volumeLevel * brightnessBoost,
    ));

    return {
        ...config,
        colors: modifiedColors,
    };
};

/**
 * 为流行歌词色预设创建增强渐变配置
 */
export const ENHANCED_LYRIC_GRADIENTS: Record<string, AudioReactiveGradientConfig> = {
    'douyin-neon': {
        type: 'linear',
        colors: ['#fe2c55', '#00f5ff', '#fe2c55'],
        angle: 45,
        animated: true,
        animationDuration: 3000,
        animationEasing: 'ease-in-out',
        audioReactive: true,
        hueShiftRange: 60,
        saturationBoost: 0.3,
        brightnessBoost: 0.4,
    },

    'douyin-purple': {
        type: 'conic',
        colors: ['#9333ea', '#e879f9', '#6366f1', '#c084fc', '#9333ea'],
        angle: 0,
        centerX: 0.5,
        centerY: 0.5,
        animated: true,
        animationDuration: 5000,
        animationEasing: 'linear',
        audioReactive: true,
        hueShiftRange: 45,
        saturationBoost: 0.25,
    },

    'xhs-morandi': {
        type: 'radial',
        colors: ['#d4738f', '#9a6b7a', '#f48fb1', '#ce93d8'],
        centerX: 0.5,
        centerY: 0.3,
        animated: true,
        animationDuration: 4000,
        animationEasing: 'ease-in-out',
        audioReactive: true,
        hueShiftRange: 30,
        saturationBoost: 0.15,
    },

    'xhs-note-red': {
        type: 'linear',
        colors: ['#ff2442', '#ff6b8a', '#ff2442'],
        angle: 135,
        animated: true,
        animationDuration: 2500,
        animationEasing: 'bounce',
        audioReactive: true,
        hueShiftRange: 20,
        brightnessBoost: 0.35,
    },

    'dazibao-red': {
        type: 'linear',
        colors: ['#de2910', '#ff3b30', '#ff8c85', '#ff3b30', '#de2910'],
        angle: 90,
        animated: true,
        animationDuration: 3500,
        animationEasing: 'elastic',
        audioReactive: true,
        hueShiftRange: 25,
        saturationBoost: 0.4,
        brightnessBoost: 0.3,
    },
};

/**
 * 缓动函数映射
 */
export const EASING_FUNCTIONS: Record<EasingFunction, string> = {
    'linear': 'linear',
    'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
    'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'elastic': 'cubic-bezier(0.68, -0.75, 0.265, 1.55)',
};

/**
 * 创建动画渐变的 CSS 变量
 */
export const createAnimatedGradientCSS = (
    elementId: string,
    config: GradientConfig
): string => {
    if (!config.animated) {
        return '';
    }

    const { animationDuration = 3000, animationEasing = 'ease-in-out', angle = 0 } = config;
    const easingFn = EASING_FUNCTIONS[animationEasing];

    // 为角度或位置创建动画
    let animationCSS = '';

    if (config.type === 'linear' || config.type === 'conic') {
        // 旋转动画
        animationCSS = `
@keyframes gradient-rotate-${elementId} {
    0% { --gradient-angle: ${angle}deg; }
    100% { --gradient-angle: ${angle + 360}deg; }
}

#${elementId} {
    --gradient-angle: ${angle}deg;
    animation: gradient-rotate-${elementId} ${animationDuration}ms ${easingFn} infinite;
}
        `;
    }

    return animationCSS;
};

/**
 * 混合两个渐变配置 (用于过渡)
 */
export const blendGradients = (
    from: GradientConfig,
    to: GradientConfig,
    t: number // 0-1
): GradientConfig => {
    // 确保颜色数组长度一致
    const maxLength = Math.max(from.colors.length, to.colors.length);
    const fromColors = [...from.colors];
    const toColors = [...to.colors];

    while (fromColors.length < maxLength) {
        fromColors.push(fromColors[fromColors.length - 1]);
    }
    while (toColors.length < maxLength) {
        toColors.push(toColors[toColors.length - 1]);
    }

    // 混合颜色
    const blendedColors = fromColors.map((fromColor, index) => {
        const toColor = toColors[index];
        return mixColors(fromColor, toColor, t);
    });

    // 混合其他属性
    const blendNumber = (a: number = 0, b: number = 0) => a + (b - a) * t;

    return {
        type: to.type,
        colors: blendedColors,
        angle: blendNumber(from.angle, to.angle),
        positions: from.positions,
        centerX: blendNumber(from.centerX, to.centerX),
        centerY: blendNumber(from.centerY, to.centerY),
    };
};
