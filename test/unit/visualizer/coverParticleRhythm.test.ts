import { describe, expect, it } from 'vitest';
import { CoverParticleBurstSmoother } from '@/components/visualizer/geometric/webgl/coverParticleBurstSmoother';
import { resolveCoverParticlePresetRuntime } from '@/components/visualizer/geometric/webgl/coverParticlePresetRuntime';

describe('coverParticleBurstSmoother', () => {
    it('spikes on beat rises and decays over frames', () => {
        const smoother = new CoverParticleBurstSmoother();
        let burst = 0;

        burst = smoother.tick(0.02, 0.016);
        expect(burst).toBeLessThan(0.05);

        burst = smoother.tick(0.72, 0.016);
        expect(burst).toBeGreaterThan(0.2);

        for (let i = 0; i < 20; i += 1) {
            burst = smoother.tick(0.72, 0.016);
        }
        expect(burst).toBeLessThan(0.25);
    });
});

describe('coverParticlePresetRuntime', () => {
    it('normalizes removed presets before resolving runtime profiles', () => {
        const emily = resolveCoverParticlePresetRuntime('emily');
        const tunnel = resolveCoverParticlePresetRuntime('tunnel');
        const terrain = resolveCoverParticlePresetRuntime('terrain');
        const aurora = resolveCoverParticlePresetRuntime('aurora');
        const voidPreset = resolveCoverParticlePresetRuntime('mineradioVoid');

        expect(tunnel).toEqual(emily);
        expect(terrain).toEqual(emily);
        expect(aurora).toEqual(emily);
        expect(voidPreset).toEqual(emily);
    });

    it('maps retired box aliases to the cover profile', () => {
        const emily = resolveCoverParticlePresetRuntime('emily');
        expect(resolveCoverParticlePresetRuntime('quantumCube')).toEqual(emily);
        expect(resolveCoverParticlePresetRuntime('starfield')).toEqual(emily);
        expect(resolveCoverParticlePresetRuntime('vinyl')).toEqual(emily);
    });
});
