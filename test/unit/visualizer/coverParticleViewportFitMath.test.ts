import { describe, expect, it } from 'vitest';
import {
    COVER_PARTICLE_FIT_CONTENT_RADIUS,
    resolveCoverParticleFitCameraRadius,
} from '@/components/visualizer/geometric/webgl/coverParticleViewportFitMath';
import {
    MINERADIO_ORBIT_SPHERE_RADIUS,
    resolveOrbitFitCameraRadius,
} from '@/components/visualizer/geometric/interactiveCamera/interactiveCameraMath';

describe('coverParticleViewportFitMath', () => {
    it('only fits the planet preset; other styles keep fixed baselines', () => {
        expect(COVER_PARTICLE_FIT_CONTENT_RADIUS.mineradioOrbit).toBe(MINERADIO_ORBIT_SPHERE_RADIUS);
        expect(resolveCoverParticleFitCameraRadius({
            preset: 'emily',
            fovDeg: 45,
            aspect: 16 / 9,
        })).toBeNull();
        expect(resolveCoverParticleFitCameraRadius({
            preset: 'mineradioGalaxy',
            fovDeg: 48,
            aspect: 16 / 9,
        })).toBeNull();
    });

    it('pulls the planet camera farther on portrait so the sphere is not cropped', () => {
        const wide = resolveCoverParticleFitCameraRadius({
            preset: 'mineradioOrbit',
            fovDeg: 45,
            aspect: 16 / 9,
        });
        const tall = resolveCoverParticleFitCameraRadius({
            preset: 'mineradioOrbit',
            fovDeg: 45,
            aspect: 9 / 16,
        });
        expect(wide).not.toBeNull();
        expect(tall).not.toBeNull();
        expect(tall!).toBeGreaterThan(wide!);
        expect(wide!).toBeCloseTo(
            resolveOrbitFitCameraRadius({
                sphereRadius: MINERADIO_ORBIT_SPHERE_RADIUS,
                fovDeg: 45,
                aspect: 16 / 9,
            }),
            5,
        );
    });
});
