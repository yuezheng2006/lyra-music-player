import type {
    InteractiveCameraFreeState,
    InteractiveCameraGestureState,
    InteractiveCameraOrbitState,
} from './interactiveCameraTypes';
import { DEFAULT_INTERACTIVE_CAMERA_ORBIT } from './interactiveCameraTypes';

// src/components/visualizer/geometric/interactiveCamera/interactiveCameraMath.ts
// Mineradio 镜头输入 → 相机/轨道增量的纯函数，便于单测。

export const ORBIT_MIN_PHI = -Math.PI * 0.45;
export const ORBIT_MAX_PHI = Math.PI * 0.45;
export const ORBIT_MIN_RADIUS = 2.4;
export const ORBIT_MAX_RADIUS = 14;
/** Orbit fit may pull the camera farther than manual zoom so the sphere stays on-screen. */
export const ORBIT_FIT_MAX_RADIUS = 18;

/** Shader `baseR` for mineradioOrbit (uPreset 8). */
export const MINERADIO_ORBIT_SPHERE_RADIUS = 2.0;
/**
 * Fraction of the shorter frustum half-axis the sphere should fill.
 * ~0.58 leaves room for cinema drift + bass expand without cropping.
 */
export const MINERADIO_ORBIT_FIT_FILL = 0.58;

/**
 * Camera orbit radius so a sphere of `sphereRadius` fits the current viewport.
 * Three.js PerspectiveCamera FOV is vertical; portrait uses the narrower horizontal axis.
 */
export const resolveOrbitFitCameraRadius = ({
    sphereRadius = MINERADIO_ORBIT_SPHERE_RADIUS,
    fovDeg,
    aspect,
    fillFraction = MINERADIO_ORBIT_FIT_FILL,
}: {
    sphereRadius?: number;
    fovDeg: number;
    aspect: number;
    fillFraction?: number;
}): number => {
    const safeAspect = Number.isFinite(aspect) && aspect > 0.05 ? aspect : 1;
    const safeFov = Number.isFinite(fovDeg) && fovDeg > 1 ? fovDeg : 45;
    const fill = Math.min(0.92, Math.max(0.35, fillFraction));
    const halfFovTan = Math.tan((safeFov * Math.PI) / 360);
    const shortAxisTan = halfFovTan * Math.min(1, safeAspect);
    const radius = sphereRadius / Math.max(0.0001, shortAxisTan * fill);
    return clamp(radius, ORBIT_MIN_RADIUS, ORBIT_FIT_MAX_RADIUS);
};

/** 指针拖拽轨道角速度，对齐 Mineradio 自由镜头鼠标系数 0.00125 的量级。 */
export const ORBIT_DRAG_SENSITIVITY = 0.002;
/** 滚轮缩放半径，Mineradio: orbit.userRadius += deltaY * 0.005 */
export const ORBIT_WHEEL_RADIUS_STEP = 0.005;

/** Mineradio PARTICLE_POINTER_SPIN_X / Y */
export const GESTURE_DRAG_SPIN_X = 0.0032;
export const GESTURE_DRAG_SPIN_Y = 0.0034;

/** Mineradio 自由镜头鼠标灵敏度 */
export const FREE_CAMERA_MOUSE_SENSITIVITY = 0.00125;
export const FREE_CAMERA_MOVE_SPEED = 2.35;
export const FREE_CAMERA_SPRINT_SPEED = 6.2;
export const FREE_CAMERA_ROLL_SPEED = 0.9;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const applyOrbitDragDelta = (
    orbit: Pick<InteractiveCameraOrbitState, 'theta' | 'phi'>,
    dx: number,
    dy: number,
    sensitivity = ORBIT_DRAG_SENSITIVITY,
): Pick<InteractiveCameraOrbitState, 'theta' | 'phi'> => ({
    theta: orbit.theta - dx * sensitivity,
    phi: clamp(orbit.phi - dy * sensitivity, ORBIT_MIN_PHI, ORBIT_MAX_PHI),
});

export const applyOrbitWheelDelta = (
    radius: number,
    deltaY: number,
    step = ORBIT_WHEEL_RADIUS_STEP,
): number => clamp(
    radius + deltaY * step,
    ORBIT_MIN_RADIUS,
    ORBIT_MAX_RADIUS,
);

export const applyGestureDragDelta = (
    gesture: InteractiveCameraGestureState,
    dx: number,
    dy: number,
): InteractiveCameraGestureState => ({
    rotationX: gesture.rotationX + dy * GESTURE_DRAG_SPIN_X,
    rotationY: gesture.rotationY + dx * GESTURE_DRAG_SPIN_Y,
});

