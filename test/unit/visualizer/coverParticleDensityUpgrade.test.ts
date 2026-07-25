import { describe, expect, it } from 'vitest';
import {
    coverParticleGridForQualityTier,
    coverParticleGridForResolution,
} from '@/components/visualizer/geometric/webgl/buildCoverParticleGeometry';
import { CoverParticleBurstSmoother } from '@/components/visualizer/geometric/webgl/coverParticleBurstSmoother';
import { CoverParticleCinemaCamera } from '@/components/visualizer/geometric/webgl/coverParticleCinemaCamera';
import { resolveCoverParticlePresetRuntime } from '@/components/visualizer/geometric/webgl/coverParticlePresetRuntime';

describe('cover particle density upgrade', () => {
    it('uses performance-first grids under the Mineradio curve', () => {
        expect(coverParticleGridForResolution(1.55)).toBe(183);
        expect(coverParticleGridForResolution(1.35)).toBe(159);
        expect(coverParticleGridForResolution(1.0)).toBe(119);
        expect(coverParticleGridForResolution(0.55)).toBe(65);
        // High = Mineradio 183²; balanced ≈119² (Electron ceiling); lite ≈89².
        expect(coverParticleGridForQualityTier('high')).toBe(183);
        expect(coverParticleGridForQualityTier('balanced')).toBe(119);
        expect(coverParticleGridForQualityTier('lite')).toBe(89);
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

    it('keeps active tunnel motion punch stronger than cover', () => {
        const cover = resolveCoverParticlePresetRuntime('emily');
        const tunnel = resolveCoverParticlePresetRuntime('mineradioTunnel');
        expect(cover.cameraZ).toBe(6.2);
        expect(cover.fov).toBe(45);
        expect(cover.pointScale).toBeCloseTo(1.14);
        expect(tunnel.bassCameraPunch).toBeGreaterThan(cover.bassCameraPunch);
    });

    it('keeps Mineradio original presets near source camera defaults', () => {
        const tunnel = resolveCoverParticlePresetRuntime('mineradioTunnel');
        const orbit = resolveCoverParticlePresetRuntime('mineradioOrbit');
        const galaxy = resolveCoverParticlePresetRuntime('mineradioGalaxy');

        expect(tunnel.speedMul).toBeCloseTo(1.06);
        expect(tunnel.fov).toBe(48);
        expect(orbit.speedMul).toBe(1);
        expect(orbit.fov).toBe(45);
        expect(orbit.bassCameraPunch).toBeGreaterThan(0.1);
        expect(galaxy.speedMul).toBeCloseTo(1.04);
        expect(galaxy.fov).toBe(48);
        expect(galaxy.bassCameraPunch).toBeGreaterThan(0.16);
    });

    it('maps the retired vinyl preset to the cover runtime profile', () => {
        const vinyl = resolveCoverParticlePresetRuntime('mineradioVinyl');
        const emily = resolveCoverParticlePresetRuntime('emily');

        expect(vinyl).toEqual(emily);
    });
});
