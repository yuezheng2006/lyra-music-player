import * as THREE from 'three';

// src/components/visualizer/geometric/mineradio/lyrics/lyricColorHelpers.ts
// Mineradio lyric palette color helpers ported to TypeScript.

const clampRange = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeHexColor = (value: string, fallback: string): string => {
    const raw = String(value || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
        return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
    }
    return fallback;
};

export const cssColorToThreeColor = (value: string, fallback = '#d6f8ff'): THREE.Color => {
    const color = new THREE.Color();
    try {
        color.setStyle(normalizeHexColor(value, fallback));
    } catch {
        color.set(normalizeHexColor(fallback, '#d6f8ff'));
    }
    return color;
};

/** 将 CSS 颜色转为 Three.js 颜色，并保证最低亮度。 */
export const lyricThreeColor = (
    css: string,
    fallback: string,
    minLum = 0.34,
): THREE.Color => {
    const color = cssColorToThreeColor(css, fallback);
    const lum = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    if (lum < minLum) {
        const lift = minLum - lum;
        color.r = Math.min(1, color.r + lift);
        color.g = Math.min(1, color.g + lift);
        color.b = Math.min(1, color.b + lift);
    }
    return color;
};

export const clamp01 = (value: number) => clampRange(value, 0, 1);
