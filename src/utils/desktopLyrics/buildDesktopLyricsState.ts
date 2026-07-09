import type { LyricData, PlayerState, Theme } from '../../types';
import type { DesktopLyricsState } from '../../types/desktopLyrics';
import { getLineRenderEndTime } from '../lyrics/renderHints';

// src/utils/desktopLyrics/buildDesktopLyricsState.ts
// Maps in-app playback and theme state into the desktop lyrics overlay payload.

const DEFAULT_FONT_STACK = 'Inter,"Noto Sans SC","PingFang SC","Microsoft YaHei",Arial,sans-serif';

const clamp = (value: number, min: number, max: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
};

const resolveLyricsFontFamily = (
    lyricsCustomFontFamily: string | null,
    theme: Theme,
): string => {
    if (lyricsCustomFontFamily?.trim()) {
        return `"${lyricsCustomFontFamily.trim()}", ${DEFAULT_FONT_STACK}`;
    }
    if (theme.fontFamily?.trim()) {
        return `"${theme.fontFamily.trim()}", ${DEFAULT_FONT_STACK}`;
    }
    return DEFAULT_FONT_STACK;
};

export interface BuildDesktopLyricsStateArgs {
    enabled?: boolean;
    lyrics: LyricData | null;
    currentLineIndex: number;
    currentTimeSec: number;
    lyricOffsetMs?: number;
    durationSec: number;
    playbackRate?: number;
    playerState: PlayerState;
    fallbackTitle?: string | null;
    theme: Theme;
    lyricsFontScale: number;
    lyricsCustomFontFamily: string | null;
    opacity?: number;
    y?: number;
    clickThrough?: boolean;
    highlightFollow?: boolean;
    motion?: DesktopLyricsState['motion'];
    beatMapKey?: string;
    beatMap?: unknown;
}

export const buildDesktopLyricsState = ({
    enabled = true,
    lyrics,
    currentLineIndex,
    currentTimeSec,
    lyricOffsetMs = 0,
    durationSec,
    playbackRate = 1,
    playerState,
    fallbackTitle,
    theme,
    lyricsFontScale,
    lyricsCustomFontFamily,
    opacity = 0.92,
    y = 0.76,
    clickThrough = true,
    highlightFollow = true,
    motion,
    beatMapKey,
    beatMap,
}: BuildDesktopLyricsStateArgs): DesktopLyricsState => {
    const lyricTime = currentTimeSec + lyricOffsetMs / 1000;
    const activeLine = currentLineIndex >= 0 ? lyrics?.lines[currentLineIndex] : null;
    const lineText = activeLine?.fullText?.replace(/\s+/g, ' ').trim()
        || fallbackTitle?.trim()
        || 'Lyra';
    const lineStart = activeLine?.startTime ?? 0;
    const lineEnd = activeLine
        ? getLineRenderEndTime(activeLine)
        : lineStart + 4.8;
    const progressSpan = Math.max(0.75, lineEnd - lineStart);
    const progress = activeLine
        ? clamp((lyricTime - lineStart) / progressSpan, 0, 1, 0)
        : 0;
    const playing = playerState === 'PLAYING';

    return {
        enabled,
        text: lineText,
        progress,
        progressSpan,
        playing,
        playback: {
            time: Math.max(0, currentTimeSec),
            duration: Math.max(0, durationSec),
            rate: clamp(playbackRate, 0.25, 4, 1),
        },
        opacity: clamp(opacity, 0.28, 1, 0.92),
        y: clamp(y, 0.08, 0.92, 0.76),
        size: clamp(lyricsFontScale, 0.72, 1.55, 1),
        clickThrough,
        highlightFollow,
        cinema: true,
        lyricGlow: true,
        lyricGlowBeat: true,
        lyricGlowStrength: 0.35,
        lyricGlowParticles: false,
        frameRate: 60,
        fontFamily: resolveLyricsFontFamily(lyricsCustomFontFamily, theme),
        fontWeight: 900,
        letterSpacing: 0,
        lineHeight: 1,
        lyricScale: 1,
        feather: 0.055,
        colors: {
            primary: theme.primaryColor,
            secondary: theme.secondaryColor,
            highlight: theme.accentColor,
            glow: theme.accentColor,
        },
        motion,
        beatMapKey,
        beatMap,
    };
};
