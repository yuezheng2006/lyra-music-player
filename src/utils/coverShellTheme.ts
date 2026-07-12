import { colorWithAlpha, mixColors, parseColorChannels } from '../components/visualizer/colorMix';

// src/utils/coverShellTheme.ts
// Derives stable, readable application-chrome colors from extracted cover palette data.

export type CoverShellTheme = {
    surface: string;
    canvas: string;
    stageAtmosphere: string;
    sidebarGlass: string;
    dockGlass: string;
    popover: string;
    text: string;
    mutedText: string;
    border: string;
    hover: string;
};

const getRelativeLuminance = (color: string) => {
    const channels = parseColorChannels(color);
    if (!channels) {
        return 0;
    }

    const linearize = (channel: number) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    return (
        0.2126 * linearize(channels.r)
        + 0.7152 * linearize(channels.g)
        + 0.0722 * linearize(channels.b)
    );
};

const resolveForeground = (background: string) => (
    getRelativeLuminance(background) > 0.36 ? '#171717' : '#fafafa'
);

export const createCoverShellTheme = (
    coverColors: string[],
    isDaylight: boolean,
): CoverShellTheme => {
    const fallback = isDaylight ? '#f5f5f4' : '#09090b';
    const dominant = coverColors[0] ?? fallback;
    const canvasBase = isDaylight ? '#eafaff' : '#071922';
    const surface = coverColors.length > 0
        ? mixColors(
            canvasBase,
            dominant,
            isDaylight ? 0.58 : 0.65,
        )
        : fallback;
    const sidebarSurface = mixColors(dominant, canvasBase, isDaylight ? 0.35 : 0.52);
    const dockSurface = mixColors(dominant, canvasBase, isDaylight ? 0.28 : 0.43);
    const text = resolveForeground(surface);
    const textIsDark = text === '#171717';

    return {
        surface,
        canvas: `radial-gradient(ellipse at 50% 18%, ${colorWithAlpha(dominant, isDaylight ? 0.34 : 0.42)} 0%, transparent 64%), linear-gradient(180deg, ${colorWithAlpha(surface, 0.98)} 0%, ${colorWithAlpha(surface, 0.9)} 100%)`,
        stageAtmosphere: `radial-gradient(ellipse 88% 82% at 50% 44%, ${colorWithAlpha(dominant, isDaylight ? 0.38 : 0.48)} 0%, ${colorWithAlpha(dominant, isDaylight ? 0.2 : 0.28)} 42%, transparent 78%), linear-gradient(180deg, ${colorWithAlpha(surface, isDaylight ? 0.3 : 0.38)} 0%, ${colorWithAlpha(surface, isDaylight ? 0.2 : 0.26)} 100%)`,
        sidebarGlass: colorWithAlpha(sidebarSurface, 0.94),
        dockGlass: colorWithAlpha(dockSurface, 0.88),
        popover: mixColors(surface, textIsDark ? '#ffffff' : '#000000', textIsDark ? 0.14 : 0.2),
        text,
        mutedText: colorWithAlpha(text, 0.62),
        border: colorWithAlpha(text, 0.12),
        hover: colorWithAlpha(text, 0.09),
    };
};
