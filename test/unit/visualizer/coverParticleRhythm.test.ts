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
    it('gives tunnel and starfield stronger motion profiles than cover', () => {
        const emily = resolveCoverParticlePresetRuntime('emily');
        const tunnel = resolveCoverParticlePresetRuntime('tunnel');
        const starfield = resolveCoverParticlePresetRuntime('starfield');

        expect(tunnel.speedMul).toBeGreaterThan(emily.speedMul);
        expect(starfield.speedMul).toBeGreaterThan(emily.speedMul);
        expect(tunnel.bassCameraPunch).toBeGreaterThan(starfield.bassCameraPunch);
        expect(tunnel.fov).toBeGreaterThan(emily.fov);
    });
});
