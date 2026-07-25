import { describe, expect, it } from 'vitest';
import {
    ORBIT_SPHERE_BASE_RADIUS,
    resolveOrbitSphereRadius,
    resolveOrbitUniformBreath,
} from '@/utils/visualizer/coverParticleOrbitMath';
import { MINERADIO_ORBIT_SPHERE_RADIUS } from '@/components/visualizer/geometric/interactiveCamera/interactiveCameraMath';

describe('coverParticleOrbitMath', () => {
    it('stays synced with the camera-fit sphere radius constant', () => {
        expect(ORBIT_SPHERE_BASE_RADIUS).toBe(MINERADIO_ORBIT_SPHERE_RADIUS);
    });

    it('clamps uniform breath and expands with bass/beat', () => {
        expect(resolveOrbitUniformBreath({})).toBe(0);
        expect(resolveOrbitUniformBreath({ bass: 1, beat: 1, mid: 1, intensity: 1 })).toBeLessThanOrEqual(0.12);
        expect(resolveOrbitUniformBreath({ bass: 0.8, intensity: 1 })).toBeGreaterThan(
            resolveOrbitUniformBreath({ bass: 0.2, intensity: 1 }),
        );
    });

    it('returns a sphere radius above the rigid baseline when breathing', () => {
        const radius = resolveOrbitSphereRadius({ bass: 0.9, beat: 0.5, intensity: 1 });
        expect(radius).toBeGreaterThan(ORBIT_SPHERE_BASE_RADIUS);
        expect(radius).toBeLessThanOrEqual(ORBIT_SPHERE_BASE_RADIUS * 1.12);
    });
});
