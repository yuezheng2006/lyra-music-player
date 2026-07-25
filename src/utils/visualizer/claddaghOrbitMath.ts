// src/utils/visualizer/claddaghOrbitMath.ts
// Claddagh (回环): collar / 项圈 parallel to the ground — text rides the vertical wall.

/**
 * Camera elevation from horizontal (deg).
 * Near 0° = eye-level with the ground collar → front/back collapse to one
 * equatorial line (只能看到一条线). Keep a tiny lift so the wall still reads.
 */
export const CLADDAGH_RING_ELEVATION_DEG = 6;

/** Camera focal length in ring-radius units. */
export const CLADDAGH_RING_FOCAL = 3.4;

/** Collar wall height — the visible thickness of the equatorial band. */
export const CLADDAGH_COLLAR_WALL_RATIO = 0.1;

/** Outer/inner rim thickness relative to the lyric track radius. */
export const CLADDAGH_ORBIT_RING_BAND = 0.045;

/** Samples for the projected SVG collar path (equator is nearly a line — fewer samples OK). */
export const CLADDAGH_RING_PATH_SAMPLES = 48;

/**
 * Adjacent-line orbit step (radians).
 * Full π sweeps the entire equator and feels huge; a short nudge keeps handoff soft.
 */
export const CLADDAGH_LINE_ORBIT_PHASE_STEP = Math.PI * 0.22;

/** Front-wall highlight arc half-span (radians around θ=0). */
export const CLADDAGH_FRONT_ARC_HALF_SPAN = 0.72;

/** Projected height/width of the ground circle under the current elevation. */
export const CLADDAGH_ORBIT_MINOR_RATIO = Math.sin((CLADDAGH_RING_ELEVATION_DEG * Math.PI) / 180);

export type CladdaghRingPoint = {
    x: number;
    y: number;
    z: number;
    /** 0 back … 1 front (nearest to camera). */
    depth: number;
    perspectiveScale: number;
    tangentAngleDeg: number;
};

export type CladdaghOrbitRingGuide = {
    cx: number;
    cy: number;
    radius: number;
    /** Mid-wall track (where lyrics ride). */
    trackPath: string;
    /** Soft outer underlay (slightly thicker track for energy bloom). */
    glowPath: string;
    /** Top rim of the collar wall. */
    rimTopPath: string;
    /** Bottom rim of the collar wall. */
    rimBottomPath: string;
    /** Short bright arc on the front wall. */
    frontArcPath: string;
    /** Filled wall band between top and bottom rims. */
    bandPath: string;
    rotateDeg: number;
};

