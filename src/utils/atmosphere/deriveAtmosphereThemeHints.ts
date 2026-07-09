import type { AtmosphereThemeHints, DualTheme, MineradioVisualPresetId, Theme } from '../../types';
import { normalizeInteractive3dVisualPreset } from '../../components/visualizer/geometric/mineradioVisualPresets';

// src/utils/atmosphere/deriveAtmosphereThemeHints.ts
// Derives local atmosphere tuning hints from AI dual themes (colors + intensity).

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

const saturationOf = (rgb: [number, number, number]) => {
    const max = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
    const min = Math.min(rgb[0], rgb[1], rgb[2]) / 255;
    if (max <= 0) return 0;
    return (max - min) / max;
};

const intensityScore = (theme: Theme) => {
    if (theme.animationIntensity === 'chaotic') return 1;
    if (theme.animationIntensity === 'calm') return 0;
    return 0.5;
};

const pickVisualPreset = (energy: number, saturation: number): MineradioVisualPresetId => {
    if (energy > 0.82 && saturation > 0.48) return 'mineradioGalaxy';
    if (energy > 0.78 && saturation > 0.45) return 'mineradioGalaxy';
    if (energy > 0.62) return 'emily';
    if (saturation > 0.55) return 'mineradioGalaxy';
    if (energy < 0.28) return 'mineradioOrbit';
    if (energy < 0.35) return 'quantumCube';
    return 'emily';
};

/** Builds atmosphere hints from a dual theme's color/intensity profile. */
export const deriveAtmosphereThemeHints = (dualTheme: DualTheme): AtmosphereThemeHints => {
    if (dualTheme.atmosphereHints) {
        const existing = dualTheme.atmosphereHints;
        return {
            ...existing,
            visualPreset: existing.visualPreset
                ? normalizeInteractive3dVisualPreset(existing.visualPreset)
                : undefined,
        };
    }

    const sample = dualTheme.dark ?? dualTheme.light;
    const bg = parseHex(sample.backgroundColor) ?? [15, 23, 42];
    const accent = parseHex(sample.accentColor) ?? [125, 211, 252];
    const luminance = relativeLuminance(bg);
    const saturation = Math.max(saturationOf(bg), saturationOf(accent));
    const intensity = intensityScore(sample);
    const energy = clampUnit((1 - luminance) * 0.55 + saturation * 0.25 + intensity * 0.35, 0, 1);

    return {
        visualPreset: pickVisualPreset(energy, saturation),
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
