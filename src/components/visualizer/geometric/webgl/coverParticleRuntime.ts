import * as THREE from 'three';
import type { AudioBands, Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { orbitToCameraPosition, resolveOrbitFitCameraRadius } from '../interactiveCamera/interactiveCameraMath';
import {
    buildCoverParticleGeometry,
    coverParticleGridForQualityTier,
    coverParticleGridForResolution,
} from './buildCoverParticleGeometry';
import {
    applyCoverParticleCinemaOffset,
    CoverParticleCinemaCamera,
} from './coverParticleCinemaCamera';
import { createCoverParticleMaterials, type CoverParticleUniforms } from './coverParticleMaterials';
import { createDotTexture, createEmptyColorTexture } from './createDotTexture';
import { buildCoverEdgeAndDepthFromSource } from './buildCoverEdgeAndDepth';
import { CoverColorMixTween } from './coverColorMixTween';
import { CoverNumericTween } from './coverNumericTween';
import {
    resolveWebGLPresetIndex,
    shouldRenderMineradioWebGL,
} from './mineradioPresetMap';
import { subscribeGeometricCanvasFrame } from '../geometricCanvasRuntime';
import { CoverParticleAudioSmoother } from './coverParticleAudioUniforms';
import { CoverParticleBurstSmoother } from './coverParticleBurstSmoother';
import { resolveCoverParticlePresetRuntime } from './coverParticlePresetRuntime';
import { CoverParticleRippleField } from './coverParticleRipples';
import { LyricStageRuntime, type LyricStageTickInput } from '../mineradio/lyrics/LyricStageRuntime';
import { drawCoverToSquareCanvas } from './prepareCoverParticleTexture';
import {
    QUANTUM_CUBE_FRAGMENT_SHADER,
    QUANTUM_CUBE_VERTEX_SHADER,
} from './quantumCubeShaders';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import { fetchCoverViaProxy } from '../../../../utils/fetchCoverViaProxy';

// src/components/visualizer/geometric/webgl/coverParticleRuntime.ts
// Three.js runtime for cover particle WebGL layers.

export interface CoverParticleRuntimeInputs {
    audioBands?: AudioBands;
    beat: number;
    atmosphereEnergy?: number;
    smartAtmosphereEnabled?: boolean;
    musicActive: boolean;
    pointerX: number;
    pointerY: number;
    pointerActive: boolean;
    paused: boolean;
    camera?: InteractiveCameraSnapshot;
}

export type MineradioLyricRuntimeInputs = Omit<LyricStageTickInput, 'beatPulse' | 'dt'>;

const createCoverMaterial = (
    dotTexture: THREE.Texture,
    fallbackCoverTexture: THREE.Texture,
) => createCoverParticleMaterials(dotTexture, fallbackCoverTexture);

const MINERADIO_ORBIT_BASELINES: Partial<Record<
    NonNullable<Interactive3dSceneTuning['visualPreset']>,
    { theta: number; phi: number; radius: number }
>> = {
    emily: { theta: 0, phi: 0.08, radius: 6.6 },
    mineradioTunnel: { theta: 0, phi: 0.03, radius: 6.2 },
    mineradioOrbit: { theta: 0, phi: 0.12, radius: 8.8 },
    mineradioVoid: { theta: 0, phi: 0.05, radius: 8.0 },
    mineradioVinyl: { theta: 0, phi: 0.04, radius: 6.5 },
    mineradioGalaxy: { theta: -0.52, phi: 0.34, radius: 9.4 },
};

const UI_HIT_SELECTOR = [
    'button',
    'a',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    '[data-radix-popper-content-wrapper]',
    '[data-testid="floating-player-controls"]',
    '[data-testid="player-controls"]',
    '[data-testid="interactive3d-camera-capture"]',
].join(',');

export class CoverParticleRuntime {
    private container: HTMLElement | null = null;

    private renderer: THREE.WebGLRenderer | null = null;

    private scene = new THREE.Scene();

    private quantumScene = new THREE.Scene();

    private quantumCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    private camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);

    private dotTexture = createDotTexture();

    private fallbackCoverTexture = createEmptyColorTexture();

    private prevCoverTexture = createEmptyColorTexture();

    private edgeTexture: THREE.Texture | null = null;

    private colorMixTween = new CoverColorMixTween();

    private alphaTween = new CoverNumericTween();

    private depthTween = new CoverNumericTween();

    private aiBoostTween = new CoverNumericTween();

    private loadingTween = new CoverNumericTween();

    private loadingShownAt = 0;

    private loadingHideTimer: ReturnType<typeof window.setTimeout> | null = null;

    private coverMaterials = createCoverMaterial(this.dotTexture, this.fallbackCoverTexture);

    private uniforms: CoverParticleUniforms = this.coverMaterials.uniforms;

    private coverMaterial = this.coverMaterials.mainMaterial;

    private bloomMaterial = this.coverMaterials.bloomMaterial;

    private coverPoints: THREE.Points | null = null;

    private bloomPoints: THREE.Points | null = null;

    private quantumMaterial: THREE.ShaderMaterial | null = null;

    private quantumMesh: THREE.Mesh | null = null;

    private coverTexture: THREE.Texture | null = null;

    private textureLoader = new THREE.TextureLoader();

    private mode: 'cover' | 'none' = 'none';

    private tuning: Interactive3dSceneTuning | undefined;

    private qualityProfile: GeometricQualityProfile | undefined;

    private coverUrl: string | null = null;

    private loadedCoverUrl: string | null = null;

    private coverLoadToken = 0;

    private coverObjectUrl: string | null = null;

    private vinylSpin = 0;

    private audioSmoother = new CoverParticleAudioSmoother();

    private burstSmoother = new CoverParticleBurstSmoother();

    private cinemaCamera = new CoverParticleCinemaCamera();

    private mineradioOrbit = {
        theta: 0,
        phi: 0.08,
        radius: 6.6,
        lookAt: new THREE.Vector3(0, 0, 0),
    };

    private particleRotation = new THREE.Euler(0, 0, 0);

    private userOrbitOffset = {
        theta: 0,
        phi: 0,
        radius: 0,
    };

    private particleSpinVelocity = {
        x: 0,
        y: 0,
    };

    private interactionDragging = false;

    private lastInteractionPointer = { x: 0, y: 0, t: 0 };

    private pointerRaycaster = new THREE.Raycaster();

    private pointerNdc = new THREE.Vector2();

    private pointerPlane = new THREE.Plane();

    private pointerPlanePoint = new THREE.Vector3();

    private pointerPlaneNormal = new THREE.Vector3();

    private pointerWorldHit = new THREE.Vector3();

    private pointerLocalHit = new THREE.Vector3(-999, -999, 0);

    private pointerQuaternion = new THREE.Quaternion();

    private interactivePointer = {
        x: -999,
        y: -999,
        active: false,
    };

    private removeInteractionListeners: (() => void) | null = null;

    private loadedVisualPreset: Interactive3dSceneTuning['visualPreset'] | null = null;

    private hasRevealedParticles = false;

    private frameUnsubscribe: (() => void) | null = null;

    private inputProvider: (() => CoverParticleRuntimeInputs) | null = null;

    private clock = new THREE.Clock();

    private lyricStage = new LyricStageRuntime();

    private rippleField = new CoverParticleRippleField();

    private lyricStageEnabled = true;

    private lyricImmersive = false;

    private lyricInputProvider: (() => MineradioLyricRuntimeInputs) | null = null;

    private latestLyricInputs: MineradioLyricRuntimeInputs = {
        lines: [],
        currentTimeSec: 0,
        playing: false,
        showLyrics: true,
        palette: {
            primary: '#d6f8ff',
            secondary: '#9cffdf',
            highlight: '#fff0b8',
            glow: '#9cffdf',
        },
    };

    private latestInputs: CoverParticleRuntimeInputs = {
        beat: 0,
        atmosphereEnergy: 0,
        musicActive: false,
        pointerX: 0,
        pointerY: 0,
        pointerActive: false,
        paused: false,
    };

    /** 根据交互镜头快照更新 Three.js 相机与粒子组旋转。 */
    private applyInteractiveCamera(
        snapshot?: InteractiveCameraSnapshot,
        bassPulse = 0,
        presetProfile = resolveCoverParticlePresetRuntime('emily'),
        preset: Interactive3dSceneTuning['visualPreset'] = 'emily',
        cinemaShake = 0.5,
        atmosphereEnergy = 0,
        dt = 0.016,
        beat = 0,
    ) {
        const syncRotation = (rotationX: number, rotationY: number) => {
            if (this.coverPoints) {
                this.coverPoints.rotation.set(rotationX, rotationY, 0);
            }
            if (this.bloomPoints) {
                this.bloomPoints.rotation.copy(this.coverPoints?.rotation ?? new THREE.Euler());
            }
        };

        const baseZ = presetProfile.cameraZ - bassPulse * presetProfile.bassCameraPunch;
        const cinemaOffset = this.cinemaCamera.tick(dt, beat, cinemaShake, atmosphereEnergy);
        const cinematicPosition = applyCoverParticleCinemaOffset(baseZ, cinemaOffset);
        const orbitBaseline = MINERADIO_ORBIT_BASELINES[preset ?? 'emily'];
        const targetFov = orbitBaseline
            ? presetProfile.fov - Math.max(0, beat) * 0.85
            : presetProfile.fov;
        this.camera.fov += (targetFov - this.camera.fov) * (targetFov < this.camera.fov ? 0.24 : 0.12);
        this.camera.updateProjectionMatrix();

        if (!snapshot || snapshot.mode === 'auto') {
            if (orbitBaseline) {
                const targetTheta = orbitBaseline.theta + this.userOrbitOffset.theta + cinemaOffset.thetaKick;
                const targetPhi = THREE.MathUtils.clamp(
                    orbitBaseline.phi + this.userOrbitOffset.phi + cinemaOffset.phiKick,
                    -Math.PI * 0.45,
                    Math.PI * 0.45,
                );
                // Planet: pull camera back from the shorter viewport axis so the sphere never crops.
                const fittedBaselineRadius = preset === 'mineradioOrbit'
                    ? resolveOrbitFitCameraRadius({
                        fovDeg: presetProfile.fov,
                        aspect: this.camera.aspect,
                    })
                    : orbitBaseline.radius;
                const targetRadius = THREE.MathUtils.clamp(
                    fittedBaselineRadius
                        + this.userOrbitOffset.radius
                        - bassPulse * presetProfile.bassCameraPunch
                        + cinemaOffset.radiusKick,
                    2.4,
                    preset === 'mineradioOrbit' ? 18 : 14,
                );
                const focusEase = Math.max(0.10, 0.12 + beat * 0.12);
                const radiusEase = Math.max(0.07, 0.09 + beat * 0.12);
                this.mineradioOrbit.theta += (targetTheta - this.mineradioOrbit.theta) * focusEase;
                this.mineradioOrbit.phi += (targetPhi - this.mineradioOrbit.phi) * focusEase;
                this.mineradioOrbit.radius += (targetRadius - this.mineradioOrbit.radius) * radiusEase;
                const cy = Math.cos(this.mineradioOrbit.phi);
                this.camera.position.set(
                    this.mineradioOrbit.lookAt.x
                        + this.mineradioOrbit.radius * cy * Math.sin(this.mineradioOrbit.theta),
                    this.mineradioOrbit.lookAt.y
                        + this.mineradioOrbit.radius * Math.sin(this.mineradioOrbit.phi),
                    this.mineradioOrbit.lookAt.z
                        + this.mineradioOrbit.radius * cy * Math.cos(this.mineradioOrbit.theta),
                );
                this.camera.rotation.set(0, 0, 0);
                this.camera.lookAt(this.mineradioOrbit.lookAt);
                const pointerRotationX = this.latestInputs.pointerActive ? -this.latestInputs.pointerY * 0.12 : 0;
                const pointerRotationY = this.latestInputs.pointerActive ? this.latestInputs.pointerX * 0.18 : 0;
                this.particleRotation.x += this.particleSpinVelocity.x;
                this.particleRotation.y += this.particleSpinVelocity.y;
                this.particleSpinVelocity.x *= 0.92;
                this.particleSpinVelocity.y *= 0.92;
                this.particleRotation.x += (pointerRotationX - this.particleRotation.x) * 0.018;
                this.particleRotation.y += (pointerRotationY - this.particleRotation.y) * 0.018;
                syncRotation(this.particleRotation.x, this.particleRotation.y);
                return;
            }

            syncRotation(0, 0);
            this.camera.position.set(
                cinematicPosition.x,
                cinematicPosition.y,
                cinematicPosition.z,
            );
            this.camera.rotation.set(0, 0, 0);
            this.camera.lookAt(0, 0, 0);
            return;
        }

        if (snapshot.mode === 'orbit') {
            syncRotation(0, 0);
            const position = orbitToCameraPosition(snapshot.orbit);
            this.camera.position.set(position.x, position.y, position.z);
            this.camera.lookAt(
                snapshot.orbit.lookAtX,
                snapshot.orbit.lookAtY,
                snapshot.orbit.lookAtZ,
            );
            return;
        }

        if (snapshot.mode === 'wasd') {
            syncRotation(0, 0);
            const { x, y, z, yaw, pitch, roll } = snapshot.free;
            this.camera.position.set(x, y, z);
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.set(pitch, yaw, roll);
            return;
        }

        if (snapshot.mode === 'gesture') {
            this.camera.position.set(
                cinematicPosition.x,
                cinematicPosition.y,
                cinematicPosition.z,
            );
            this.camera.rotation.set(0, 0, 0);
            this.camera.lookAt(0, 0, 0);
            syncRotation(snapshot.gesture.rotationX, snapshot.gesture.rotationY);
        }
    }

    mount(container: HTMLElement) {
        this.container = container;
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(1);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);
        const canvas = this.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'auto';
        canvas.style.touchAction = 'none';
        canvas.style.zIndex = '0';
        this.camera.position.set(0, 0, 6.6);
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(0, 0, 0);
        this.mountQuantumCubePass();
        this.uniforms.uRippleTex.value = this.rippleField.texture;
        this.uniforms.uPrevCoverTex.value = this.prevCoverTexture;
        this.uniforms.uEdgeTex.value = this.fallbackCoverTexture;
        this.lyricStage.mount(this.scene, this.renderer, this.camera);
        this.resize(
            container.clientWidth || container.getBoundingClientRect().width,
            container.clientHeight || container.getBoundingClientRect().height,
        );
        requestAnimationFrame(() => {
            if (!this.container || !this.renderer) return;
            this.resize(
                this.container.clientWidth || this.container.getBoundingClientRect().width,
                this.container.clientHeight || this.container.getBoundingClientRect().height,
            );
            this.renderFrame();
        });
        this.installInteractionListeners(container);
    }

    dispose() {
        this.coverLoadToken += 1;
        this.frameUnsubscribe?.();
        this.frameUnsubscribe = null;
        this.colorMixTween.cancel();
        this.alphaTween.cancel();
        this.depthTween.cancel();
        this.aiBoostTween.cancel();
        this.loadingTween.cancel();
        if (this.loadingHideTimer) {
            window.clearTimeout(this.loadingHideTimer);
            this.loadingHideTimer = null;
        }
        this.inputProvider = null;
        this.removeInteractionListeners?.();
        this.removeInteractionListeners = null;
        this.coverPoints?.geometry.dispose();
        this.coverMaterial.dispose();
        this.bloomMaterial.dispose();
        this.quantumMaterial?.dispose();
        this.quantumMesh?.geometry.dispose();
        this.coverTexture?.dispose();
        this.edgeTexture?.dispose();
        this.fallbackCoverTexture.dispose();
        this.prevCoverTexture.dispose();
        this.dotTexture.dispose();
        this.revokeCoverObjectUrl();
        this.rippleField.dispose();
        this.lyricStage.dispose();
        this.renderer?.dispose();
        this.renderer?.domElement.remove();
        this.container = null;
    }

    private isEventInsideContainer(event: MouseEvent | PointerEvent | WheelEvent) {
        if (!this.container) return false;
        const rect = this.container.getBoundingClientRect();
        return event.clientX >= rect.left
            && event.clientX <= rect.right
            && event.clientY >= rect.top
            && event.clientY <= rect.bottom;
    }

    private isPointerOverUi(event: MouseEvent | PointerEvent | WheelEvent) {
        const element = document.elementFromPoint(event.clientX, event.clientY);
        if (!element || element === this.renderer?.domElement || element === this.container) return false;
        return Boolean(element.closest(UI_HIT_SELECTOR));
    }

    private updateInteractivePointerFromClient(clientX: number, clientY: number) {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        const ndcX = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        const ndcY = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
        this.pointerNdc.set(ndcX, ndcY);
        this.pointerRaycaster.setFromCamera(this.pointerNdc, this.camera);

        if (this.coverPoints) {
            this.coverPoints.updateMatrixWorld(true);
            this.coverPoints.getWorldPosition(this.pointerPlanePoint);
            this.coverPoints.getWorldQuaternion(this.pointerQuaternion);
            this.pointerPlaneNormal.set(0, 0, 1).applyQuaternion(this.pointerQuaternion).normalize();
            if (Math.abs(this.pointerPlaneNormal.dot(this.pointerRaycaster.ray.direction)) >= 0.16) {
                this.pointerPlane.setFromNormalAndCoplanarPoint(
                    this.pointerPlaneNormal,
                    this.pointerPlanePoint,
                );
                if (this.pointerRaycaster.ray.intersectPlane(this.pointerPlane, this.pointerWorldHit)) {
                    this.pointerLocalHit.copy(this.pointerWorldHit);
                    this.coverPoints.worldToLocal(this.pointerLocalHit);
                    if (
                        Number.isFinite(this.pointerLocalHit.x)
                        && Number.isFinite(this.pointerLocalHit.y)
                        && Math.abs(this.pointerLocalHit.x) < 8.5
                        && Math.abs(this.pointerLocalHit.y) < 8.5
                    ) {
                        this.interactivePointer.x = this.pointerLocalHit.x;
                        this.interactivePointer.y = this.pointerLocalHit.y;
                        this.interactivePointer.active = true;
                        return;
                    }
                }
            }
        }

        this.interactivePointer.x = -999;
        this.interactivePointer.y = -999;
        this.interactivePointer.active = false;
    }

    private installInteractionListeners(container: HTMLElement) {
        this.removeInteractionListeners?.();

        const beginDrag = (event: PointerEvent) => {
            if (event.button !== 0 || !this.isEventInsideContainer(event) || this.isPointerOverUi(event)) return;
            this.interactionDragging = true;
            container.setAttribute('data-interaction-dragging', 'true');
            container.setAttribute('data-interaction-last', 'drag-start');
            this.lastInteractionPointer = {
                x: event.clientX,
                y: event.clientY,
                t: performance.now(),
            };
            this.particleSpinVelocity.x = 0;
            this.particleSpinVelocity.y = 0;
            this.updateInteractivePointerFromClient(event.clientX, event.clientY);
            if (event.target === container || event.target === this.renderer?.domElement) {
                container.setPointerCapture?.(event.pointerId);
            }
        };

        const movePointer = (event: PointerEvent) => {
            if (!this.isEventInsideContainer(event)) {
                if (!this.interactionDragging) this.interactivePointer.active = false;
                return;
            }
            if (this.isPointerOverUi(event) && !this.interactionDragging) {
                this.interactivePointer.active = false;
                return;
            }
            this.updateInteractivePointerFromClient(event.clientX, event.clientY);
            if (!this.interactionDragging) return;

            const dx = event.clientX - this.lastInteractionPointer.x;
            const dy = event.clientY - this.lastInteractionPointer.y;
            if (Math.abs(dx) + Math.abs(dy) > 0.5) {
                container.setAttribute('data-interaction-last', 'drag-move');
            }
            const now = performance.now();
            const dt = Math.max(1 / 120, Math.min(0.08, (now - this.lastInteractionPointer.t) / 1000 || 1 / 60));
            this.userOrbitOffset.theta -= dx * 0.002;
            this.userOrbitOffset.phi = THREE.MathUtils.clamp(
                this.userOrbitOffset.phi - dy * 0.002,
                -Math.PI * 0.45,
                Math.PI * 0.45,
            );
            this.particleSpinVelocity.x = THREE.MathUtils.clamp(dy * 0.0032 * dt * 60, -0.18, 0.18);
            this.particleSpinVelocity.y = THREE.MathUtils.clamp(dx * 0.0034 * dt * 60, -0.18, 0.18);
            this.lastInteractionPointer = { x: event.clientX, y: event.clientY, t: now };
        };

        const endDrag = (event: PointerEvent) => {
            this.interactionDragging = false;
            container.removeAttribute('data-interaction-dragging');
            if (container.hasPointerCapture?.(event.pointerId)) {
                container.releasePointerCapture(event.pointerId);
            }
        };

        const leavePointer = () => {
            if (this.interactionDragging) return;
            this.interactivePointer.active = false;
        };

        const handleWheel = (event: WheelEvent) => {
            if (!this.isEventInsideContainer(event) || this.isPointerOverUi(event)) return;
            event.preventDefault();
            container.setAttribute('data-interaction-wheel', 'true');
            container.setAttribute('data-interaction-last', 'wheel');
            this.userOrbitOffset.radius = THREE.MathUtils.clamp(
                this.userOrbitOffset.radius + event.deltaY * 0.005,
                -4.2,
                7.4,
            );
        };

        const resetInteraction = (event: MouseEvent) => {
            if (!this.isEventInsideContainer(event) || this.isPointerOverUi(event)) return;
            this.userOrbitOffset = { theta: 0, phi: 0, radius: 0 };
            this.particleSpinVelocity = { x: 0, y: 0 };
            this.particleRotation.set(0, 0, 0);
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

        this.removeInteractionListeners = () => {
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
    }

    resize(width: number, height: number) {
        if (!this.renderer || width <= 0 || height <= 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, this.qualityProfile?.devicePixelRatioCap ?? 1.25);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        const pixel = this.renderer.getPixelRatio();
        this.uniforms.uPixel.value = pixel;
        if (this.quantumMaterial) {
            this.quantumMaterial.uniforms.iResolution.value.set(width * pixel, height * pixel);
        }
        this.syncLyricStageViewport();
    }

    /**
     * Lock lyrics to the camera frustum so orbit / cinema never push text off-screen.
     */
    private syncLyricStageViewport() {
        this.lyricStage.syncScreenLock(this.camera);
    }

    configure(
        coverUrl: string | null | undefined,
        tuning: Interactive3dSceneTuning | undefined,
        qualityProfile: GeometricQualityProfile,
    ) {
        this.tuning = tuning;
        this.qualityProfile = qualityProfile;
        this.coverUrl = coverUrl ?? null;
        const preset = normalizeInteractive3dVisualPreset(tuning?.visualPreset);
        const enabled = tuning?.enableCoverParticles ?? true;
        const nextMode = !enabled || !shouldRenderMineradioWebGL(preset, enabled)
            ? 'none'
            : 'cover';

        if (nextMode !== this.mode) {
            this.switchMode(nextMode);
        }

        if (nextMode === 'cover') {
            if (this.loadedVisualPreset !== preset) {
                const presetBurst = preset === 'mineradioTunnel'
                    ? 0.30
                    : preset === 'quantumCube' || preset === 'mineradioOrbit' || preset === 'mineradioVinyl'
                        ? 0.24
                        : preset === 'mineradioGalaxy'
                            ? 0.16
                        : 0.14;
                this.burstSmoother.trigger(presetBurst);
                this.loadedVisualPreset = preset;
            }
            this.uniforms.uPreset.value = resolveWebGLPresetIndex(preset);
            this.rebuildCoverGeometry(qualityProfile);
            this.ensureParticleAlphaVisible();
            this.loadCoverTexture(this.coverUrl);
            this.renderFrame();
        }
    }

    setInputs(inputs: CoverParticleRuntimeInputs) {
        this.latestInputs = inputs;
    }

    setInputProvider(provider: () => CoverParticleRuntimeInputs) {
        this.inputProvider = provider;
    }

    setLyricImmersive(enabled: boolean) {
        this.lyricImmersive = enabled;
        this.lyricStage.setImmersive(enabled);
    }

    setLyricInputProvider(provider: () => MineradioLyricRuntimeInputs) {
        this.lyricInputProvider = provider;
    }

    setLyricStageEnabled(enabled: boolean) {
        this.lyricStageEnabled = enabled;
        if (!enabled) this.lyricStage.clear();
    }

    start() {
        this.frameUnsubscribe?.();
        this.frameUnsubscribe = subscribeGeometricCanvasFrame(({ hidden }) => {
            if (hidden) return;
            if (this.inputProvider) {
                this.latestInputs = this.inputProvider();
            }
            this.renderFrame();
        });
    }

    private switchMode(mode: 'cover' | 'none') {
        if (this.bloomPoints) {
            this.scene.remove(this.bloomPoints);
            this.bloomPoints = null;
        }
        if (this.coverPoints) {
            this.scene.remove(this.coverPoints);
            this.coverPoints.geometry.dispose();
            this.coverPoints = null;
        }
        this.mode = mode;
    }

    private mountQuantumCubePass() {
        if (this.quantumMesh) return;
        this.quantumMaterial = new THREE.ShaderMaterial({
            uniforms: {
                iResolution: { value: new THREE.Vector2(1, 1) },
                iTime: { value: 0 },
                uCamPos: { value: new THREE.Vector3(1.3, -0.8, -1.6) },
                uBass: { value: 0 },
                uMid: { value: 0 },
                uTreble: { value: 0 },
                uBeat: { value: 0 },
                uEnergy: { value: 0 },
                uColorMixT: { value: 1 },
                uCoverTex: { value: this.fallbackCoverTexture },
                uPrevCoverTex: { value: this.prevCoverTexture },
            },
            vertexShader: QUANTUM_CUBE_VERTEX_SHADER,
            fragmentShader: QUANTUM_CUBE_FRAGMENT_SHADER,
            depthWrite: false,
            depthTest: false,
        });
        this.quantumMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.quantumMaterial);
        this.quantumMesh.frustumCulled = false;
        this.quantumScene.add(this.quantumMesh);
    }

    private rebuildCoverGeometry(profile: GeometricQualityProfile) {
        if (this.mode !== 'cover') return;
        const preset = normalizeInteractive3dVisualPreset(this.tuning?.visualPreset);
        const grid = preset === 'emily'
            ? coverParticleGridForResolution(1.55)
            : coverParticleGridForQualityTier(profile.tier);
        if (this.coverPoints && this.coverPoints.geometry.userData.grid === grid) return;
        if (this.bloomPoints) {
            this.scene.remove(this.bloomPoints);
            this.bloomPoints = null;
        }
        if (this.coverPoints) {
            this.scene.remove(this.coverPoints);
            this.coverPoints.geometry.dispose();
            this.coverPoints = null;
        }
        const geometry = buildCoverParticleGeometry(grid);
        this.bloomPoints = new THREE.Points(geometry, this.bloomMaterial);
        this.bloomPoints.frustumCulled = false;
        this.bloomPoints.renderOrder = 0;
        this.coverPoints = new THREE.Points(geometry, this.coverMaterial);
        this.coverPoints.frustumCulled = false;
        this.coverPoints.renderOrder = 1;
        this.scene.add(this.bloomPoints);
        this.scene.add(this.coverPoints);
    }

    private revokeCoverObjectUrl() {
        if (!this.coverObjectUrl) return;
        URL.revokeObjectURL(this.coverObjectUrl);
        this.coverObjectUrl = null;
    }

    private async resolveCoverTextureUrl(url: string) {
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            return { textureUrl: url, objectUrl: null };
        }

        const buildObjectUrl = async (response: Response) => {
            if (!response.ok) {
                throw new Error(`cover fetch failed: ${response.status}`);
            }
            const blob = await response.blob();
            if (!blob.size) {
                throw new Error('cover fetch returned empty body');
            }
            return { textureUrl: URL.createObjectURL(blob), objectUrl: true as const };
        };

        try {
            const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
            return await buildObjectUrl(response);
        } catch {
            try {
                // Electron IPC or /api/lyric-proxy — needed for Netease/QQ CDN CORS.
                const proxied = await fetchCoverViaProxy(url);
                return await buildObjectUrl(proxied);
            } catch {
                // Avoid TextureLoader on cross-origin URLs: canvas readback would stay tainted.
                throw new Error(`cover proxy fetch failed for ${url}`);
            }
        }
    }

    private loadCoverTexture(url: string | null) {
        if (url === this.loadedCoverUrl) return;
        const loadToken = ++this.coverLoadToken;
        this.container?.setAttribute('data-cover-url', url ?? '');
        this.container?.removeAttribute('data-loaded-cover-url');
        this.container?.removeAttribute('data-cover-depth-ready');
        this.container?.removeAttribute('data-cover-load-error');

        if (!url) {
            this.loadedCoverUrl = null;
            this.uniforms.uHasCover.value = 0;
            this.setCoverDepthState(0, 0, 1);
            this.hideLoading();
            this.revokeCoverObjectUrl();
            return;
        }
        this.showLoading();
        this.textureLoader.setCrossOrigin('anonymous');
        void this.resolveCoverTextureUrl(url).then(({ textureUrl, objectUrl }) => {
            if (loadToken !== this.coverLoadToken) {
                if (objectUrl) URL.revokeObjectURL(textureUrl);
                return;
            }

            if (objectUrl) {
                this.revokeCoverObjectUrl();
                this.coverObjectUrl = textureUrl;
            }

            this.textureLoader.load(
                textureUrl,
                (texture) => {
                    if (loadToken !== this.coverLoadToken) {
                        texture.dispose();
                        if (objectUrl) URL.revokeObjectURL(textureUrl);
                        return;
                    }
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    this.loadedCoverUrl = url;
                    this.container?.setAttribute('data-loaded-cover-url', url);

                    if (this.coverTexture?.image) {
                        this.copyCoverImageToPrevious(this.coverTexture.image as CanvasImageSource);
                        this.colorMixTween.start((mix) => {
                            this.uniforms.uColorMixT.value = mix;
                        });
                    } else {
                        this.uniforms.uColorMixT.value = 1;
                    }

                    let coverCanvas: HTMLCanvasElement | null = null;
                    try {
                        coverCanvas = drawCoverToSquareCanvas(texture.image as CanvasImageSource);
                    } catch {
                        coverCanvas = null;
                    }
                    texture.dispose();
                    if (!coverCanvas) {
                        this.loadedCoverUrl = null;
                        this.uniforms.uHasCover.value = 0;
                        this.setCoverDepthState(0, 0, 1);
                        this.container?.setAttribute('data-cover-load-error', 'canvas-unreadable');
                        this.hideLoading();
                        return;
                    }

                    this.coverTexture?.dispose();
                    this.coverTexture = new THREE.Texture(coverCanvas);
                    this.coverTexture.minFilter = THREE.LinearFilter;
                    this.coverTexture.magFilter = THREE.LinearFilter;
                    this.coverTexture.wrapS = THREE.ClampToEdgeWrapping;
                    this.coverTexture.wrapT = THREE.ClampToEdgeWrapping;
                    this.coverTexture.needsUpdate = true;
                    this.uniforms.uCoverTex.value = this.coverTexture;
                    this.uniforms.uHasCover.value = 1;
                    this.setCoverDepthState(
                        this.uniforms.uHasDepth.value > 0.5 ? 0.22 : 0,
                        0.20,
                        120,
                    );
                    try {
                        this.applyCoverEdgeFromImage(coverCanvas);
                    } catch {
                        this.setCoverDepthState(0, 0, 1);
                    }
                    this.hideLoading();
                    this.renderFrame();
                },
                undefined,
                () => {
                    if (loadToken !== this.coverLoadToken) return;
                    this.loadedCoverUrl = null;
                    this.uniforms.uHasCover.value = 0;
                    this.setCoverDepthState(0, 0, 1);
                    this.container?.setAttribute('data-cover-load-error', 'texture-load-failed');
                    this.hideLoading();
                },
            );
        }).catch(() => {
            if (loadToken !== this.coverLoadToken) return;
            this.loadedCoverUrl = null;
            this.uniforms.uHasCover.value = 0;
            this.setCoverDepthState(0, 0, 1);
            this.container?.setAttribute('data-cover-load-error', 'proxy-fetch-failed');
            this.hideLoading();
        });
    }

    private showLoading() {
        this.loadingShownAt = performance.now();
        if (this.loadingHideTimer) {
            window.clearTimeout(this.loadingHideTimer);
            this.loadingHideTimer = null;
        }
        this.container?.setAttribute('data-cover-loading', 'true');
        const current = this.uniforms.uLoading.value || 0;
        this.loadingTween.start(current, Math.max(current, 0.56), current > 0.04 ? 86 : 118, (loading) => {
            this.uniforms.uLoading.value = loading;
        });
    }

    private hideLoading() {
        if (this.loadingHideTimer) window.clearTimeout(this.loadingHideTimer);
        const elapsed = this.loadingShownAt ? performance.now() - this.loadingShownAt : 999;
        const wait = Math.max(0, 72 - elapsed);
        this.loadingHideTimer = window.setTimeout(() => {
            this.loadingHideTimer = null;
            const current = this.uniforms.uLoading.value || 0;
            if (current <= 0.015) {
                this.loadingTween.cancel();
                this.uniforms.uLoading.value = 0;
                this.container?.removeAttribute('data-cover-loading');
                return;
            }
            this.loadingTween.start(current, 0, current > 0.38 ? 126 : 96, (loading) => {
                this.uniforms.uLoading.value = loading;
                if (loading <= 0.015) this.container?.removeAttribute('data-cover-loading');
            });
        }, wait);
    }

    /** 将当前封面复制到 prevCover 纹理，供切歌渐变采样。 */
    private copyCoverImageToPrevious(image: CanvasImageSource) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, 256, 256);
        this.prevCoverTexture.image = canvas;
        this.prevCoverTexture.needsUpdate = true;
        this.uniforms.uPrevCoverTex.value = this.prevCoverTexture;
    }

    /** 从封面生成边缘/深度图并写入 uEdgeTex。 */
    private applyCoverEdgeFromImage(image: CanvasImageSource) {
        const edgeCanvas = buildCoverEdgeAndDepthFromSource(image);
        if (!edgeCanvas) {
            this.uniforms.uHasDepth.value = 0;
            return;
        }

        if (!this.edgeTexture) {
            this.edgeTexture = new THREE.Texture(edgeCanvas);
            this.edgeTexture.minFilter = THREE.LinearFilter;
            this.edgeTexture.magFilter = THREE.LinearFilter;
        } else {
            this.edgeTexture.image = edgeCanvas;
        }
        this.edgeTexture.needsUpdate = true;
        this.uniforms.uEdgeTex.value = this.edgeTexture;
        this.setCoverDepthState(1, 0.55, 260);
        this.uniforms.uDepth.value = 0.92;
        this.container?.setAttribute('data-cover-depth-ready', 'true');
    }

    private ensureParticleAlphaVisible() {
        if (this.hasRevealedParticles) return;
        this.hasRevealedParticles = true;
        this.alphaTween.start(this.uniforms.uAlpha.value || 0, 0.96, 920, (alpha) => {
            this.uniforms.uAlpha.value = alpha;
        });
    }

    private setCoverDepthState(depthTo: number, aiTo: number, durationMs: number) {
        const depthTarget = THREE.MathUtils.clamp(depthTo, 0, 1);
        const aiTarget = THREE.MathUtils.clamp(aiTo, 0, 1);
        this.depthTween.start(this.uniforms.uHasDepth.value || 0, depthTarget, durationMs, (depth) => {
            this.uniforms.uHasDepth.value = depth;
        });
        this.aiBoostTween.start(this.uniforms.uAiBoost.value || 0, aiTarget, durationMs, (aiBoost) => {
            this.uniforms.uAiBoost.value = aiBoost;
        });
    }

    private renderFrame() {
        if (!this.renderer || !this.container) return;

        const { audioBands, beat, atmosphereEnergy, smartAtmosphereEnabled = true, musicActive, pointerX, pointerY, pointerActive, paused } = this.latestInputs;
        const baseIntensity = this.tuning?.rhythmIntensity ?? 0.85;
        const atmosphereSensitivity = this.tuning?.atmosphereSensitivity ?? 1;
        const cameraPunchStrength = this.tuning?.cameraPunchStrength ?? 1;
        const intensity = (smartAtmosphereEnabled ? baseIntensity : baseIntensity * 0.34) * atmosphereSensitivity;
        const directedBeat = smartAtmosphereEnabled ? beat * atmosphereSensitivity : 0;
        const directedAtmosphereEnergy = smartAtmosphereEnabled
            ? (atmosphereEnergy ?? 0) * atmosphereSensitivity
            : 0;
        const elapsed = this.clock.getElapsedTime();
        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.lyricInputProvider) {
            this.latestLyricInputs = this.lyricInputProvider();
        }

        const hasParticles = this.mode !== 'none';
        // Lyrics may still need a frame even when particles are off.
        const willTickLyrics = this.lyricStageEnabled;

        if (this.mode === 'cover') {
            const uniforms = this.uniforms;
            const preset = normalizeInteractive3dVisualPreset(this.tuning?.visualPreset);
            const quantumCubeActive = preset === 'quantumCube';
            const presetProfile = resolveCoverParticlePresetRuntime(preset);
            const audioUniforms = this.audioSmoother.tick(
                audioBands,
                directedBeat,
                intensity,
                dt,
                musicActive,
                directedAtmosphereEnergy,
                preset,
            );
            const burstAmt = this.burstSmoother.tick(audioUniforms.beat, dt);
            const coverRipplePreset = preset === 'emily';
            const rippleCount = this.rippleField.tick(
                dt,
                elapsed,
                audioUniforms.bass,
                smartAtmosphereEnabled && coverRipplePreset && (this.tuning?.enableBassRipples ?? true),
                !musicActive,
            );
            const bloomEnabled = this.tuning?.enableBloomParticles ?? false;
            const bloomStrength = bloomEnabled
                ? (this.tuning?.bloomStrength ?? 0.62) * (smartAtmosphereEnabled ? 1 : 0.38)
                : 0;
            uniforms.uBloomStrength.value = bloomStrength;
            if (this.bloomPoints) {
                this.bloomPoints.visible = !quantumCubeActive && bloomStrength > 0.01;
            }
            if (this.coverPoints) this.coverPoints.visible = !quantumCubeActive;
            uniforms.uRippleCount.value = rippleCount;
            uniforms.uTime.value = elapsed;
            uniforms.uSpeed.value = (smartAtmosphereEnabled ? 0.85 + intensity * 0.35 : 0.34 + intensity * 0.18) * presetProfile.speedMul;
            uniforms.uEdgeEnabled.value = preset === 'emily' ? 0 : 1;
            uniforms.uCoverWarp.value = preset === 'emily' ? 0.38 : 1;
            uniforms.uIntensity.value = intensity;
            uniforms.uCoverRes.value = this.resolveCoverResolutionUniform();
            uniforms.uBass.value = audioUniforms.bass;
            uniforms.uMid.value = audioUniforms.mid;
            uniforms.uTreble.value = audioUniforms.treble;
            uniforms.uBeat.value = audioUniforms.beat;
            uniforms.uEnergy.value = audioUniforms.energy;
            uniforms.uBurstAmt.value = burstAmt;
            uniforms.uPointScale.value = presetProfile.pointScale;
            this.vinylSpin = (this.vinylSpin + dt * (0.40 + audioUniforms.bass * 0.09) * uniforms.uSpeed.value) % (Math.PI * 2);
            uniforms.uVinylSpin.value = this.vinylSpin;
            if (this.interactivePointer.active) {
                uniforms.uMouseXY.value.set(this.interactivePointer.x, this.interactivePointer.y);
                uniforms.uMouseActive.value = 1;
            } else {
                uniforms.uMouseXY.value.set(pointerX * 2.1, pointerY * 2.1);
                uniforms.uMouseActive.value = pointerActive ? 1 : 0;
            }
            uniforms.uParticleDim.value = smartAtmosphereEnabled ? 1 : 0.68;
            this.updateQuantumCubePass(elapsed, audioUniforms, quantumCubeActive);

            const bassPulse = smartAtmosphereEnabled
                ? audioUniforms.bass * 0.55 + audioUniforms.beat * 0.35
                : audioUniforms.bass * 0.12;
            this.applyInteractiveCamera(
                this.latestInputs.camera,
                bassPulse,
                presetProfile,
                preset,
                smartAtmosphereEnabled
                    ? (this.tuning?.cinemaShake ?? 0.5) * cameraPunchStrength
                    : 0.06,
                directedAtmosphereEnergy,
                dt,
                audioUniforms.beat * cameraPunchStrength,
            );
        } else if (willTickLyrics || hasParticles) {
            this.applyInteractiveCamera(this.latestInputs.camera);
        }

        // Screen-lock after camera settles so orbit/cinema never clip lyrics.
        if (willTickLyrics) {
            this.syncLyricStageViewport();
            this.lyricStage.tick({
                ...this.latestLyricInputs,
                beatPulse: directedBeat,
                dt,
            });
        }

        const hasLyrics = this.lyricStageEnabled && this.lyricStage.hasContent();
        if (!hasParticles && !hasLyrics) return;

        this.renderer.autoClear = true;
        if (normalizeInteractive3dVisualPreset(this.tuning?.visualPreset) === 'quantumCube' && this.quantumMaterial) {
            this.renderer.render(this.quantumScene, this.quantumCamera);
            this.renderer.autoClear = false;
            this.renderer.clearDepth();
        }
        this.renderer.render(this.scene, this.camera);
        this.renderer.autoClear = true;
    }

    private resolveCoverResolutionUniform(): number {
        const grid = this.coverPoints?.geometry.userData.grid;
        if (typeof grid !== 'number') return 1;
        return Math.max(0.75, Math.min(1.55, grid / 118));
    }

    private updateQuantumCubePass(
        elapsed: number,
        audioUniforms: { bass: number; mid: number; treble: number; beat: number; energy: number },
        active: boolean,
    ) {
        if (!this.quantumMaterial) return;
        const uniforms = this.quantumMaterial.uniforms;
        uniforms.iTime.value = elapsed;
        uniforms.uBass.value = audioUniforms.bass;
        uniforms.uMid.value = audioUniforms.mid;
        uniforms.uTreble.value = audioUniforms.treble;
        uniforms.uBeat.value = audioUniforms.beat;
        uniforms.uEnergy.value = audioUniforms.energy;
        uniforms.uColorMixT.value = this.uniforms.uColorMixT.value;
        uniforms.uCoverTex.value = this.uniforms.uCoverTex.value;
        uniforms.uPrevCoverTex.value = this.uniforms.uPrevCoverTex.value;
        uniforms.uCamPos.value.set(
            1.3,
            -0.8 + audioUniforms.beat * 0.025,
            -1.6 + audioUniforms.bass * 0.025,
        );
        if (this.quantumMesh) this.quantumMesh.visible = active;
    }
}

export { CoverParticleRuntime as MineradioPlaybackRuntime };
