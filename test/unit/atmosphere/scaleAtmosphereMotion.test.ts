import { describe, expect, it } from 'vitest';
import { scaleAtmosphereMotionSample } from '../../../src/utils/atmosphere/scaleAtmosphereMotion';

// test/unit/atmosphere/scaleAtmosphereMotion.test.ts

describe('scaleAtmosphereMotionSample', () => {
    it('defaults to identity scaling', () => {
        expect(scaleAtmosphereMotionSample({
            beatPulse: 0.8,
            cameraPunch: 0.5,
            atmosphereEnergy: 0.4,
        })).toEqual({
            beatPulse: 0.8,
            cameraPunch: 0.5,
            atmosphereEnergy: 0.4,
        });
    });

    it('scales beat/energy by sensitivity and punch by both factors', () => {
        expect(scaleAtmosphereMotionSample({
            beatPulse: 1,
            cameraPunch: 1,
            atmosphereEnergy: 1,
        }, {
            atmosphereSensitivity: 0.5,
            cameraPunchStrength: 2,
        })).toEqual({
            beatPulse: 0.5,
            cameraPunch: 1,
            atmosphereEnergy: 0.5,
        });
    });
});
