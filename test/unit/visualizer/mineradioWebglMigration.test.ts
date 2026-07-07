import { describe, expect, it } from 'vitest';
import { coverParticleGridForResolution } from '@/components/visualizer/geometric/webgl/buildCoverParticleGeometry';
import {
    resolveWebGLPresetIndex,
    shouldRenderMineradioWebGL,
} from '@/components/visualizer/geometric/webgl/mineradioPresetMap';

describe('Mineradio WebGL migration', () => {
    it('maps visual presets to shader uPreset indices', () => {
        expect(resolveWebGLPresetIndex('emily')).toBe(0);
        expect(resolveWebGLPresetIndex('tunnel')).toBe(1);
        expect(resolveWebGLPresetIndex('starfield')).toBe(5);
    });

    it('enables cover WebGL when particles are enabled', () => {
        expect(shouldRenderMineradioWebGL('emily', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('starfield', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('emily', false)).toBe(false);
    });

    it('scales cover particle grid with quality resolution', () => {
        expect(coverParticleGridForResolution(2)).toBeGreaterThan(coverParticleGridForResolution(0.8));
    });
});
