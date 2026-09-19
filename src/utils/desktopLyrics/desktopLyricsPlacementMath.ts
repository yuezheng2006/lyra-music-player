// src/utils/desktopLyrics/desktopLyricsPlacementMath.ts
// 0–1 vertical factor for the desktop lyrics overlay, with a middle snap.

export const DEFAULT_DESKTOP_LYRICS_Y_FACTOR = 0.76;
export const DESKTOP_LYRICS_Y_MIDDLE = 0.5;
export const DESKTOP_LYRICS_Y_STORAGE_KEY = 'desktop_lyrics_y_factor';
const SNAP_EPSILON = 0.03;

export const clampDesktopLyricsYFactor = (value: number, fallback = DEFAULT_DESKTOP_LYRICS_Y_FACTOR) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(0, Math.min(1, value));
};

export const snapDesktopLyricsYFactor = (value: number) => {
    const clamped = clampDesktopLyricsYFactor(value);
    return Math.abs(clamped - DESKTOP_LYRICS_Y_MIDDLE) <= SNAP_EPSILON
        ? DESKTOP_LYRICS_Y_MIDDLE
        : clamped;
};

export const persistDesktopLyricsYFactor = (value: number) => {
    const next = snapDesktopLyricsYFactor(value);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(DESKTOP_LYRICS_Y_STORAGE_KEY, String(next));
    }
    return next;
};

export const readStoredDesktopLyricsYFactor = () => {
    if (typeof localStorage === 'undefined') return DEFAULT_DESKTOP_LYRICS_Y_FACTOR;
    const raw = Number(localStorage.getItem(DESKTOP_LYRICS_Y_STORAGE_KEY));
    return clampDesktopLyricsYFactor(raw, DEFAULT_DESKTOP_LYRICS_Y_FACTOR);
};
