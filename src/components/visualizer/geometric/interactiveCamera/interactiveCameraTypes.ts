import type { Interactive3dCameraControlMode } from '../../../../types';

// src/components/visualizer/geometric/interactiveCamera/interactiveCameraTypes.ts
// Shared camera state contracts for interactive 3D background control.

export type InteractiveCameraOrbitState = {
    theta: number;
    phi: number;
    radius: number;
    lookAtX: number;
    lookAtY: number;
    lookAtZ: number;
};

export type InteractiveCameraFreeState = {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    roll: number;
};

export type InteractiveCameraGestureState = {
    rotationX: number;
    rotationY: number;
};

export type InteractiveCameraSnapshot =
    | { mode: 'auto'; }
    | { mode: 'orbit'; orbit: InteractiveCameraOrbitState; }
    | { mode: 'wasd'; free: InteractiveCameraFreeState; }
    | { mode: 'gesture'; gesture: InteractiveCameraGestureState; };

export const DEFAULT_INTERACTIVE_CAMERA_ORBIT: InteractiveCameraOrbitState = {
    theta: 0,
    phi: 0.08,
    radius: 5.2,
    lookAtX: 0,
    lookAtY: 0,
    lookAtZ: 0,
};

export const DEFAULT_INTERACTIVE_CAMERA_FREE: InteractiveCameraFreeState = {
    x: 0,
    y: 0,
    z: 5.2,
    yaw: 0,
    pitch: 0,
    roll: 0,
};

export const DEFAULT_INTERACTIVE_CAMERA_GESTURE: InteractiveCameraGestureState = {
    rotationX: 0,
    rotationY: 0,
};

export const createInteractiveCameraSnapshot = (
    mode: Interactive3dCameraControlMode,
): InteractiveCameraSnapshot => {
    switch (mode) {
        case 'orbit':
            return {
                mode: 'orbit',
                orbit: { ...DEFAULT_INTERACTIVE_CAMERA_ORBIT },
            };
        case 'wasd':
            return {
                mode: 'wasd',
                free: { ...DEFAULT_INTERACTIVE_CAMERA_FREE },
            };
        case 'gesture':
            return {
                mode: 'gesture',
                gesture: { ...DEFAULT_INTERACTIVE_CAMERA_GESTURE },
            };
        default:
            return { mode: 'auto' };
    }
};

export const isManualInteractiveCameraMode = (
    mode: Interactive3dCameraControlMode,
): mode is Exclude<Interactive3dCameraControlMode, 'auto'> => mode !== 'auto';
