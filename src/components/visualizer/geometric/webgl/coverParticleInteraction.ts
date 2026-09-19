import * as THREE from 'three';

// src/components/visualizer/geometric/webgl/coverParticleInteraction.ts
// Pointer / wheel interaction for cover particle stage (shared WebGL shell).

const UI_HIT_SELECTOR = [
    'button',
    'a',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    '[role="menu"]',
    '[data-radix-popper-content-wrapper]',
    '[data-testid="floating-player-background-menu"]',
    '[data-testid="floating-player-controls"]',
    '[data-testid="player-controls"]',
    '[data-testid="unified-panel"]',
    '[data-testid="interactive3d-camera-capture"]',
    '[data-app-ui-surface]',
].join(',');

export interface CoverParticleInteractionState {
    interactionDragging: boolean;
    lastInteractionPointer: { x: number; y: number; t: number };
    userOrbitOffset: { theta: number; phi: number; radius: number };
    particleSpinVelocity: { x: number; y: number };
    particleRotation: THREE.Euler;
    interactivePointer: { x: number; y: number; active: boolean };
    pointerRaycaster: THREE.Raycaster;
    pointerNdc: THREE.Vector2;
    pointerPlane: THREE.Plane;
    pointerPlanePoint: THREE.Vector3;
    pointerPlaneNormal: THREE.Vector3;
    pointerWorldHit: THREE.Vector3;
    pointerLocalHit: THREE.Vector3;
    pointerQuaternion: THREE.Quaternion;
}

export interface CoverParticleInteractionHost {
    container: HTMLElement;
    camera: THREE.PerspectiveCamera;
    getCoverPoints: () => THREE.Points | null;
    rendererDomElement: HTMLElement | null;
    state: CoverParticleInteractionState;
}

const isEventInsideContainer = (container: HTMLElement, event: MouseEvent | PointerEvent | WheelEvent) => {
    const rect = container.getBoundingClientRect();
    return event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom;
};

const isPointerOverUi = (
    host: CoverParticleInteractionHost,
    event: MouseEvent | PointerEvent | WheelEvent,
) => {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || element === host.rendererDomElement || element === host.container) return false;
    return Boolean(element.closest(UI_HIT_SELECTOR));
};

const updateInteractivePointerFromClient = (
    host: CoverParticleInteractionHost,
    clientX: number,
    clientY: number,
) => {
    const { container, camera, state } = host;
    const coverPoints = host.getCoverPoints();
    const rect = container.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
    state.pointerNdc.set(ndcX, ndcY);
    state.pointerRaycaster.setFromCamera(state.pointerNdc, camera);

    if (coverPoints) {
        coverPoints.updateMatrixWorld(true);
        coverPoints.getWorldPosition(state.pointerPlanePoint);
        coverPoints.getWorldQuaternion(state.pointerQuaternion);
        state.pointerPlaneNormal.set(0, 0, 1).applyQuaternion(state.pointerQuaternion).normalize();
        if (Math.abs(state.pointerPlaneNormal.dot(state.pointerRaycaster.ray.direction)) >= 0.16) {
            state.pointerPlane.setFromNormalAndCoplanarPoint(
                state.pointerPlaneNormal,
                state.pointerPlanePoint,
            );
            if (state.pointerRaycaster.ray.intersectPlane(state.pointerPlane, state.pointerWorldHit)) {
                state.pointerLocalHit.copy(state.pointerWorldHit);
                coverPoints.worldToLocal(state.pointerLocalHit);
                if (
                    Number.isFinite(state.pointerLocalHit.x)
                    && Number.isFinite(state.pointerLocalHit.y)
                    && Math.abs(state.pointerLocalHit.x) < 8.5
                    && Math.abs(state.pointerLocalHit.y) < 8.5
                ) {
                    state.interactivePointer.x = state.pointerLocalHit.x;
                    state.interactivePointer.y = state.pointerLocalHit.y;
                    state.interactivePointer.active = true;
                    return;
                }
            }
        }
    }

    state.interactivePointer.x = -999;
    state.interactivePointer.y = -999;
    state.interactivePointer.active = false;
};

