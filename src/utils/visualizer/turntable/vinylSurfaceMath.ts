// src/utils/visualizer/turntable/vinylSurfaceMath.ts
// Anisotropic vinyl disc shading (algorithm informed by vinylformac Metal shaders).

export type VinylLightDir = Readonly<{ x: number; y: number }>;

/** Warm key light from upper-left (screen y grows downward). */
export const VINYL_SCENE_LIGHT: VinylLightDir = Object.freeze({
    x: -0.5547,
    y: -0.8321,
});

/** Visual RPM cue: 30° per playback second (aesthetic, not true 33⅓). */
export const VINYL_SPIN_DEGREES_PER_SECOND = 30;

const LABEL_R = 0.318;
const DEADWAX_END = 0.372;
const GROOVE_END = 0.955;
const EDGE_START = 0.982;

const hash21 = (x: number, y: number): number => {
    let px = x * 123.34;
    let py = y * 456.21;
    px = px - Math.floor(px);
    py = py - Math.floor(py);
    const d = px * px + py * py + 45.32 * (px + py);
    px += d;
    py += d;
    return (px * py) - Math.floor(px * py);
};

const vnoise = (x: number, y: number): number => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash21(ix, iy);
    const b = hash21(ix + 1, iy);
    const c = hash21(ix, iy + 1);
    const d = hash21(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

const ringGauss = (rn: number, center: number, width: number): number => {
    const x = (rn - center) / width;
    return Math.exp(-x * x);
};

const smoothstep = (edge0: number, edge1: number, x: number): number => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
};

export type VinylSample = Readonly<{
    r: number;
    g: number;
    b: number;
    a: number;
}>;

/** Sample one pixel of the static vinyl surface in disc-local coords. */
export const sampleVinylSurface = (
    px: number,
    py: number,
    size: number,
    light: VinylLightDir = VINYL_SCENE_LIGHT,
): VinylSample => {
    const c = size * 0.5;
    const dx = px - c;
    const dy = py - c;
    const R = size * 0.5;
    const r = Math.hypot(dx, dy);
    const rn = r / R;

    const alpha = 1 - smoothstep(R - 1.2, R + 0.2, r);
    if (alpha <= 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    const radialX = r > 0.001 ? dx / r : 0;
    const radialY = r > 0.001 ? dy / r : 1;
    const lenL = Math.hypot(light.x, light.y) || 1;
    const Lx = light.x / lenL;
    const Ly = light.y / lenL;

    let sep = ringGauss(rn, 0.455, 0.0075)
        + ringGauss(rn, 0.560, 0.0060)
        + ringGauss(rn, 0.662, 0.0080)
        + ringGauss(rn, 0.778, 0.0060)
        + ringGauss(rn, 0.884, 0.0070);
    sep = Math.min(sep, 1);

    const inGroove = smoothstep(DEADWAX_END, DEADWAX_END + 0.012, rn)
        * (1 - smoothstep(GROOVE_END, GROOVE_END + 0.010, rn));
    const grooveAmp = inGroove * (1 - sep * 0.70);

    const g1 = vnoise(r * 0.70, 3.7) - 0.5;
    const g2 = vnoise(r * 0.22, 9.1) - 0.5;
    const grooves = g1 * 0.6 + g2;

    let base = 0.052
        + grooveAmp * grooves * 0.022
        - sep * inGroove * 0.012;

    const ca = radialX * Lx + radialY * Ly;
    const lobes = ca * ca;
    const env = smoothstep(LABEL_R, 0.46, rn) * (1 - smoothstep(0.965, 1.0, rn));

    let sheen = (lobes ** 2 * 0.045
        + lobes ** 5 * 0.26
        + lobes ** 32 * 0.32)
        * env * (0.30 + 0.70 * grooveAmp);

    const smoothArea = (1 - inGroove) * (rn >= LABEL_R ? 1 : 0);
    sheen += lobes ** 80 * 0.18 * smoothArea * env;

    const ang = Math.atan2(dy, dx);
    const sp = hash21(Math.floor(r * 1.5), Math.floor(ang * 520));
    const sparkle = (sp > 0.997 ? 1 : 0) * lobes ** 4 * grooveAmp * 0.34;

    const bevel = smoothstep(EDGE_START, 1.0, rn);
    base *= 1 - bevel * 0.45;
    const rimLight = bevel * Math.max(0, radialX * Lx + radialY * Ly) * 0.20;

    const sheenR = 1.0;
    const sheenG = 0.94;
    const sheenB = 0.84;

    let rr = base * 1.02 + sheen * sheenR + sparkle + rimLight * sheenR;
    let gg = base * 1.00 + sheen * sheenG + sparkle + rimLight * sheenG;
    let bb = base * 0.98 + sheen * sheenB + sparkle + rimLight * sheenB;

    rr = Math.min(1, Math.max(0, rr)) * alpha;
    gg = Math.min(1, Math.max(0, gg)) * alpha;
    bb = Math.min(1, Math.max(0, bb)) * alpha;

    return { r: rr, g: gg, b: bb, a: alpha };
};

/** Label radius as a fraction of disc diameter (matches vinylformac ~0.315). */
export const VINYL_LABEL_DIAMETER_RATIO = 0.315;

/** Map playback seconds to disc rotation degrees. */
export const vinylSpinDegreesFromTime = (
    currentTimeSec: number,
    degreesPerSecond: number = VINYL_SPIN_DEGREES_PER_SECOND,
): number => {
    if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
    return currentTimeSec * degreesPerSecond;
};
