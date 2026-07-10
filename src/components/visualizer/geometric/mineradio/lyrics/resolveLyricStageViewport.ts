// src/components/visualizer/geometric/mineradio/lyrics/resolveLyricStageViewport.ts
// Computes the max on-screen world width for Mineradio stage lyrics.

export type LyricStageViewport = {
    aspect: number;
    fovDeg: number;
    /** Distance from camera to the lyric plane (world units). */
    cameraDistance: number;
    /**
     * Usable fraction of the visible frustum width after edge padding.
     * Lower = more distance from container edges.
     */
    margin?: number;
    /** Extra horizontal inset as a fraction of frustum width (each side). */
    edgeInset?: number;
    /** Allow a larger on-screen lyric plane (fullscreen / desktop-lyrics feel). */
    immersive?: boolean;
};

/** Camera-local distance for screen-locked stage lyrics. */
export const LYRIC_STAGE_CAMERA_DISTANCE = 4.2;
/** Slight upward bias in camera space (NDC-ish feel). */
export const LYRIC_STAGE_CAMERA_Y = 0.12;

/** Default usable width fraction — leaves clear padding from container edges. */
export const LYRIC_STAGE_DEFAULT_MARGIN = 0.72;
/** Extra inset per side on top of margin (bloom / glow / sidebar chrome). */
export const LYRIC_STAGE_DEFAULT_EDGE_INSET = 0.08;
/** Immersive fullscreen: fill more of the stage like desktop lyrics. */
export const LYRIC_STAGE_IMMERSIVE_MARGIN = 0.90;
export const LYRIC_STAGE_IMMERSIVE_EDGE_INSET = 0.03;
const MIN_WORLD_WIDTH = 0.9;
const MAX_WORLD_WIDTH = 4.8;
const IMMERSIVE_MAX_WORLD_WIDTH = 7.2;

/** Visible frustum width at the lyric plane, then clamped for stage layout. */
export const resolveLyricStageMaxWorldWidth = (viewport: LyricStageViewport): number => {
    const aspect = Math.max(0.2, viewport.aspect || 1);
    const fovRad = ((viewport.fovDeg || 45) * Math.PI) / 180;
    const distance = Math.max(0.5, viewport.cameraDistance || LYRIC_STAGE_CAMERA_DISTANCE);
    const visibleHeight = 2 * Math.tan(fovRad * 0.5) * distance;
    const visibleWidth = visibleHeight * aspect;
    const immersive = Boolean(viewport.immersive);
    const margin = Math.min(
        0.94,
        Math.max(0.4, viewport.margin ?? (immersive ? LYRIC_STAGE_IMMERSIVE_MARGIN : LYRIC_STAGE_DEFAULT_MARGIN)),
    );
    const edgeInset = Math.min(
        0.18,
        Math.max(0, viewport.edgeInset ?? (immersive ? LYRIC_STAGE_IMMERSIVE_EDGE_INSET : LYRIC_STAGE_DEFAULT_EDGE_INSET)),
    );
    const usable = visibleWidth * Math.max(0.35, margin - edgeInset * 2);
    const maxWidth = immersive ? IMMERSIVE_MAX_WORLD_WIDTH : MAX_WORLD_WIDTH;
    return Math.min(maxWidth, Math.max(MIN_WORLD_WIDTH, usable));
};

/** Scale factor so a lyric plane of `textWorldWidth` stays inside the viewport. */
export const resolveLyricStageFitScale = (
    textWorldWidth: number,
    maxWorldWidth: number,
): number => {
    if (!(textWorldWidth > 0) || !(maxWorldWidth > 0)) return 1;
    return Math.min(1, maxWorldWidth / textWorldWidth);
};
