import type { CSSProperties } from 'react';

// src/components/app/home/homeSurfaceStyles.ts
// Shared chrome spacing so home / browse / search content clears titlebar and floating dock.

export const resolveHomeSolidBackgroundClass = (_isDaylight: boolean): string => (
    'bg-[var(--shell-surface)] transition-colors duration-500'
);

/** Inline shell background so overlays (GridView etc.) follow cover theme instead of static --bg-color. */
export const resolveShellSurfaceBackgroundStyle = (): CSSProperties => ({
    backgroundColor: 'var(--shell-surface)',
    backgroundImage: 'var(--shell-canvas)',
    color: 'var(--shell-text)',
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