/** Install pointer/wheel listeners; returns disposer. */
export const installCoverParticleInteractionListeners = (
    host: CoverParticleInteractionHost,
): (() => void) => {
    const { container, state } = host;

    const beginDrag = (event: PointerEvent) => {
        if (event.button !== 0 || !isEventInsideContainer(container, event) || isPointerOverUi(host, event)) {
            return;
        }
        state.interactionDragging = true;
        container.setAttribute('data-interaction-dragging', 'true');
        container.setAttribute('data-interaction-last', 'drag-start');
        state.lastInteractionPointer.x = event.clientX;
        state.lastInteractionPointer.y = event.clientY;
        state.lastInteractionPointer.t = performance.now();
        state.particleSpinVelocity.x = 0;
        state.particleSpinVelocity.y = 0;
        updateInteractivePointerFromClient(host, event.clientX, event.clientY);
        if (event.target === container || event.target === host.rendererDomElement) {
            container.setPointerCapture?.(event.pointerId);
        }
    };

    const movePointer = (event: PointerEvent) => {
        if (!isEventInsideContainer(container, event)) {
            if (!state.interactionDragging) state.interactivePointer.active = false;
            return;
        }
        if (isPointerOverUi(host, event) && !state.interactionDragging) {
            state.interactivePointer.active = false;
            return;
        }
        updateInteractivePointerFromClient(host, event.clientX, event.clientY);
        if (!state.interactionDragging) return;

        const dx = event.clientX - state.lastInteractionPointer.x;
        const dy = event.clientY - state.lastInteractionPointer.y;
        if (Math.abs(dx) + Math.abs(dy) > 0.5) {
            container.setAttribute('data-interaction-last', 'drag-move');
        }
        const now = performance.now();
        const dt = Math.max(1 / 120, Math.min(0.08, (now - state.lastInteractionPointer.t) / 1000 || 1 / 60));
        state.userOrbitOffset.theta -= dx * 0.002;
        state.userOrbitOffset.phi = THREE.MathUtils.clamp(
            state.userOrbitOffset.phi - dy * 0.002,
            -Math.PI * 0.45,
            Math.PI * 0.45,
        );
        state.particleSpinVelocity.x = THREE.MathUtils.clamp(dy * 0.0032 * dt * 60, -0.18, 0.18);
        state.particleSpinVelocity.y = THREE.MathUtils.clamp(dx * 0.0034 * dt * 60, -0.18, 0.18);
        state.lastInteractionPointer.x = event.clientX;
        state.lastInteractionPointer.y = event.clientY;
        state.lastInteractionPointer.t = now;
    };

    const endDrag = (event: PointerEvent) => {
        state.interactionDragging = false;
        container.removeAttribute('data-interaction-dragging');
        if (container.hasPointerCapture?.(event.pointerId)) {
            container.releasePointerCapture(event.pointerId);
        }
    };

    const leavePointer = () => {
        if (state.interactionDragging) return;
        state.interactivePointer.active = false;
    };

    const handleWheel = (event: WheelEvent) => {
        if (!isEventInsideContainer(container, event) || isPointerOverUi(host, event)) return;
        event.preventDefault();
        container.setAttribute('data-interaction-wheel', 'true');
        container.setAttribute('data-interaction-last', 'wheel');
        state.userOrbitOffset.radius = THREE.MathUtils.clamp(
            state.userOrbitOffset.radius + event.deltaY * 0.005,
            -4.2,
            7.4,
        );
    };

    const resetInteraction = (event: MouseEvent) => {
        if (!isEventInsideContainer(container, event) || isPointerOverUi(host, event)) return;
        state.userOrbitOffset.theta = 0;
        state.userOrbitOffset.phi = 0;
        state.userOrbitOffset.radius = 0;
        state.particleSpinVelocity.x = 0;
        state.particleSpinVelocity.y = 0;
        state.particleRotation.set(0, 0, 0);
        container.setAttribute('data-interaction-reset', 'true');
    };

    container.setAttribute('data-interactive-ready', 'true');
    window.addEventListener('pointerdown', beginDrag, true);
    window.addEventListener('pointermove', movePointer, { passive: true });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    container.addEventListener('pointerleave', leavePointer);
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    window.addEventListener('dblclick', resetInteraction, true);

    return () => {
        container.removeAttribute('data-interactive-ready');
        container.removeAttribute('data-interaction-dragging');
        window.removeEventListener('pointerdown', beginDrag, true);
        window.removeEventListener('pointermove', movePointer);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        container.removeEventListener('pointerleave', leavePointer);
        window.removeEventListener('wheel', handleWheel, true);
        window.removeEventListener('dblclick', resetInteraction, true);
    };
};
