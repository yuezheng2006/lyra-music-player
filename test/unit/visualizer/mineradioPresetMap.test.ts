import { describe, expect, it } from 'vitest';
import {
    INTERACTIVE3D_WEBGL_PRESET_INDEX,
    resolveWebGLPresetIndex,
    shouldRenderMineradioWebGL,
} from '../../../src/components/visualizer/geometric/webgl/mineradioPresetMap';

describe('mineradioPresetMap', () => {
    it('maps the three shipped WebGL visual styles to shader uPreset indices', () => {
        expect(INTERACTIVE3D_WEBGL_PRESET_INDEX).toEqual({
            emily: 0,
            tunnel: 1,
            starfield: 5,
        });
    });

    it('enables WebGL when cover particles are on', () => {
        expect(shouldRenderMineradioWebGL('emily', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('starfield', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('tunnel', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('emily', false)).toBe(false);
    });

    it('resolves all three presets to distinct shader branches', () => {
        const indices = (['emily', 'tunnel', 'starfield'] as const).map(resolveWebGLPresetIndex);
        expect(new Set(indices).size).toBe(3);
    });
});
