import { describe, expect, it } from 'vitest';
import {
    INTERACTIVE3D_WEBGL_PRESET_INDEX,
    resolveWebGLPresetIndex,
    shouldRenderMineradioWebGL,
} from '../../../src/components/visualizer/geometric/webgl/mineradioPresetMap';

describe('mineradioPresetMap', () => {
    it('maps shipped WebGL visual styles to shader uPreset indices', () => {
        expect(INTERACTIVE3D_WEBGL_PRESET_INDEX).toEqual({
            emily: 0,
            starfield: 1,
            tunnel: 5,
            nebula: 2,
            terrain: 3,
            quantumCube: 4,
            aurora: 6,
            mineradioTunnel: 7,
            mineradioOrbit: 8,
            mineradioVoid: 9,
            mineradioVinyl: 10,
            mineradioGalaxy: 11,
        });
    });

    it('enables WebGL when cover particles are on', () => {
        expect(shouldRenderMineradioWebGL('emily', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('quantumCube', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('mineradioGalaxy', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('nebula', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('emily', false)).toBe(false);
    });

    it('resolves removed presets to the cover shader branch', () => {
        expect(resolveWebGLPresetIndex('aurora')).toBe(0);
        expect(resolveWebGLPresetIndex('terrain')).toBe(0);
        expect(resolveWebGLPresetIndex('mineradioVoid')).toBe(0);
    });
});