const normalizeReadableAngle = (angle: number): number => {
    let next = angle % 180;
    if (next > 90) next -= 180;
    if (next < -90) next += 180;
    return next;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const toRad = (deg: number): number => (deg * Math.PI) / 180;

const ELEVATION_RAD = toRad(CLADDAGH_RING_ELEVATION_DEG);
const SIN_ELEVATION = Math.sin(ELEVATION_RAD);
const COS_ELEVATION = Math.cos(ELEVATION_RAD);
const TANGENT_EPS = 0.035;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Point on the collar: ground-parallel circle + vertical wall offset (Y up).
 * θ=0 → front / near wall facing the camera.
 */
const collarPoint3d = (
    theta: number,
    radius: number,
    wallYUp: number,
    elevationRad = ELEVATION_RAD,
): { x: number; y: number; z: number } => {
    const x = Math.sin(theta) * radius;
    const z = Math.cos(theta) * radius; // θ=0 → +Z front
    const sinE = elevationRad === ELEVATION_RAD ? SIN_ELEVATION : Math.sin(elevationRad);
    const cosE = elevationRad === ELEVATION_RAD ? COS_ELEVATION : Math.cos(elevationRad);
    // Look down around X. Screen +Y is down.
    // y_screen = -wallYUp·cosE + z·sinE  → front rim at bottom; wall rises toward camera.
    return {
        x,
        y: -wallYUp * cosE + z * sinE,
        z: wallYUp * sinE + z * cosE,
    };
};

const perspectiveProject = (
    x: number,
    y: number,
    z: number,
    focal: number,
): { x: number; y: number; scale: number } => {
    const denom = Math.max(0.45, focal - z);
    const scale = focal / denom;
    return {
        x: x * scale,
        y: y * scale,
        scale,
    };
};

/** Ring radius for the equatorial collar line across the stage. */
export const resolveCladdaghOrbitMajorRadius = (
    width: number,
    height: number,
    radiusScale = 1,
): number => {
    const safeWidth = Math.max(0, width);
    const safeHeight = Math.max(0, height);
    if (safeWidth <= 0 && safeHeight <= 0) {
        return 320 * Math.max(0.5, radiusScale);
    }
    // Almost a horizontal line: width dominates; height only needs wall band + tiny oval.
    const maxByWidth = safeWidth > 0 ? safeWidth * 0.42 : Number.POSITIVE_INFINITY;
    const wallBand = Math.max(0.08, CLADDAGH_ORBIT_MINOR_RATIO + CLADDAGH_COLLAR_WALL_RATIO);
    const maxByHeight = safeHeight > 0
        ? (safeHeight * 0.28) / wallBand
        : Number.POSITIVE_INFINITY;
    const base = Math.min(maxByWidth, maxByHeight, 520);
    const fallback = Number.isFinite(base) ? base : 320;
    return fallback * Math.max(0.5, radiusScale);
};

export const resolveCladdaghOrbitRingRadius = resolveCladdaghOrbitMajorRadius;

export const resolveCladdaghOrbitMinorRadius = (majorRadius: number): number => (
    Math.max(0, majorRadius) * CLADDAGH_ORBIT_MINOR_RATIO
);

export const resolveCladdaghCollarWallHeight = (radius: number): number => (
    Math.max(0, radius) * CLADDAGH_COLLAR_WALL_RATIO
);

/**
 * Project a lyric point on the collar wall (mid-height of the 项圈壁).
 * Oval is centered on stage; front wall sits at the bottom of the oval.
 * Hot path: default elevation avoids per-call front/back rebuilds.
 */
export const projectCladdaghRingPoint = (
    theta: number,
    radius: number,
    spacingFactor = 1,
    options?: { elevationDeg?: number; focal?: number; wallYUp?: number },
): CladdaghRingPoint => {
    const safeRadius = Math.max(0, radius) * Math.max(0.05, spacingFactor);
    const elevationDeg = options?.elevationDeg ?? CLADDAGH_RING_ELEVATION_DEG;
    const focalUnits = options?.focal ?? CLADDAGH_RING_FOCAL;
    const elevationRad = elevationDeg === CLADDAGH_RING_ELEVATION_DEG
        ? ELEVATION_RAD
        : toRad(elevationDeg);
    const sinE = elevationRad === ELEVATION_RAD ? SIN_ELEVATION : Math.sin(elevationRad);
    const cosE = elevationRad === ELEVATION_RAD ? COS_ELEVATION : Math.cos(elevationRad);
    const focal = Math.max(0.8, focalUnits) * Math.max(safeRadius, 1);
    const wallHeight = safeRadius * CLADDAGH_COLLAR_WALL_RATIO;
    // Lyrics sit on the outer wall, mid-band — 文字在项圈的壁.
    const wallYUp = options?.wallYUp ?? wallHeight * 0.45;

    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const worldX = sinT * safeRadius;
    const worldZ = cosT * safeRadius;
    const pointY = -wallYUp * cosE + worldZ * sinE;
    const pointZ = wallYUp * sinE + worldZ * cosE;

    const denom = Math.max(0.45, focal - pointZ);
    const perspectiveScale = focal / denom;
    const x = worldX * perspectiveScale;
    const y = pointY * perspectiveScale;

    // Analytic depth: back…front along camera Z for this radius/wall.
    const backZ = wallYUp * sinE - safeRadius * cosE;
    const zSpan = Math.max(1e-6, 2 * safeRadius * cosE);
    const depth = clamp01((pointZ - backZ) / zSpan);

    // Tangent from two cheap neighbors (reuse sin/cos of theta±eps).
    const sinBefore = Math.sin(theta - TANGENT_EPS);
    const cosBefore = Math.cos(theta - TANGENT_EPS);
    const sinAfter = Math.sin(theta + TANGENT_EPS);
    const cosAfter = Math.cos(theta + TANGENT_EPS);
    const beforeZ = wallYUp * sinE + cosBefore * safeRadius * cosE;
    const afterZ = wallYUp * sinE + cosAfter * safeRadius * cosE;
    const beforeY = -wallYUp * cosE + cosBefore * safeRadius * sinE;
    const afterY = -wallYUp * cosE + cosAfter * safeRadius * sinE;
    const beforeScale = focal / Math.max(0.45, focal - beforeZ);
    const afterScale = focal / Math.max(0.45, focal - afterZ);
    const p0x = sinBefore * safeRadius * beforeScale;
    const p0y = beforeY * beforeScale;
    const p1x = sinAfter * safeRadius * afterScale;
    const p1y = afterY * afterScale;

    return {
        x,
        y,
        z: pointZ,
        depth,
        perspectiveScale,
        tangentAngleDeg: normalizeReadableAngle(
            Math.atan2(p1y - p0y, p1x - p0x) * RAD_TO_DEG,
        ),
    };
};

/** Soft compress on the front wall so the hero stays readable. */
export const applyCladdaghFrontCenterPull = (
    x: number,
    y: number,
    focus: number,
    pullStrength = 0.3,
): { x: number; y: number } => {
    const pull = clamp01(focus) * Math.min(0.55, Math.max(0, pullStrength));
    return {
        x: x * (1 - pull * 0.55),
        y: y * (1 - pull * 0.1),
    };
};

const buildCollarPolyline = (
    radius: number,
    wallYUp: number,
    cx: number,
    cy: number,
    samples: number,
    close: boolean,
): string => {
    if (radius <= 0 || samples < 3) {
        return '';
    }
    const elevationRad = toRad(CLADDAGH_RING_ELEVATION_DEG);
    const focal = Math.max(0.8, CLADDAGH_RING_FOCAL) * Math.max(radius, 1);
    const parts: string[] = [];
    for (let i = 0; i <= samples; i += 1) {
        const theta = (i / samples) * Math.PI * 2;
        const point = collarPoint3d(theta, radius, wallYUp, elevationRad);
        const projected = perspectiveProject(point.x, point.y, point.z, focal);
        parts.push(`${i === 0 ? 'M' : 'L'} ${(cx + projected.x).toFixed(2)} ${(cy + projected.y).toFixed(2)}`);
    }
    if (close) {
        parts.push('Z');
    }
    return parts.join(' ');
};

/** Open arc along the collar between thetaStart…thetaEnd (inclusive). */
const buildCollarArcPolyline = (
    radius: number,
    wallYUp: number,
    cx: number,
    cy: number,
    thetaStart: number,
    thetaEnd: number,
    samples: number,
): string => {
    if (radius <= 0 || samples < 2) {
        return '';
    }
    const elevationRad = toRad(CLADDAGH_RING_ELEVATION_DEG);
    const focal = Math.max(0.8, CLADDAGH_RING_FOCAL) * Math.max(radius, 1);
    const parts: string[] = [];
    for (let i = 0; i <= samples; i += 1) {
        const t = i / samples;
        const theta = thetaStart + (thetaEnd - thetaStart) * t;
        const point = collarPoint3d(theta, radius, wallYUp, elevationRad);
        const projected = perspectiveProject(point.x, point.y, point.z, focal);
        parts.push(`${i === 0 ? 'M' : 'L'} ${(cx + projected.x).toFixed(2)} ${(cy + projected.y).toFixed(2)}`);
    }
    return parts.join(' ');
};

/**
 * Equatorial collar guide: wall band + twin rims + mid track + front energy arc.
 */
export const resolveCladdaghOrbitRingGuide = (
    width: number,
    height: number,
    majorRadius: number,
    _ellipseTiltDeg = 0,
): CladdaghOrbitRingGuide => {
    const radius = Math.max(0, majorRadius);
    const cx = Math.max(0, width) / 2;
    const cy = Math.max(0, height) / 2;
    const wallHeight = resolveCladdaghCollarWallHeight(radius);
    const samples = CLADDAGH_RING_PATH_SAMPLES;
    const bottom = buildCollarPolyline(radius, 0, cx, cy, samples, true);
    const top = buildCollarPolyline(radius, wallHeight, cx, cy, samples, true);
    const mid = buildCollarPolyline(radius, wallHeight * 0.45, cx, cy, samples, true);
    const glow = buildCollarPolyline(radius, wallHeight * 0.5, cx, cy, samples, true);
    const frontArc = buildCollarArcPolyline(
        radius,
        wallHeight * 0.48,
        cx,
        cy,
        -CLADDAGH_FRONT_ARC_HALF_SPAN,
        CLADDAGH_FRONT_ARC_HALF_SPAN,
        28,
    );
    // Even-odd band between top and bottom rims → visible collar wall.
    const bandPath = top && bottom ? `${top} ${bottom}` : '';
    return {
        cx,
        cy,
        radius,
        trackPath: mid,
        glowPath: glow,
        rimTopPath: top,
        rimBottomPath: bottom,
        frontArcPath: frontArc,
        bandPath,
        rotateDeg: 0,
    };
};

/**
 * Glyphs lean with the collar wall path; front wall stays more upright toward the viewer.
 */
export const resolveCladdaghGlyphTiltDeg = (
    tangentAngleDeg: number,
    depth: number,
    focus: number,
): number => {
    const d = clamp01(depth);
    const f = clamp01(focus);
    // On the wall: keep a readable lean along the collar; soften at focus.
    const lean = (0.35 + 0.45 * (1 - d)) * (1 - 0.55 * f);
    const tilted = tangentAngleDeg * lean;
    return Math.max(-40, Math.min(40, tilted));
};

export const resolveCladdaghOrbitDepth = (thetaCurve: number): number => (
    (Math.cos(thetaCurve) + 1) / 2
);

export const isCladdaghLaterAtRight = (): boolean => {
    const later = projectCladdaghRingPoint(0.35, 100);
    return later.x > 0;
};

export const resolveCladdaghAxisTiltDeg = (_ellipseTiltDeg: number): number => 0;

export const resolveCladdaghLineOrbitPhase = (lineIndex: number): number => (
    lineIndex * CLADDAGH_LINE_ORBIT_PHASE_STEP
);
