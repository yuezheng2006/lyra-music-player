import { describe, expect, it } from 'vitest';
import { coverParticleGridForResolution } from '@/components/visualizer/geometric/webgl/buildCoverParticleGeometry';
import {
    resolveWebGLPresetIndex,
    shouldRenderMineradioWebGL,
} from '@/components/visualizer/geometric/webgl/mineradioPresetMap';

describe('Mineradio WebGL migration', () => {
    it('maps visual presets to shader uPreset indices', () => {
        expect(resolveWebGLPresetIndex('emily')).toBe(0);
        expect(resolveWebGLPresetIndex('starfield')).toBe(4);
        expect(resolveWebGLPresetIndex('nebula')).toBe(11);
        expect(resolveWebGLPresetIndex('terrain')).toBe(0);
        expect(resolveWebGLPresetIndex('quantumCube')).toBe(4);
        expect(resolveWebGLPresetIndex('tunnel')).toBe(0);
        expect(resolveWebGLPresetIndex('aurora')).toBe(0);
        expect(resolveWebGLPresetIndex('mineradioTunnel')).toBe(7);
        expect(resolveWebGLPresetIndex('mineradioOrbit')).toBe(8);
        expect(resolveWebGLPresetIndex('mineradioVoid')).toBe(0);
        expect(resolveWebGLPresetIndex('mineradioVinyl')).toBe(10);
        expect(resolveWebGLPresetIndex('mineradioGalaxy')).toBe(11);
    });

    it('enables cover WebGL when particles are enabled', () => {
        expect(shouldRenderMineradioWebGL('emily', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('starfield', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('nebula', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('quantumCube', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('mineradioTunnel', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('mineradioGalaxy', true)).toBe(true);
        expect(shouldRenderMineradioWebGL('emily', false)).toBe(false);
    });

    it('scales cover particle grid with quality resolution', () => {
        expect(coverParticleGridForResolution(2)).toBeGreaterThan(coverParticleGridForResolution(0.8));
    });
});
