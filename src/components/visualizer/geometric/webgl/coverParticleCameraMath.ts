import * as THREE from 'three';
import type { Interactive3dSceneTuning } from '../../../../types';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { orbitToCameraPosition } from '../interactiveCamera/interactiveCameraMath';
import { resolveCoverParticleFitCameraRadius } from './coverParticleViewportFitMath';
import { resolveVisiblePaneLookAtX } from '../resolveInteractive3dStageContainment';
import {
    applyCoverParticleCinemaOffset,
    type CoverParticleCinemaCamera,
} from './coverParticleCinemaCamera';
import type { CoverParticlePresetRuntimeProfile } from './coverParticlePresetRuntime';
import type { CoverParticlePresetOrbitBaseline } from './presets/types';

// src/components/visualizer/geometric/webgl/coverParticleCameraMath.ts
// Interactive camera + particle rotation update for cover particle runtime.

export interface CoverParticleOrbitState {
    theta: number;
    phi: number;
    radius: number;
    lookAt: THREE.Vector3;
}

export interface CoverParticleCameraApplyState {
    camera: THREE.PerspectiveCamera;
    coverPoints: THREE.Points | null;
    bloomPoints: THREE.Points | null;
    cinemaCamera: CoverParticleCinemaCamera;
    mineradioOrbit: CoverParticleOrbitState;
    userOrbitOffset: { theta: number; phi: number; radius: number };
    particleRotation: THREE.Euler;
    particleSpinVelocity: { x: number; y: number };
    paneLookAtX: number;
    snapPaneLookAt: boolean;
    lyricColumnEndRatio?: number;
    pointerActive: boolean;
    pointerX: number;
    pointerY: number;
}

