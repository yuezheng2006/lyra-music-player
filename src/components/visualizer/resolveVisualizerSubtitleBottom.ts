// src/components/visualizer/resolveVisualizerSubtitleBottom.ts
// Bottom padding for the shared visualizer subtitle overlay above the docked player bar.

/**
 * Gap between the lowest subtitle line and the top of the docked player bar.
 * Includes room for the edge progress hit area that overhangs above the bar.
 */
export const VISUALIZER_SUBTITLE_BAR_GAP_PX = 36;

/** Bottom padding when the player chrome / docked bar is hidden. */
export const VISUALIZER_SUBTITLE_IMMERSIVE_PADDING_PX = 36;

/**
 * Padding under the subtitle stack so both upcoming lines sit fully above the docked bar.
 * The overlay is anchored to the true bottom; padding lifts the text, so line count
 * no longer needs to be baked into a magic `bottom` offset.
 */
export const resolveVisualizerSubtitleBottom = (isPlayerChromeHidden: boolean): string => (
    isPlayerChromeHidden
        ? `${VISUALIZER_SUBTITLE_IMMERSIVE_PADDING_PX}px`
        : `calc(var(--app-player-bar-height, 72px) + ${VISUALIZER_SUBTITLE_BAR_GAP_PX}px + env(safe-area-inset-bottom, 0px))`
);
