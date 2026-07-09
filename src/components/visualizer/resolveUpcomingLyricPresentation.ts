import type { Theme } from '../../types';
import { colorWithAlpha, mixColors } from './colorMix';

// src/components/visualizer/resolveUpcomingLyricPresentation.ts
// High-contrast styling for bottom subtitle lines over dynamic visualizer backdrops.

export interface UpcomingLyricPresentation {
    color: string;
    textShadow: string;
    lineOpacity: number;
}

const LIGHT_OVERLAY_FILL = '#f8fafc';

/** Builds a dual-halo shadow readable on both bright chrome and dark particle fields. */
const buildOverlayTextShadow = (theme: Theme) => {
    const accentGlow = colorWithAlpha(theme.accentColor || '#fbbf24', 0.42);
    const darkHalo = colorWithAlpha('#000000', 0.9);
    const midHalo = colorWithAlpha('#000000', 0.68);
    const lightHalo = colorWithAlpha('#ffffff', 0.46);

    return [
        `0 0 1px ${darkHalo}`,
        `0 1px 2px ${darkHalo}`,
        `0 2px 8px ${midHalo}`,
        `0 0 14px ${midHalo}`,
        `0 0 6px ${lightHalo}`,
        `0 0 18px ${accentGlow}`,
    ].join(', ');
};

/** Builds readable upcoming-line colors with dual halo for mixed visualizer backdrops. */
export const resolveUpcomingLyricPresentation = (
    theme: Theme,
    subtitleOverlayOpacity = 0.6,
): UpcomingLyricPresentation => {
    const lineOpacity = Math.max(0.88, Math.min(1, subtitleOverlayOpacity + 0.32));
    const accentTint = theme.accentColor;
    const color = mixColors(
        LIGHT_OVERLAY_FILL,
        accentTint || LIGHT_OVERLAY_FILL,
        accentTint ? 0.14 : 0,
        0.94,
    );

    return {
        color,
        textShadow: buildOverlayTextShadow(theme),
        lineOpacity,
    };
};

/** Reuses overlay contrast rules for translation subtitles rendered in the same slot. */
export const resolveVisualizerBottomSubtitlePresentation = (
    theme: Theme,
    subtitleOverlayOpacity = 0.6,
) => {
    const upcomingPresentation = resolveUpcomingLyricPresentation(theme, subtitleOverlayOpacity);

    return {
        color: upcomingPresentation.color,
        textShadow: upcomingPresentation.textShadow,
        opacity: Math.max(0.86, Math.min(1, subtitleOverlayOpacity + 0.18)),
    };
};
