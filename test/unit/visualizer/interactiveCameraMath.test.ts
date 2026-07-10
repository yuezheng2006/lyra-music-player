import { describe, expect, it } from 'vitest';
import {
    applyFreeCameraMouseDelta,
    applyGestureDragDelta,
    applyOrbitDragDelta,
    applyOrbitWheelDelta,
    computeWasdTargetVelocity,
    FREE_CAMERA_MOVE_SPEED,
    FREE_CAMERA_SPRINT_SPEED,
    GESTURE_DRAG_SPIN_X,
    GESTURE_DRAG_SPIN_Y,
    integrateFreeCameraMotion,
    MINERADIO_ORBIT_FIT_FILL,
    MINERADIO_ORBIT_SPHERE_RADIUS,
    ORBIT_DRAG_SENSITIVITY,
    ORBIT_FIT_MAX_RADIUS,
    ORBIT_MAX_PHI,
    ORBIT_MAX_RADIUS,
    ORBIT_MIN_PHI,
    ORBIT_MIN_RADIUS,
    ORBIT_WHEEL_RADIUS_STEP,
    orbitToCameraPosition,
    resolveOrbitFitCameraRadius,
} from '@/components/visualizer/geometric/interactiveCamera/interactiveCameraMath';
import { DEFAULT_INTERACTIVE_CAMERA_ORBIT } from '@/components/visualizer/geometric/interactiveCamera/interactiveCameraTypes';

describe('interactive camera math', () => {
    it('maps pointer drag to orbit theta/phi deltas', () => {
        const next = applyOrbitDragDelta({ theta: 0.1, phi: 0.08 }, 120, -40);
        expect(next.theta).toBeCloseTo(0.1 - 120 * ORBIT_DRAG_SENSITIVITY, 6);
        expect(next.phi).toBeCloseTo(0.08 + 40 * ORBIT_DRAG_SENSITIVITY, 6);
    });

    it('clamps orbit phi and wheel radius to Mineradio bounds', () => {
        const lowPhi = applyOrbitDragDelta({ theta: 0, phi: ORBIT_MIN_PHI }, 0, 10_000);
        const highPhi = applyOrbitDragDelta({ theta: 0, phi: ORBIT_MAX_PHI }, 0, -10_000);
        expect(lowPhi.phi).toBe(ORBIT_MIN_PHI);
        expect(highPhi.phi).toBe(ORBIT_MAX_PHI);
        expect(applyOrbitWheelDelta(ORBIT_MAX_RADIUS, 10_000)).toBe(ORBIT_MAX_RADIUS);
        expect(applyOrbitWheelDelta(ORBIT_MIN_RADIUS, -10_000)).toBe(ORBIT_MIN_RADIUS);
        expect(applyOrbitWheelDelta(5.2, 100)).toBeCloseTo(5.2 + 100 * ORBIT_WHEEL_RADIUS_STEP, 6);
    });

    it('maps gesture drag using Mineradio spin constants', () => {
        const next = applyGestureDragDelta({ rotationX: 0, rotationY: 0.2 }, 50, -30);
        expect(next.rotationX).toBeCloseTo(-30 * GESTURE_DRAG_SPIN_X, 8);
        expect(next.rotationY).toBeCloseTo(0.2 + 50 * GESTURE_DRAG_SPIN_Y, 8);
    });

    it('maps free-camera mouse look with pitch clamp', () => {
        const next = applyFreeCameraMouseDelta({ yaw: 0.4, pitch: 1.4 }, 80, 200);
        expect(next.yaw).toBeCloseTo(0.4 - 80 * 0.00125, 6);
        expect(next.pitch).toBeLessThan(1.4);
        expect(next.pitch).toBeGreaterThan(-Math.PI * 0.49);
    });

    it('computes WASD velocity in camera-facing space and integrates motion', () => {
        const target = computeWasdTargetVelocity(
            { yaw: 0, pitch: 0 },
            {
                forward: true,
                backward: false,
                left: false,
                right: true,
                up: false,
                down: false,
                sprint: true,
                rollLeft: false,
                rollRight: true,
            },
        );
        expect(target.vx).toBeGreaterThan(0);
        expect(target.vz).toBeLessThan(0);
        expect(Math.hypot(target.vx, target.vy, target.vz)).toBeCloseTo(FREE_CAMERA_SPRINT_SPEED, 4);

        const walkTarget = computeWasdTargetVelocity(
            { yaw: 0, pitch: 0 },
            {
                forward: true,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false,
                sprint: false,
                rollLeft: false,
                rollRight: false,
            },
        );
        expect(Math.abs(walkTarget.vz)).toBeCloseTo(FREE_CAMERA_MOVE_SPEED, 4);

        const integrated = integrateFreeCameraMotion(
            { x: 0, y: 0, z: 5.2, yaw: 0, pitch: 0, roll: 0 },
            { vx: 1, vy: 0.5, vz: -0.25 },
            1,
            0.5,
        );
        expect(integrated.x).toBeCloseTo(0.5, 6);
        expect(integrated.y).toBeCloseTo(0.25, 6);
        expect(integrated.z).toBeCloseTo(5.075, 6);
        expect(integrated.roll).toBeCloseTo(0.5, 6);
    });

    it('projects orbit spherical coords to camera position', () => {
        const position = orbitToCameraPosition({
            ...DEFAULT_INTERACTIVE_CAMERA_ORBIT,
            theta: 0,
            phi: 0,
            radius: 5,
        });
        expect(position.x).toBeCloseTo(0, 6);
        expect(position.y).toBeCloseTo(0, 6);
        expect(position.z).toBeCloseTo(5, 6);
    });

    it('fits planet camera radius to the shorter viewport axis', () => {
        const landscape = resolveOrbitFitCameraRadius({ fovDeg: 45, aspect: 16 / 9 });
        const square = resolveOrbitFitCameraRadius({ fovDeg: 45, aspect: 1 });
        const portrait = resolveOrbitFitCameraRadius({ fovDeg: 45, aspect: 0.6 });

        expect(landscape).toBeGreaterThan(7.5);
        expect(square).toBeCloseTo(landscape, 5);
        expect(portrait).toBeGreaterThan(landscape);
        expect(portrait).toBeLessThanOrEqual(ORBIT_FIT_MAX_RADIUS);

        // Sphere should occupy ~fill of the short half-axis, not nearly fill the frame.
        const halfFovTan = Math.tan((45 * Math.PI) / 360);
        const fill = MINERADIO_ORBIT_SPHERE_RADIUS / (landscape * halfFovTan);
        expect(fill).toBeCloseTo(MINERADIO_ORBIT_FIT_FILL, 5);
    });
});
