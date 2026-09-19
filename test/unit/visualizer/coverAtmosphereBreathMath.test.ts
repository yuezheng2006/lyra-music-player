import { describe, expect, it } from 'vitest';
import { resolveCoverAtmosphereBreathOpacity, resolveCoverAtmosphereWashOpacity } from '@/utils/visualizer/coverAtmosphereBreathMath';

// test/unit/visualizer/coverAtmosphereBreathMath.test.ts

describe('coverAtmosphereBreathMath', () => {
    it('breathes from audioPower when smart-atmosphere energy is flat', () => {
        const quiet = resolveCoverAtmosphereBreathOpacity(0.42, 10, true);
        const loud = resolveCoverAtmosphereBreathOpacity(0.42, 160, true);
        expect(loud).toBeGreaterThan(quiet);
        expect(loud).toBeLessThanOrEqual(0.82);
        expect(quiet).toBeGreaterThanOrEqual(0.58);
    });

    it('caps opacity when paused', () => {
        const playing = resolveCoverAtmosphereBreathOpacity(0.9, 180, true);
        const paused = resolveCoverAtmosphereBreathOpacity(0.9, 180, false);
        expect(paused).toBeLessThanOrEqual(0.68);
        expect(paused).toBeLessThanOrEqual(playing);
    });

    it('moves breath onto a dim overlay instead of the blurred cover', () => {
        const cover = resolveCoverAtmosphereBreathOpacity(0.42, 160, true);
        const wash = resolveCoverAtmosphereWashOpacity(cover);
        expect(wash).toBeGreaterThan(0.12);
        expect(wash).toBeLessThan(0.55);
        expect(resolveCoverAtmosphereWashOpacity(0.82)).toBeLessThan(resolveCoverAtmosphereWashOpacity(0.58));
    });
});
