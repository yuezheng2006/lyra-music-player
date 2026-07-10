import type { CSSProperties } from 'react';

// src/components/floatingPlayerDockLayout.ts
// Geometry for the floating dock so wide screens do not stretch controls into a flat strip.

/** Visible dock chrome height (cover + transport row). */
export const FLOATING_PLAYER_DOCK_HEIGHT_PX = 76;

/** Bottom inset under the floating dock. */
export const FLOATING_PLAYER_DOCK_BOTTOM_INSET_PX = 14;

/** Side inset from the content area edges. */
export const FLOATING_PLAYER_DOCK_SIDE_INSET_PX = 16;

/**
 * Cap dock width on ultrawide windows so left / transport / right stay balanced.
 * Below this width the dock still fills the content area (minus side insets).
 */
export const FLOATING_PLAYER_DOCK_MAX_WIDTH_PX = 1080;

/** Horizontal inset so the edge scrubber clears the capsule corners. */
export const FLOATING_PLAYER_PROGRESS_INSET_PX = 48;

/**
 * Dock tool buttons are ~36px and vertically centered in the 76px dock.
 * Popovers anchored to a button need this extra lift so their bottom clears the dock chrome.
 */
export const FLOATING_PLAYER_DOCK_TOOL_BUTTON_HEIGHT_PX = 36;
export const FLOATING_PLAYER_DOCK_POPOVER_GAP_PX = 14;
export const FLOATING_PLAYER_DOCK_POPOVER_OFFSET_PX =
    Math.ceil((FLOATING_PLAYER_DOCK_HEIGHT_PX - FLOATING_PLAYER_DOCK_TOOL_BUTTON_HEIGHT_PX) / 2)
    + FLOATING_PLAYER_DOCK_POPOVER_GAP_PX;

/** CSS length reserved under content / subtitles for the floating dock. */
export const resolveFloatingPlayerBarReserve = (immersive: boolean): string => (
    immersive
        ? '0px'
        : `${FLOATING_PLAYER_DOCK_HEIGHT_PX + FLOATING_PLAYER_DOCK_BOTTOM_INSET_PX}px`
);

/** Outer fixed frame that spans the main content column. */
export const resolveFloatingPlayerDockFrameStyle = (hidden: boolean): CSSProperties => ({
    left: `calc(var(--app-sidebar-width, 0px) + ${FLOATING_PLAYER_DOCK_SIDE_INSET_PX}px)`,
    right: `${FLOATING_PLAYER_DOCK_SIDE_INSET_PX}px`,
    bottom: `${FLOATING_PLAYER_DOCK_BOTTOM_INSET_PX}px`,
    height: hidden ? 0 : `${FLOATING_PLAYER_DOCK_HEIGHT_PX}px`,
    pointerEvents: hidden ? 'none' : 'auto',
});
