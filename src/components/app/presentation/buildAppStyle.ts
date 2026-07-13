import type { CSSProperties } from 'react';
import type { Theme } from '../../../types';

// src/components/app/presentation/buildAppStyle.ts

// Builds CSS custom properties for the top-level app shell theme surface.
// Chrome text (--text-*) stays on the stable daylight/default palette so
// lyric color presets (野火红 etc.) never recolor Settings / lists globally.
export const buildAppStyle = ({
    bgMode,
    isDaylight,
    theme,
    daylightTheme,
    defaultTheme,
    transparentBackground = false,
}: {
    bgMode: string;
    isDaylight: boolean;
    theme: Theme;
    daylightTheme: Theme;
    defaultTheme: Theme;
    transparentBackground?: boolean;
}) => {
    const chromeTheme = isDaylight ? daylightTheme : defaultTheme;

    return {
        '--bg-color': bgMode === 'default' ? chromeTheme.backgroundColor : theme.backgroundColor,
        '--text-primary': chromeTheme.primaryColor,
        '--text-secondary': chromeTheme.secondaryColor,
        '--text-accent': chromeTheme.accentColor,
        // Lyric stage inks — visualizers should prefer theme props; these are escape hatches.
        '--lyric-primary': theme.primaryColor,
        '--lyric-secondary': theme.secondaryColor,
        '--lyric-accent': theme.accentColor,
        backgroundColor: transparentBackground ? 'transparent' : 'var(--bg-color)',
        color: 'var(--text-primary)',
    } as CSSProperties;
};
