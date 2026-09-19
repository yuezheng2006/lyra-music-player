// Pure helpers for Nomand image shaders: daylight inversion and pre-zoom so warped sampling stays on-image.

const MAX_OVERSCAN = 1.8;
const OVERSCAN_MARGIN = 0.01;
const REFERENCE_ASPECT = 16 / 9;

export const NOMAND_PAPER_TEXTURE_SHAPE = {
    fiberSize: 0.2,
    crumples: 0.35,
    crumpleSize: 0.35,
    folds: 0.65,
    foldCount: 5,
    drops: 0.2,
    seed: 5.8,
} as const;

export const NOMAND_LENS_SHAPE = {
    perspective: 0.4,
    count: 20,
    focusCenter: 0.55,
    focusEdges: 0.8,
    swirl: 0.08,
    lensCircle: 0.1,
} as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const clampOverscan = (scale: number) => Math.min(MAX_OVERSCAN, Math.max(1, scale));

const applyOverscanMargin = (scale: number) => (scale <= 1 ? 1 : clampOverscan(scale + OVERSCAN_MARGIN));

const overscanForMargin = (margin: number) => applyOverscanMargin(1 / (1 - 2 * Math.min(Math.max(margin, 0), 0.45)));

export const resolveDaylightInversion = (
    inverted: boolean,
    originalColors: boolean,
    isDaylight?: boolean,
) => (isDaylight && !originalColors ? !inverted : inverted);

export const resolveHalftoneInversion = (
    inverted: boolean,
    originalColors: boolean,
    isDaylight?: boolean,
) => resolveDaylightInversion(!inverted, originalColors, isDaylight);

export const getPaperTextureOverscan = (roughness: number, fiber: number) => {
    const { folds, crumples, drops } = NOMAND_PAPER_TEXTURE_SHAPE;
    const maxNormal = 2 * folds
        + 1.5 * crumples
        + 0.2 * drops
        + 0.75 * clamp01(roughness)
        + 0.1 * clamp01(fiber);
    return overscanForMargin(0.02 * maxNormal);
};

export const getLensDistortionOverscan = (bulge: number, spread: number) => {
    const outRadius = 0.5 * Math.hypot(REFERENCE_ASPECT, 1);
    const clampedSpread = clamp01(spread);
    const reach = 0.7 * Math.pow(clampedSpread, 1.3 + 2.7 * clampedSpread);
    const edgeReach = reach * (1 - NOMAND_LENS_SHAPE.focusEdges);
    const headroom = Math.max(0.35, 1 - edgeReach / outRadius);

    if (bulge <= 0) return applyOverscanMargin(1 / headroom);

    const bulgeAmount = Math.min(bulge, 1) * 1.4;
    const cornerPush = (scale: number) => {
        const cornerRn = (2 * outRadius) / scale;
        return Math.tan(cornerRn * bulgeAmount) / Math.tan(bulgeAmount) / cornerRn;
    };

    let low = Math.max(1, (2 * outRadius * bulgeAmount) / 1.45);
    if (low >= MAX_OVERSCAN || cornerPush(MAX_OVERSCAN) > MAX_OVERSCAN * headroom) return MAX_OVERSCAN;
    if (low === 1 && cornerPush(1) <= headroom) return applyOverscanMargin(1 / headroom);

    let high = MAX_OVERSCAN;
    for (let step = 0; step < 32; step += 1) {
        const mid = (low + high) / 2;
        if (cornerPush(mid) > mid * headroom) low = mid;
        else high = mid;
    }
    return applyOverscanMargin(high);
};
