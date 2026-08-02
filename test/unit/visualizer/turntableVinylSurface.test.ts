import { describe, expect, it } from 'vitest';
import {
    sampleVinylSurface,
    vinylSpinDegreesFromTime,
    VINYL_SCENE_LIGHT,
    VINYL_SPIN_DEGREES_PER_SECOND,
} from '@/utils/visualizer/turntable/vinylSurfaceMath';
import { bakeVinylSurfaceRgba } from '@/utils/visualizer/turntable/bakeVinylSurface';

// test/unit/visualizer/turntableVinylSurface.test.ts

describe('vinylSurfaceMath', () => {
    it('maps playback time to spin degrees', () => {
        expect(vinylSpinDegreesFromTime(0)).toBe(0);
        expect(vinylSpinDegreesFromTime(2)).toBe(2 * VINYL_SPIN_DEGREES_PER_SECOND);
        expect(vinylSpinDegreesFromTime(Number.NaN)).toBe(0);
    });

    it('returns transparent outside the disc', () => {
        const outside = sampleVinylSurface(0, 0, 100, VINYL_SCENE_LIGHT);
        expect(outside.a).toBe(0);
    });

    it('puts anisotropic sheen on the light axis, not the perpendicular groove', () => {
        const size = 200;
        const c = size / 2;
        const radius = 55;
        const lightLen = Math.hypot(VINYL_SCENE_LIGHT.x, VINYL_SCENE_LIGHT.y);
        const lx = VINYL_SCENE_LIGHT.x / lightLen;
        const ly = VINYL_SCENE_LIGHT.y / lightLen;
        // ca² is high along ±light; low when radial ⟂ light.
        const along = sampleVinylSurface(c + lx * radius, c + ly * radius, size, VINYL_SCENE_LIGHT);
        const across = sampleVinylSurface(c + (-ly) * radius, c + lx * radius, size, VINYL_SCENE_LIGHT);
        expect(along.a).toBeGreaterThan(0.9);
        expect(across.a).toBeGreaterThan(0.9);
        const alongLum = along.r * 0.3 + along.g * 0.59 + along.b * 0.11;
        const acrossLum = across.r * 0.3 + across.g * 0.59 + across.b * 0.11;
        expect(alongLum).toBeGreaterThan(acrossLum);
    });
});

describe('bakeVinylSurfaceRgba', () => {
    it('bakes a square RGBA buffer with a transparent corner and opaque center', () => {
        const image = bakeVinylSurfaceRgba(64);
        expect(image.width).toBe(64);
        expect(image.height).toBe(64);
        expect(image.data[3]).toBe(0);
        const mid = (32 * 64 + 32) * 4;
        expect(image.data[mid + 3]).toBeGreaterThan(200);
    });
});
