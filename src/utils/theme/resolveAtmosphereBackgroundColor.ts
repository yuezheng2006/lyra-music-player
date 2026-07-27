// src/utils/theme/resolveAtmosphereBackgroundColor.ts
// Dual ownership: cover/chrome owns atmosphere wash; AI/custom theme owns lyric ink separately.

export type ThemeSourceBgMode = 'default' | 'ai' | 'custom' | string;

type ResolveAtmosphereBackgroundColorInput = {
    bgMode: ThemeSourceBgMode;
    chromeBackgroundColor: string;
    themeBackgroundColor: string;
    /** Cover-derived stage wash from useCoverShellTheme; preferred for default/ai. */
    shellCanvasBackground?: string | null;
};

/**
 * Atmosphere fill for app `--bg-color` / common stage wash.
 * AI lyric themes must not replace cover/chrome atmosphere; custom themes still own their wash.
 */
export const resolveAtmosphereBackgroundColor = ({
    bgMode,
    chromeBackgroundColor,
    themeBackgroundColor,
    shellCanvasBackground = null,
}: ResolveAtmosphereBackgroundColorInput): string => {
    if (bgMode === 'custom') {
        return themeBackgroundColor;
    }

    const shell = typeof shellCanvasBackground === 'string' ? shellCanvasBackground.trim() : '';
    if (shell) {
        return shell;
    }

    return chromeBackgroundColor;
};
