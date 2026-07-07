import { describe, expect, it } from 'vitest';
import {
    coverParticleGridForQualityTier,
    coverParticleGridForResolution,
} from '@/components/visualizer/geometric/webgl/buildCoverParticleGeometry';
import { CoverParticleBurstSmoother } from '@/components/visualizer/geometric/webgl/coverParticleBurstSmoother';
import { CoverParticleCinemaCamera } from '@/components/visualizer/geometric/webgl/coverParticleCinemaCamera';
import { resolveCoverParticlePresetRuntime } from '@/components/visualizer/geometric/webgl/coverParticlePresetRuntime';

describe('cover particle density upgrade', () => {
    it('matches Mineradio grid curve up to 183x183', () => {
        expect(coverParticleGridForResolution(1.55)).toBe(183);
        expect(coverParticleGridForResolution(1.0)).toBe(119);
        expect(coverParticleGridForQualityTier('high')).toBe(183);
        expect(coverParticleGridForQualityTier('lite')).toBeGreaterThan(80);
    });

    it('supports preset burst trigger and cinema drift', () => {
        const burst = new CoverParticleBurstSmoother();
        burst.trigger(0.2);
        expect(burst.tick(0, 0.016)).toBeGreaterThan(0.15);

        const cinema = new CoverParticleCinemaCamera();
        const offset = cinema.tick(0.016, 0.8, 0.6, 0.5);
        expect(
            Math.abs(offset.thetaKick) + Math.abs(offset.phiKick) + Math.abs(offset.radiusKick),
        ).toBeGreaterThan(0);
    });

    it('keeps tunnel/starfield motion profiles stronger than cover', () => {
        const tunnel = resolveCoverParticlePresetRuntime('tunnel');
        const starfield = resolveCoverParticlePresetRuntime('starfield');
        expect(tunnel.bassCameraPunch).toBeGreaterThan(starfield.bassCameraPunch);
    });
});
