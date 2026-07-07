import { useEffect, useMemo, useRef } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';
import type { Interactive3dCameraControlMode } from '../../../types';
import {
    applyFreeCameraMouseDelta,
    applyGestureDragDelta,
    applyOrbitDragDelta,
    applyOrbitWheelDelta,
    computeWasdTargetVelocity,
    freeCameraToDomRotationDegrees,
    gestureToDomRotationDegrees,
    integrateFreeCameraMotion,
    orbitToDomRotationDegrees,
    type WasdKeyState,
} from './interactiveCamera/interactiveCameraMath';
import {
    createInteractiveCameraSnapshot,
    DEFAULT_INTERACTIVE_CAMERA_FREE,
    DEFAULT_INTERACTIVE_CAMERA_GESTURE,
    DEFAULT_INTERACTIVE_CAMERA_ORBIT,
    isManualInteractiveCameraMode,
    type InteractiveCameraSnapshot,
} from './interactiveCamera/interactiveCameraTypes';

// src/components/visualizer/geometric/useInteractiveCameraControl.ts
// 交互 3D 背景镜头：轨道拖拽、WASD 自由镜头、手势式粒子旋转。

export type InteractiveCameraControlOptions = {
    mode: Interactive3dCameraControlMode;
    paused?: boolean;
    staticMode?: boolean;
    captureRef: React.RefObject<HTMLElement | null>;
};

export type InteractiveCameraControlValue = {
    snapshotRef: React.RefObject<InteractiveCameraSnapshot>;
    userRotateX: MotionValue<number>;
    userRotateY: MotionValue<number>;
    suppressPointerTilt: boolean;
    isInteractive: boolean;
};

const KEY_TO_WASD: Record<string, keyof WasdKeyState> = {
    KeyW: 'forward',
    KeyS: 'backward',
    KeyA: 'left',
    KeyD: 'right',
    Space: 'up',
    ControlLeft: 'down',
    ControlRight: 'down',
    ShiftLeft: 'sprint',
    ShiftRight: 'sprint',
    KeyQ: 'rollLeft',
    KeyE: 'rollRight',
};

const createWasdKeyState = (): WasdKeyState => ({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    rollLeft: false,
    rollRight: false,
});

const syncDomRotation = (
    snapshot: InteractiveCameraSnapshot,
    userRotateX: MotionValue<number>,
    userRotateY: MotionValue<number>,
) => {
    if (snapshot.mode === 'orbit') {
        const rotation = orbitToDomRotationDegrees(snapshot.orbit);
        userRotateX.set(rotation.rotateX);
        userRotateY.set(rotation.rotateY);
        return;
    }
    if (snapshot.mode === 'wasd') {
        const rotation = freeCameraToDomRotationDegrees(snapshot.free);
        userRotateX.set(rotation.rotateX);
        userRotateY.set(rotation.rotateY);
        return;
    }
    if (snapshot.mode === 'gesture') {
        const rotation = gestureToDomRotationDegrees(snapshot.gesture);
        userRotateX.set(rotation.rotateX);
        userRotateY.set(rotation.rotateY);
        return;
    }
    userRotateX.set(0);
    userRotateY.set(0);
};

