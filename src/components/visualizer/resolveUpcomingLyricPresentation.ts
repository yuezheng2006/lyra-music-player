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
    const bodyGlow = colorWithAlpha(theme.primaryColor || '#f8fafc', 0.42);
    const darkHalo = colorWithAlpha('#000000', 0.9);
    const midHalo = colorWithAlpha('#000000', 0.68);
    const lightHalo = colorWithAlpha('#ffffff', 0.46);

    return [
        `0 0 1px ${darkHalo}`,
        `0 1px 2px ${darkHalo}`,
        `0 2px 8px ${midHalo}`,
        `0 0 14px ${midHalo}`,
        `0 0 6px ${lightHalo}`,
        `0 0 18px ${bodyGlow}`,
    ].join(', ');
};

/** Builds readable upcoming-line colors with dual halo for mixed visualizer backdrops. */
export const resolveUpcomingLyricPresentation = (
    theme: Theme,
    subtitleOverlayOpacity = 0.6,
): UpcomingLyricPresentation => {
    const lineOpacity = Math.max(0.88, Math.min(1, subtitleOverlayOpacity + 0.32));
    const bodyTint = theme.primaryColor;
    const color = mixColors(
        LIGHT_OVERLAY_FILL,
        bodyTint || LIGHT_OVERLAY_FILL,
        bodyTint ? 0.14 : 0,
        0.94,
    );

    return {
        color,
        textShadow: buildOverlayTextShadow(theme),
        lineOpacity,
    };
};

export interface BottomSubtitlePresentation {
    color: string;
    textShadow: string;
    opacity: number;
    letterSpacing: string;
    fontWeight: number;
    accentRuleColor: string;
}

/**
 * Translation caption styling: same body hue as lyrics, full opacity for bilingual caption.
 */
export const resolveVisualizerBottomSubtitlePresentation = (
    theme: Theme,
    subtitleOverlayOpacity = 0.6,
): BottomSubtitlePresentation => {
    const upcomingPresentation = resolveUpcomingLyricPresentation(theme, subtitleOverlayOpacity);
    const bodyTint = theme.primaryColor;
    const color = mixColors(
        LIGHT_OVERLAY_FILL,
        bodyTint || LIGHT_OVERLAY_FILL,
        bodyTint ? 0.32 : 0,
        0.96,
    );

    return {
        color,
        textShadow: upcomingPresentation.textShadow,
        opacity: 1,
        letterSpacing: '0.08em',
        fontWeight: 600,
        accentRuleColor: colorWithAlpha(bodyTint || LIGHT_OVERLAY_FILL, 0.72),
    };
};