export const applyFreeCameraMouseDelta = (
    free: Pick<InteractiveCameraFreeState, 'yaw' | 'pitch'>,
    dx: number,
    dy: number,
    sensitivity = FREE_CAMERA_MOUSE_SENSITIVITY,
): Pick<InteractiveCameraFreeState, 'yaw' | 'pitch'> => ({
    yaw: free.yaw - dx * sensitivity,
    pitch: clamp(free.pitch - dy * sensitivity, -Math.PI * 0.49, Math.PI * 0.49),
});

export type WasdKeyState = {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    sprint: boolean;
    rollLeft: boolean;
    rollRight: boolean;
};

/** 根据 WASD 输入计算目标速度向量（世界空间），对齐 Mineradio updateFreeCamera。 */
export const computeWasdTargetVelocity = (
    free: Pick<InteractiveCameraFreeState, 'yaw' | 'pitch'>,
    keys: WasdKeyState,
): { vx: number; vy: number; vz: number; rollDelta: number; } => {
    let moveX = 0;
    let moveY = 0;
    let moveZ = 0;

    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;
    if (keys.up) moveY += 1;
    if (keys.down) moveY -= 1;

    const lengthSq = moveX * moveX + moveY * moveY + moveZ * moveZ;
    let vx = 0;
    let vy = 0;
    let vz = 0;

    if (lengthSq > 0) {
        const invLen = 1 / Math.sqrt(lengthSq);
        moveX *= invLen;
        moveY *= invLen;
        moveZ *= invLen;

        const cosPitch = Math.cos(free.pitch);
        const sinPitch = Math.sin(free.pitch);
        const cosYaw = Math.cos(free.yaw);
        const sinYaw = Math.sin(free.yaw);

        // YXZ 欧拉：先把本地 Z 前后、X 左右映射到世界坐标
        const localX = moveX;
        const localY = moveY;
        const localZ = moveZ;
        const worldX = localX * cosYaw + localZ * sinYaw;
        const worldY = localY * cosPitch + (localX * -sinYaw + localZ * cosYaw) * sinPitch;
        const worldZ = localY * -sinPitch + (localX * -sinYaw + localZ * cosYaw) * cosPitch;

        const speed = keys.sprint ? FREE_CAMERA_SPRINT_SPEED : FREE_CAMERA_MOVE_SPEED;
        vx = worldX * speed;
        vy = worldY * speed;
        vz = worldZ * speed;
    }

    const rollDir = (keys.rollLeft ? 1 : 0) - (keys.rollRight ? 1 : 0);
    return {
        vx,
        vy,
        vz,
        rollDelta: rollDir * FREE_CAMERA_ROLL_SPEED,
    };
};

export const integrateFreeCameraMotion = (
    free: InteractiveCameraFreeState,
    velocity: { vx: number; vy: number; vz: number; },
    rollDelta: number,
    dt: number,
): InteractiveCameraFreeState => ({
    ...free,
    x: free.x + velocity.vx * dt,
    y: free.y + velocity.vy * dt,
    z: free.z + velocity.vz * dt,
    roll: clamp(free.roll + rollDelta * dt, -Math.PI, Math.PI),
});

export const orbitToCameraPosition = (
    orbit: InteractiveCameraOrbitState = DEFAULT_INTERACTIVE_CAMERA_ORBIT,
): { x: number; y: number; z: number; } => {
    const cosPhi = Math.cos(orbit.phi);
    const sinPhi = Math.sin(orbit.phi);
    const cosTheta = Math.cos(orbit.theta);
    const sinTheta = Math.sin(orbit.theta);

    return {
        x: orbit.lookAtX + orbit.radius * cosPhi * sinTheta,
        y: orbit.lookAtY + orbit.radius * sinPhi,
        z: orbit.lookAtZ + orbit.radius * cosPhi * cosTheta,
    };
};

export const orbitToDomRotationDegrees = (
    orbit: Pick<InteractiveCameraOrbitState, 'theta' | 'phi'>,
): { rotateX: number; rotateY: number; } => ({
    rotateX: orbit.phi * (180 / Math.PI),
    rotateY: orbit.theta * (180 / Math.PI),
});

export const freeCameraToDomRotationDegrees = (
    free: Pick<InteractiveCameraFreeState, 'yaw' | 'pitch'>,
): { rotateX: number; rotateY: number; } => ({
    rotateX: free.pitch * (180 / Math.PI),
    rotateY: free.yaw * (180 / Math.PI),
});

export const gestureToDomRotationDegrees = (
    gesture: InteractiveCameraGestureState,
): { rotateX: number; rotateY: number; } => ({
    rotateX: gesture.rotationX * (180 / Math.PI),
    rotateY: gesture.rotationY * (180 / Math.PI),
});