export const useInteractiveCameraControl = ({
    mode,
    paused = false,
    staticMode = false,
    captureRef,
}: InteractiveCameraControlOptions): InteractiveCameraControlValue => {
    const userRotateX = useMotionValue(0);
    const userRotateY = useMotionValue(0);
    const snapshotRef = useRef<InteractiveCameraSnapshot>(createInteractiveCameraSnapshot(mode));
    const orbitRef = useRef({ ...DEFAULT_INTERACTIVE_CAMERA_ORBIT });
    const freeRef = useRef({ ...DEFAULT_INTERACTIVE_CAMERA_FREE });
    const gestureRef = useRef({ ...DEFAULT_INTERACTIVE_CAMERA_GESTURE });
    const velocityRef = useRef({ vx: 0, vy: 0, vz: 0 });
    const keysRef = useRef(createWasdKeyState());
    const draggingRef = useRef(false);
    const lastPointerRef = useRef({ x: 0, y: 0 });

    const isInteractive = isManualInteractiveCameraMode(mode) && !paused && !staticMode;
    const suppressPointerTilt = isInteractive;

    useEffect(() => {
        snapshotRef.current = createInteractiveCameraSnapshot(mode);
        orbitRef.current = { ...DEFAULT_INTERACTIVE_CAMERA_ORBIT };
        freeRef.current = { ...DEFAULT_INTERACTIVE_CAMERA_FREE };
        gestureRef.current = { ...DEFAULT_INTERACTIVE_CAMERA_GESTURE };
        velocityRef.current = { vx: 0, vy: 0, vz: 0 };
        syncDomRotation(snapshotRef.current, userRotateX, userRotateY);
    }, [mode, userRotateX, userRotateY]);

    useEffect(() => {
        if (!isInteractive) {
            draggingRef.current = false;
            keysRef.current = createWasdKeyState();
            snapshotRef.current = createInteractiveCameraSnapshot('auto');
            syncDomRotation(snapshotRef.current, userRotateX, userRotateY);
            return undefined;
        }

        snapshotRef.current = createInteractiveCameraSnapshot(mode);
        syncDomRotation(snapshotRef.current, userRotateX, userRotateY);

        const handleKeyDown = (event: KeyboardEvent) => {
            const mapped = KEY_TO_WASD[event.code];
            if (!mapped) return;
            event.preventDefault();
            keysRef.current[mapped] = true;
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const mapped = KEY_TO_WASD[event.code];
            if (!mapped) return;
            keysRef.current[mapped] = false;
        };

        if (mode === 'wasd') {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isInteractive, mode, userRotateX, userRotateY]);

    useEffect(() => {
        if (!isInteractive) return undefined;

        const element = captureRef.current;
        if (!element) return undefined;

        const beginDrag = (clientX: number, clientY: number) => {
            draggingRef.current = true;
            lastPointerRef.current = { x: clientX, y: clientY };
        };

        const applyDrag = (clientX: number, clientY: number) => {
            if (!draggingRef.current) return;
            const dx = clientX - lastPointerRef.current.x;
            const dy = clientY - lastPointerRef.current.y;
            lastPointerRef.current = { x: clientX, y: clientY };

            if (mode === 'orbit') {
                const next = applyOrbitDragDelta(orbitRef.current, dx, dy);
                orbitRef.current = { ...orbitRef.current, ...next };
                snapshotRef.current = { mode: 'orbit', orbit: { ...orbitRef.current } };
            } else if (mode === 'gesture') {
                gestureRef.current = applyGestureDragDelta(gestureRef.current, dx, dy);
                snapshotRef.current = { mode: 'gesture', gesture: { ...gestureRef.current } };
            } else if (mode === 'wasd') {
                const next = applyFreeCameraMouseDelta(freeRef.current, dx, dy);
                freeRef.current = { ...freeRef.current, ...next };
                snapshotRef.current = { mode: 'wasd', free: { ...freeRef.current } };
            }
            syncDomRotation(snapshotRef.current, userRotateX, userRotateY);
        };

        const endDrag = () => {
            draggingRef.current = false;
        };

        const onPointerDown = (event: PointerEvent) => {
            if (event.button !== 0) return;
            element.setPointerCapture(event.pointerId);
            beginDrag(event.clientX, event.clientY);
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!draggingRef.current) return;
            applyDrag(event.clientX, event.clientY);
        };

        const onPointerUp = (event: PointerEvent) => {
            if (element.hasPointerCapture(event.pointerId)) {
                element.releasePointerCapture(event.pointerId);
            }
            endDrag();
        };

        const onWheel = (event: WheelEvent) => {
            if (mode !== 'orbit') return;
            event.preventDefault();
            orbitRef.current = {
                ...orbitRef.current,
                radius: applyOrbitWheelDelta(orbitRef.current.radius, event.deltaY),
            };
            snapshotRef.current = { mode: 'orbit', orbit: { ...orbitRef.current } };
            syncDomRotation(snapshotRef.current, userRotateX, userRotateY);
        };

        element.addEventListener('pointerdown', onPointerDown);
        element.addEventListener('pointermove', onPointerMove);
        element.addEventListener('pointerup', onPointerUp);
        element.addEventListener('pointercancel', endDrag);
        element.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            element.removeEventListener('pointerdown', onPointerDown);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', onPointerUp);
            element.removeEventListener('pointercancel', endDrag);
            element.removeEventListener('wheel', onWheel);
        };
    }, [captureRef, isInteractive, mode, userRotateX, userRotateY]);

    useEffect(() => {
        if (!isInteractive || mode !== 'wasd') return undefined;

        let rafId = 0;
        let lastTime = performance.now();

        const tick = (now: number) => {
            const dt = Math.max(1 / 120, Math.min(0.05, (now - lastTime) / 1000));
            lastTime = now;

            const target = computeWasdTargetVelocity(freeRef.current, keysRef.current);
            const ease = target.vx || target.vy || target.vz ? 8.2 : 13.5;
            velocityRef.current = {
                vx: velocityRef.current.vx + (target.vx - velocityRef.current.vx) * Math.min(1, ease * dt),
                vy: velocityRef.current.vy + (target.vy - velocityRef.current.vy) * Math.min(1, ease * dt),
                vz: velocityRef.current.vz + (target.vz - velocityRef.current.vz) * Math.min(1, ease * dt),
            };

            freeRef.current = integrateFreeCameraMotion(
                freeRef.current,
                velocityRef.current,
                target.rollDelta,
                dt,
            );
            snapshotRef.current = { mode: 'wasd', free: { ...freeRef.current } };
            syncDomRotation(snapshotRef.current, userRotateX, userRotateY);
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isInteractive, mode, userRotateX, userRotateY]);

    return useMemo(() => ({
        snapshotRef,
        userRotateX,
        userRotateY,
        suppressPointerTilt,
        isInteractive,
    }), [isInteractive, suppressPointerTilt, userRotateX, userRotateY]);
};
