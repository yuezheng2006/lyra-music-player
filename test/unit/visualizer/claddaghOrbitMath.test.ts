import { describe, expect, it } from 'vitest';
import {
    CLADDAGH_COLLAR_WALL_RATIO,
    CLADDAGH_LINE_ORBIT_PHASE_STEP,
    CLADDAGH_RING_ELEVATION_DEG,
    applyCladdaghFrontCenterPull,
    isCladdaghLaterAtRight,
    projectCladdaghRingPoint,
    resolveCladdaghCollarWallHeight,
    resolveCladdaghGlyphTiltDeg,
    resolveCladdaghLineOrbitPhase,
    resolveCladdaghOrbitMajorRadius,
    resolveCladdaghOrbitRingGuide,
} from '@/utils/visualizer/claddaghOrbitMath';

// test/unit/visualizer/claddaghOrbitMath.test.ts

describe('claddaghOrbitMath — equatorial collar line', () => {
    it('is nearly eye-level so the collar collapses to one equatorial line', () => {
        expect(CLADDAGH_RING_ELEVATION_DEG).toBeLessThanOrEqual(14);
        expect(CLADDAGH_RING_ELEVATION_DEG).toBeGreaterThan(4);
        const left = projectCladdaghRingPoint(-Math.PI / 2, 400);
        const right = projectCladdaghRingPoint(Math.PI / 2, 400);
        const front = projectCladdaghRingPoint(0, 400);
        const back = projectCladdaghRingPoint(Math.PI, 400);
        const widthSpan = Math.abs(right.x - left.x);
        const heightSpan = Math.abs(front.y - back.y);
        // Width dominates — reads as a line / equator, not an open oval.
        expect(widthSpan / Math.max(heightSpan, 1)).toBeGreaterThan(4);
    });

    it('keeps the front wall near the equator band (文字在前壁)', () => {
        const front = projectCladdaghRingPoint(0, 400);
        const back = projectCladdaghRingPoint(Math.PI, 400);
        expect(front.depth).toBeCloseTo(1, 2);
        expect(Math.abs(front.y - back.y)).toBeLessThan(100);
    });

    it('gives the equatorial band a short collar wall', () => {
        expect(CLADDAGH_COLLAR_WALL_RATIO).toBeGreaterThan(0.06);
        expect(resolveCladdaghCollarWallHeight(400)).toBeCloseTo(40);
    });

    it('keeps later words on the right along the equator', () => {
        expect(isCladdaghLaterAtRight()).toBe(true);
        expect(projectCladdaghRingPoint(0.4, 400).x).toBeGreaterThan(0);
    });

    it('builds a layered equatorial collar guide', () => {
        const guide = resolveCladdaghOrbitRingGuide(1000, 800, 400, 0);
        expect(guide.cx).toBe(500);
        expect(guide.cy).toBe(400);
        expect(guide.trackPath.startsWith('M ')).toBe(true);
        expect(guide.glowPath.startsWith('M ')).toBe(true);
        expect(guide.rimTopPath.startsWith('M ')).toBe(true);
        expect(guide.rimBottomPath.startsWith('M ')).toBe(true);
        expect(guide.frontArcPath.startsWith('M ')).toBe(true);
        expect(guide.bandPath.length).toBeGreaterThan(guide.trackPath.length);
    });

    it('only mildly compresses focus on the front wall', () => {
        const side = projectCladdaghRingPoint(Math.PI / 2, 400);
        const pulled = applyCladdaghFrontCenterPull(side.x, side.y, 1);
        expect(Math.abs(pulled.x)).toBeGreaterThan(Math.abs(side.x) * 0.35);
    });

    it('caps collar radius for a wide equatorial line', () => {
        expect(resolveCladdaghOrbitMajorRadius(1000, 2000, 1)).toBeCloseTo(420);
        expect(resolveCladdaghOrbitMajorRadius(2000, 2000, 1)).toBe(520);
    });

    it('keeps focus glyphs more upright than far-wall ghosts', () => {
        expect(Math.abs(resolveCladdaghGlyphTiltDeg(40, 1, 1)))
            .toBeLessThan(Math.abs(resolveCladdaghGlyphTiltDeg(40, 0, 0)));
    });

    it('keeps line handoff moving in the same direction as word progression', () => {
        const firstPhase = resolveCladdaghLineOrbitPhase(0);
        const nextPhase = resolveCladdaghLineOrbitPhase(1);
        const wordProgressionDelta = -0.1;
        const handoffDelta = -(nextPhase - firstPhase);

        expect(CLADDAGH_LINE_ORBIT_PHASE_STEP).toBeLessThan(Math.PI * 0.35);
        expect(firstPhase).toBeCloseTo(0);
        expect(nextPhase).toBeCloseTo(CLADDAGH_LINE_ORBIT_PHASE_STEP);
        expect(Math.sign(handoffDelta)).toBe(Math.sign(wordProgressionDelta));
    });
});
