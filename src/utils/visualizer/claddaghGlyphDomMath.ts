// src/utils/visualizer/claddaghGlyphDomMath.ts
// Dirty thresholds for Claddagh per-glyph DOM writes (avoid style thrash).

export type CladdaghGlyphDomCache = {
    x: number;
    y: number;
    rot: number;
    scale: number;
    opacity: number;
    color: string;
};

const POS_EPS = 0.35;
const ROT_EPS = 0.08;
const SCALE_EPS = 0.004;
const OPACITY_EPS = 0.012;

/** True when transform/opacity/color changed enough to warrant a DOM write. */
export const shouldWriteCladdaghGlyphDom = (
    prev: CladdaghGlyphDomCache | undefined,
    next: CladdaghGlyphDomCache,
): boolean => {
    if (!prev) return true;
    if (prev.color !== next.color) return true;
    if (Math.abs(prev.opacity - next.opacity) > OPACITY_EPS) return true;
    if (Math.abs(prev.scale - next.scale) > SCALE_EPS) return true;
    if (Math.abs(prev.rot - next.rot) > ROT_EPS) return true;
    if (Math.abs(prev.x - next.x) > POS_EPS) return true;
    if (Math.abs(prev.y - next.y) > POS_EPS) return true;
    return false;
};

/** Skip expensive transform work for fully hidden waiting glyphs. */
export const isCladdaghGlyphEffectivelyHidden = (opacity: number): boolean => opacity < 0.01;
