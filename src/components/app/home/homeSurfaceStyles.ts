import type { CSSProperties } from 'react';

// src/components/app/home/homeSurfaceStyles.ts
// Shared chrome spacing so home / browse / search content clears titlebar and floating dock.

/** Stable list/browse foreground — daylight only, never follows cover/theme primary. */
export const resolveContentTextColor = (isDaylight: boolean): string => (
    isDaylight ? '#171717' : '#fafafa'
);

export const resolveContentMutedTextColor = (isDaylight: boolean): string => (
    isDaylight ? 'rgba(23, 23, 23, 0.55)' : 'rgba(250, 250, 250, 0.45)'
);

export const resolveHomeSolidBackgroundClass = (_isDaylight: boolean): string => (
    'bg-[var(--shell-surface)] transition-colors duration-500'
);

/** Inline shell background so overlays (GridView etc.) follow cover theme instead of static --bg-color. */
export const resolveShellSurfaceBackgroundStyle = (): CSSProperties => ({
    backgroundColor: 'var(--shell-surface)',
    backgroundImage: 'var(--shell-canvas)',
    // Content text stays neutral; only the canvas/surface tracks the cover palette.
    color: 'var(--content-text)',
});

/**
 * Clears Electron custom titlebar (h-8 ≈ 32px) plus a breathing gap.
 * Use on every full-bleed content surface that starts under the window chrome.
 */
export const HOME_HEADER_TOP_PADDING_CLASS = 'pt-10 md:pt-11';

/** Alias for non-home overlays (search, detail, grid) that share the same titlebar clearance. */
export const APP_CONTENT_TOP_PADDING_CLASS = HOME_HEADER_TOP_PADDING_CLASS;

/** Absolute-positioned chrome (back buttons, floating headers) under the titlebar. */
export const APP_CONTENT_TOP_OFFSET_CLASS = 'top-10 md:top-11';

/** Gap under the search / stage header before provider filters. */
export const HOME_HEADER_BOTTOM_PADDING_CLASS = 'pb-2 md:pb-2.5';

/** Gap under provider + module filter chrome before the scrollable list. */
export const HOME_FILTER_BOTTOM_PADDING_CLASS = 'pb-2.5 md:pb-3';

/** Top inset inside the scrollable playlist surface under the filter chrome. */
export const HOME_CONTENT_TOP_PADDING_CLASS = 'pt-1.5 md:pt-2';

/** Bottom inset so the last cards / rows clear the floating player dock. */
export const resolveHomeContentBottomPaddingClass = (hasFloatingPlayer: boolean): string => (
    hasFloatingPlayer
        ? 'pb-[calc(var(--app-player-bar-height,90px)+20px)]'
        : 'pb-12'
);

/** Alias used by search / browse overlays that always reserve the floating dock. */
export const APP_CONTENT_BOTTOM_PADDING_CLASS = resolveHomeContentBottomPaddingClass(true);

/**
 * Shared interactive list-row chrome for home/browse song lists:
 * pointer cursor + visible hover/active highlight (daylight + dark).
 */
export const resolveBrowseListRowClass = (isDaylight: boolean): string => (
    isDaylight
        ? 'cursor-pointer transition-colors hover:bg-black/[0.07] active:bg-black/[0.1]'
        : 'cursor-pointer transition-colors hover:bg-white/[0.1] active:bg-white/[0.14]'
);
