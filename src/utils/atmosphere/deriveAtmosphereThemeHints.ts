import type { AtmosphereThemeHints, DualTheme, Theme } from '../../types';

// src/utils/atmosphere/deriveAtmosphereThemeHints.ts
// Derives local atmosphere intensity hints from AI dual themes.
// Never suggests visualPreset — 3D style is user-owned and persisted.

const clampUnit = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const parseHex = (value: string): [number, number, number] | null => {
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
    if (!match) return null;
    const hex = match[1];
    if (hex.length === 3) {
        return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
        ];
    }
    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
    ];
};

const relativeLuminance = (rgb: [number, number, number]) => {
    const channel = (value: number) => {
        const s = value / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
};

const intensityScore = (theme: Theme) => {
    if (theme.animationIntensity === 'chaotic') return 1;
    if (theme.animationIntensity === 'calm') return 0;
    return 0.5;
};

/** Builds atmosphere intensity hints; omits visualPreset so user 3D style stays sticky. */
export const deriveAtmosphereThemeHints = (dualTheme: DualTheme): AtmosphereThemeHints => {
    if (dualTheme.atmosphereHints) {
        const { visualPreset: _ignored, ...intensityHints } = dualTheme.atmosphereHints;
        return intensityHints;
    }

    const sample = dualTheme.dark ?? dualTheme.light;
    const bg = parseHex(sample.backgroundColor) ?? [15, 23, 42];
    const luminance = relativeLuminance(bg);
    const intensity = intensityScore(sample);
    const energy = clampUnit((1 - luminance) * 0.55 + intensity * 0.45, 0, 1);

    return {
        rhythmIntensity: clampUnit(0.72 + energy * 0.38, 0.55, 1.2),
        cinemaShake: clampUnit(0.28 + energy * 0.55, 0.18, 1.2),
        atmosphereSensitivity: clampUnit(0.75 + energy * 0.45, 0.55, 1.35),
        cameraPunchStrength: clampUnit(0.7 + energy * 0.5 + intensity * 0.15, 0.5, 1.4),
    };
};

/** Merges derived/explicit atmosphere hints into a dual theme object. */
export const withDerivedAtmosphereHints = (dualTheme: DualTheme): DualTheme => ({
    ...dualTheme,
    atmosphereHints: deriveAtmosphereThemeHints(dualTheme),
});