/** Apply interactive / auto camera for one cover-particle frame. */
export const applyCoverParticleInteractiveCamera = (
    state: CoverParticleCameraApplyState,
    input: {
        snapshot?: InteractiveCameraSnapshot;
        bassPulse?: number;
        presetProfile: CoverParticlePresetRuntimeProfile;
        preset: Interactive3dSceneTuning['visualPreset'];
        orbitBaseline?: CoverParticlePresetOrbitBaseline;
        cinemaShake?: number;
        atmosphereEnergy?: number;
        dt?: number;
        beat?: number;
        lyricColumnEndRatioFromInputs?: number;
    },
): void => {
    const snapshot = input.snapshot;
    const bassPulse = input.bassPulse ?? 0;
    const cinemaShake = input.cinemaShake ?? 0.5;
    const atmosphereEnergy = input.atmosphereEnergy ?? 0;
    const dt = input.dt ?? 0.016;
    const beat = input.beat ?? 0;
    const { presetProfile, preset, orbitBaseline } = input;

    const syncRotation = (rotationX: number, rotationY: number) => {
        if (state.coverPoints) {
            state.coverPoints.rotation.set(rotationX, rotationY, 0);
        }
        if (state.bloomPoints) {
            state.bloomPoints.rotation.copy(state.coverPoints?.rotation ?? new THREE.Euler());
        }
    };

    const immersiveStrength = 0;
    const responsiveBassPulse = bassPulse * (1 + immersiveStrength * 0.45);
    const baseZ = presetProfile.cameraZ - responsiveBassPulse * presetProfile.bassCameraPunch;
    const cinemaOffset = state.cinemaCamera.tick(
        dt,
        beat,
        cinemaShake * (1 + immersiveStrength * 0.45),
        atmosphereEnergy,
    );
    const cinematicPosition = applyCoverParticleCinemaOffset(baseZ, cinemaOffset);
    const focusDistance = orbitBaseline
        ? Math.max(0.5, state.mineradioOrbit.radius)
        : Math.max(0.5, Math.abs(cinematicPosition.z));
    const halfFovTan = Math.tan((state.camera.fov * Math.PI) / 360);
    const halfWidth = halfFovTan * Math.max(0.05, state.camera.aspect) * focusDistance;
    const ratioFromInputs = input.lyricColumnEndRatioFromInputs ?? state.lyricColumnEndRatio;
    const targetPaneLookAtX = resolveVisiblePaneLookAtX(ratioFromInputs, halfWidth);
    if (state.snapPaneLookAt) {
        state.paneLookAtX = targetPaneLookAtX;
        state.snapPaneLookAt = false;
    } else {
        const delta = Math.abs(targetPaneLookAtX - state.paneLookAtX);
        const ease = delta > 1.2 ? 1 : 0.28;
        state.paneLookAtX += (targetPaneLookAtX - state.paneLookAtX) * ease;
    }
    const paneLookAtX = state.paneLookAtX;
    const targetFov = orbitBaseline
        ? presetProfile.fov
            - Math.max(0, beat) * (0.85 + immersiveStrength * 0.55)
            - (presetProfile.immersiveFovOffset ?? 0) * immersiveStrength
        : presetProfile.fov;
    state.camera.fov += (targetFov - state.camera.fov) * (targetFov < state.camera.fov ? 0.24 : 0.12);
    state.camera.updateProjectionMatrix();

    if (!snapshot || snapshot.mode === 'auto') {
        if (orbitBaseline) {
            const targetTheta = orbitBaseline.theta + state.userOrbitOffset.theta + cinemaOffset.thetaKick;
            const targetPhi = THREE.MathUtils.clamp(
                orbitBaseline.phi
                    + state.userOrbitOffset.phi
                    + cinemaOffset.phiKick
                    + (presetProfile.immersivePhiOffset ?? 0) * immersiveStrength,
                -Math.PI * 0.45,
                Math.PI * 0.45,
            );
            const fittedBaselineRadius = resolveCoverParticleFitCameraRadius({
                preset,
                fovDeg: presetProfile.fov,
                aspect: state.camera.aspect,
            }) ?? orbitBaseline.radius;
            const targetRadius = THREE.MathUtils.clamp(
                fittedBaselineRadius
                    + state.userOrbitOffset.radius
                    - responsiveBassPulse * presetProfile.bassCameraPunch
                    + cinemaOffset.radiusKick
                    + (presetProfile.immersiveRadiusOffset ?? 0) * immersiveStrength,
                2.4,
                18,
            );
            const focusEase = Math.max(0.10, 0.12 + beat * 0.12);
            const radiusEase = Math.max(0.07, 0.09 + beat * 0.12);
            state.mineradioOrbit.theta += (targetTheta - state.mineradioOrbit.theta) * focusEase;
            state.mineradioOrbit.phi += (targetPhi - state.mineradioOrbit.phi) * focusEase;
            state.mineradioOrbit.radius += (targetRadius - state.mineradioOrbit.radius) * radiusEase;
            state.mineradioOrbit.lookAt.x = paneLookAtX;
            const cy = Math.cos(state.mineradioOrbit.phi);
            state.camera.position.set(
                state.mineradioOrbit.lookAt.x
                    + state.mineradioOrbit.radius * cy * Math.sin(state.mineradioOrbit.theta),
                state.mineradioOrbit.lookAt.y
                    + state.mineradioOrbit.radius * Math.sin(state.mineradioOrbit.phi),
                state.mineradioOrbit.lookAt.z
                    + state.mineradioOrbit.radius * cy * Math.cos(state.mineradioOrbit.theta),
            );
            state.camera.rotation.set(0, 0, 0);
            state.camera.lookAt(state.mineradioOrbit.lookAt);
            const pointerRotationX = state.pointerActive ? -state.pointerY * 0.12 : 0;
            const pointerRotationY = state.pointerActive ? state.pointerX * 0.18 : 0;
            state.particleRotation.x += state.particleSpinVelocity.x;
            state.particleRotation.y += state.particleSpinVelocity.y;
            state.particleSpinVelocity.x *= 0.92;
            state.particleSpinVelocity.y *= 0.92;
            state.particleRotation.x += (pointerRotationX - state.particleRotation.x) * 0.018;
            state.particleRotation.y += (pointerRotationY - state.particleRotation.y) * 0.018;
            syncRotation(state.particleRotation.x, state.particleRotation.y);
            return;
        }

        syncRotation(0, 0);
        state.camera.position.set(
            cinematicPosition.x + paneLookAtX,
            cinematicPosition.y,
            cinematicPosition.z,
        );
        state.camera.rotation.set(0, 0, 0);
        state.camera.lookAt(paneLookAtX, 0, 0);
        return;
    }

    if (snapshot.mode === 'orbit') {
        syncRotation(0, 0);
        const position = orbitToCameraPosition(snapshot.orbit);
        state.camera.position.set(position.x, position.y, position.z);
        state.camera.lookAt(
            snapshot.orbit.lookAtX,
            snapshot.orbit.lookAtY,
            snapshot.orbit.lookAtZ,
        );
        return;
    }

    if (snapshot.mode === 'wasd') {
        syncRotation(0, 0);
        const { x, y, z, yaw, pitch, roll } = snapshot.free;
        state.camera.position.set(x, y, z);
        state.camera.rotation.order = 'YXZ';
        state.camera.rotation.set(pitch, yaw, roll);
        return;
    }

    if (snapshot.mode === 'gesture') {
        state.camera.position.set(
            cinematicPosition.x + paneLookAtX,
            cinematicPosition.y,
            cinematicPosition.z,
        );
        state.camera.rotation.set(0, 0, 0);
        state.camera.lookAt(paneLookAtX, 0, 0);
        syncRotation(snapshot.gesture.rotationX, snapshot.gesture.rotationY);
    }
};
