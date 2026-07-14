import { afterEach, describe, expect, it } from 'vitest';
import {
    dampedSpring,
    resolveCaptureElapsed,
    seeded,
    shouldEnableCoverParticleCaptureBridge,
} from '../../../src/components/visualizer/geometric/webgl/coverParticleCaptureMath';

// test/unit/visualizer/coverParticleCaptureMath.test.ts
// Deterministic capture math for cover-particle offline/test rendering.

describe('coverParticleCaptureMath', () => {
    afterEach(() => {
        Reflect.deleteProperty(globalThis as typeof globalThis & { localStorage?: Storage }, 'localStorage');
    });

    it('seeded returns a stable value in [0, 1) for a fixed seed', () => {
        expect(seeded(41)).toBeCloseTo(0.934264113449899, 12);
        expect(seeded(41)).toBe(seeded(41));
        expect(seeded(0)).toBe(0);
    });

    it('resolveCaptureElapsed wraps progress into [0, 1) then scales by loopSeconds', () => {
        expect(resolveCaptureElapsed(0.25, 62)).toBe(15.5);
        expect(resolveCaptureElapsed(1.25, 62)).toBe(15.5);
        expect(resolveCaptureElapsed(-0.25, 62)).toBe(46.5);
        expect(resolveCaptureElapsed(0, 8)).toBe(0);
    });

    it('dampedSpring steps toward the target with a known literal result', () => {
        const step = dampedSpring(0, 0, 1, 0.85, 1 / 30);
        expect(step.value).toBeCloseTo(0.02283742366522093, 12);
        expect(step.velocity).toBeCloseTo(0.6851227099566278, 12);
    });

    it('enables the capture bridge for Vitest MODE or the localStorage flag', () => {
        expect(shouldEnableCoverParticleCaptureBridge()).toBe(import.meta.env.MODE === 'test');

        const store = new Map<string, string>();
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => { store.set(key, value); },
                removeItem: (key: string) => { store.delete(key); },
            },
        });
        localStorage.setItem('cover_particle_capture_bridge', '1');
        expect(shouldEnableCoverParticleCaptureBridge()).toBe(true);
    });
});
