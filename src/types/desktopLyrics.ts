// src/types/desktopLyrics.ts
// Shared payloads for the Electron desktop lyrics overlay.

export interface DesktopLyricsColors {
    primary: string;
    secondary: string;
    highlight: string;
    glow: string;
}

export interface DesktopLyricsPlayback {
    time: number;
    duration: number;
    rate: number;
}

export interface DesktopLyricsMotion {
    lyricGlow?: boolean;
    lyricGlowBeat?: boolean;
    lyricGlowStrength?: number;
    beatGlow?: number;
    beatPulse?: number;
    bass?: number;
    highBloom?: number;
}

export interface DesktopLyricsState {
    enabled?: boolean;
    text?: string;
    progress?: number;
    progressSpan?: number;
    playing?: boolean;
    playback?: DesktopLyricsPlayback;
    opacity?: number;
    y?: number;
    size?: number;
    clickThrough?: boolean;
    highlightFollow?: boolean;
    cinema?: boolean;
    lyricGlow?: boolean;
    lyricGlowBeat?: boolean;
    lyricGlowStrength?: number;
    lyricGlowParticles?: boolean;
    frameRate?: number;
    fontFamily?: string;
    fontWeight?: number;
    letterSpacing?: number;
    lineHeight?: number;
    lyricScale?: number;
    feather?: number;
    colors?: DesktopLyricsColors;
    motion?: DesktopLyricsMotion;
    beatMapKey?: string;
    beatMap?: unknown;
}

export interface DesktopLyricsStatus {
    enabled: boolean;
    locked: boolean;
    y: number;
    opacity: number;
    bounds: { x: number; y: number; width: number; height: number } | null;
    middleClickPoller: boolean;
    error?: string;
}

export interface DesktopLyricsLockState {
    locked: boolean;
}

export interface DesktopLyricsEnabledState {
    enabled: boolean;
}
