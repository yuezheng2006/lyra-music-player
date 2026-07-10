// src/components/app/home/homeSurfaceStyles.ts
// Opaque home surface colors and shared chrome spacing so content clears titlebar / dock.

export const resolveHomeSolidBackgroundClass = (isDaylight: boolean): string => (
    isDaylight ? 'bg-[#f3f1ec]' : 'bg-[#121214]'
);

/** Clears Electron custom titlebar (h-8) plus a small breathing gap. */
export const HOME_HEADER_TOP_PADDING_CLASS = 'pt-10 md:pt-11';

/** Gap under the search / stage header before provider filters. */
export const HOME_HEADER_BOTTOM_PADDING_CLASS = 'pb-3 md:pb-4';

/** Gap under provider + module filter chrome before the scrollable list. */
export const HOME_FILTER_BOTTOM_PADDING_CLASS = 'pb-4 md:pb-5';

/** Top inset inside the scrollable playlist surface under the filter chrome. */
export const HOME_CONTENT_TOP_PADDING_CLASS = 'pt-3 md:pt-4';

/** Bottom inset so the last cards clear the floating player dock. */
export const resolveHomeContentBottomPaddingClass = (hasFloatingPlayer: boolean): string => (
    hasFloatingPlayer
        ? 'pb-[calc(var(--app-player-bar-height,90px)+28px)]'
        : 'pb-14'
);
