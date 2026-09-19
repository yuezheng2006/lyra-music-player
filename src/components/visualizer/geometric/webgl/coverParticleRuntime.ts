import * as THREE from 'three';
import type { AudioBands, Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import {
    buildCoverParticleGeometry,
} from './buildCoverParticleGeometry';
import {
    resolveCoverParticleGridForPreset,
} from '../../../../utils/performance/interactive3dFrameCostMath';
import {
    CoverParticleCinemaCamera,
} from './coverParticleCinemaCamera';
import { createCoverParticleMaterials, type CoverParticleUniforms } from './coverParticleMaterials';
import { createDotTexture, createEmptyColorTexture } from './createDotTexture';
import {
    CoverColorMixTween,
} from './coverColorMixTween';
import { CoverNumericTween } from './coverNumericTween';
import {
    resolveWebGLPresetIndex,
    shouldRenderMineradioWebGL,
} from './mineradioPresetMap';
import { subscribeGeometricCanvasFrame } from '../geometricCanvasRuntime';
import { CoverParticleAudioSmoother } from './coverParticleAudioUniforms';
import { CoverParticleBurstSmoother } from './coverParticleBurstSmoother';
import type { CoverParticlePresetRuntimeProfile } from './coverParticlePresetRuntime';
import { resolveCoverParticlePresetRuntime } from './coverParticlePresetRuntime';
import { CoverParticleRippleField } from './coverParticleRipples';
import {
    parseCssColorToCoverParticleRgb,
    resolveCoverParticleContrastLift,
} from '../../../../utils/visualizer/coverParticleContrastMath';
import {
    canMorphCoverParticlePresets,
    COVER_PARTICLE_MORPH_MS,
} from '../../../../utils/visualizer/coverParticleMorphMath';
import { shouldSkipCoverParticleFrameWhileYielded } from '../../../../utils/visualizer/coverParticleYieldFramePolicy';
import { resolveCoverParticleEffectiveFrameSkip } from '../../../../utils/visualizer/coverParticleFrameSkipMath';
import { LyricStageRuntime, type LyricStageTickInput } from '../mineradio/lyrics/LyricStageRuntime';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import {
    type CoverParticleCaptureSnapshot,
    shouldEnableCoverParticleCaptureBridge,
} from './coverParticleCaptureMath';
import { trackTelemetry } from '../../../../utils/telemetry/trackTelemetry';
import { applyCoverParticleInteractiveCamera } from './coverParticleCameraMath';
import { installCoverParticleInteractionListeners } from './coverParticleInteraction';
import { tickCoverParticleCoverFrame } from './coverParticleCoverTick';
import { CoverParticleCoverLoader } from './coverParticleCoverLoader';
import { resolveCoverParticlePresetModule } from './presets';

// src/components/visualizer/geometric/webgl/coverParticleRuntime.ts
// Three.js runtime orchestrator for cover particle WebGL (presets + effects).

const VIZ_FRAME_COST_TELEMETRY_INTERVAL_MS = 2000;

export type { CoverParticleCaptureSnapshot };

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
    /** Monet left-column end (0–1); biases framing into the visible right pane. */
    lyricColumnEndRatio?: number;
}

export type MineradioLyricRuntimeInputs = Omit<LyricStageTickInput, 'beatPulse' | 'dt'>;

const createCoverMaterial = (
    dotTexture: THREE.Texture,
    fallbackCoverTexture: THREE.Texture,
) => createCoverParticleMaterials(dotTexture, fallbackCoverTexture);

export class CoverParticleRuntime {
    private container: HTMLElement | null = null;

    private renderer: THREE.WebGLRenderer | null = null;

    private scene = new THREE.Scene();

    private camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);

    private dotTexture = createDotTexture();

    private fallbackCoverTexture = createEmptyColorTexture();

    private prevCoverTexture = createEmptyColorTexture();

    private edgeTexture: THREE.Texture | null = null;

    private colorMixTween = new CoverColorMixTween();

    private morphTween = new CoverNumericTween();

    private alphaTween = new CoverNumericTween();

    private depthTween = new CoverNumericTween();

    private aiBoostTween = new CoverNumericTween();

    private loadingTween = new CoverNumericTween();

    private coverMaterials = createCoverMaterial(this.dotTexture, this.fallbackCoverTexture);

    private uniforms: CoverParticleUniforms = this.coverMaterials.uniforms;

    private coverMaterial = this.coverMaterials.mainMaterial;

    private bloomMaterial = this.coverMaterials.bloomMaterial;

    private coverPoints: THREE.Points | null = null;

    private bloomPoints: THREE.Points | null = null;

    private coverTexture: THREE.Texture | null = null;

    private coverLoader: CoverParticleCoverLoader | null = null;

    private textureLoader = new THREE.TextureLoader();

    private mode: 'cover' | 'none' = 'none';

    private tuning: Interactive3dSceneTuning | undefined;

    private qualityProfile: GeometricQualityProfile | undefined;

    private coverUrl: string | null = null;

    private configurePaintRaf: number | null = null;

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

    private lastVizFrameTelemetryAt = 0;

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

    private forcedElapsed: number | null = null;

    private forcedDt: number | null = null;

    private lyricStage = new LyricStageRuntime();

    private rippleField = new CoverParticleRippleField();

    private contrastLift = 1;

    private lyricStageEnabled = true;

    private lyricImmersive = false;

    private lyricColumnEndRatio: number | undefined = undefined;

    private paneLookAtX = 0;

    private snapPaneLookAt = false;

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
        presetProfile: CoverParticlePresetRuntimeProfile = resolveCoverParticlePresetRuntime('emily'),
        preset: Interactive3dSceneTuning['visualPreset'] = 'emily',
        cinemaShake = 0.5,
        atmosphereEnergy = 0,
        dt = 0.016,
        beat = 0,
    ) {
        const presetModule = resolveCoverParticlePresetModule(preset);
        const cameraState = {
            camera: this.camera,
            coverPoints: this.coverPoints,
            bloomPoints: this.bloomPoints,
            cinemaCamera: this.cinemaCamera,
            mineradioOrbit: this.mineradioOrbit,
            userOrbitOffset: this.userOrbitOffset,
            particleRotation: this.particleRotation,
            particleSpinVelocity: this.particleSpinVelocity,
            paneLookAtX: this.paneLookAtX,
            snapPaneLookAt: this.snapPaneLookAt,
            lyricColumnEndRatio: this.lyricColumnEndRatio,
            pointerActive: this.latestInputs.pointerActive,
            pointerX: this.latestInputs.pointerX,
            pointerY: this.latestInputs.pointerY,
        };
        applyCoverParticleInteractiveCamera(cameraState, {
            snapshot,
            bassPulse,
            presetProfile,
            preset,
            orbitBaseline: presetModule.orbitBaseline,
            cinemaShake,
            atmosphereEnergy,
            dt,
            beat,
            lyricColumnEndRatioFromInputs: this.latestInputs.lyricColumnEndRatio,
        });
        this.paneLookAtX = cameraState.paneLookAtX;
        this.snapPaneLookAt = cameraState.snapPaneLookAt;
    }

    mount(container: HTMLElement) {
        this.container = container;
        const captureBridge = shouldEnableCoverParticleCaptureBridge();
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: Boolean((window as Window & { electron?: unknown }).electron)
                ? 'low-power'
                : 'high-performance',
            preserveDrawingBuffer: captureBridge,
        });
        this.renderer.setPixelRatio(1);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);
        if (captureBridge) {
            this.attachCaptureBridge(container);
        }
        const canvas = this.renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.touchAction = 'none';
        canvas.style.zIndex = '0';
        this.camera.position.set(0, 0, 6.6);
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(0, 0, 0);
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
        const self = this;
        this.interactionState = {
            get interactionDragging() { return self.interactionDragging; },
            set interactionDragging(value: boolean) { self.interactionDragging = value; },
            lastInteractionPointer: this.lastInteractionPointer,
            userOrbitOffset: this.userOrbitOffset,
            particleSpinVelocity: this.particleSpinVelocity,
            particleRotation: this.particleRotation,
            interactivePointer: this.interactivePointer,
            pointerRaycaster: this.pointerRaycaster,
            pointerNdc: this.pointerNdc,
            pointerPlane: this.pointerPlane,
            pointerPlanePoint: this.pointerPlanePoint,
            pointerPlaneNormal: this.pointerPlaneNormal,
            pointerWorldHit: this.pointerWorldHit,
            pointerLocalHit: this.pointerLocalHit,
            pointerQuaternion: this.pointerQuaternion,
        };
        this.removeInteractionListeners = installCoverParticleInteractionListeners({
            container,
            camera: this.camera,
            getCoverPoints: () => self.coverPoints,
            rendererDomElement: this.renderer.domElement,
            state: this.interactionState,
        });
    }

    private interactionState: import('./coverParticleInteraction').CoverParticleInteractionState | null = null;

    dispose() {
        this.coverLoader?.dispose();
        this.coverLoader = null;
        if (this.configurePaintRaf != null) {
            cancelAnimationFrame(this.configurePaintRaf);
            this.configurePaintRaf = null;
        }
        this.frameUnsubscribe?.();
        this.frameUnsubscribe = null;
        this.colorMixTween.cancel();
        this.morphTween.cancel();
        this.uniforms.uDissolveLive.value = 0;
        this.uniforms.uDissolve.value = 1;
        this.uniforms.uMorphLive.value = 0;
        this.uniforms.uMorphT.value = 1;
        this.alphaTween.cancel();
        this.depthTween.cancel();
        this.aiBoostTween.cancel();
        this.loadingTween.cancel();
        this.inputProvider = null;
        this.removeInteractionListeners?.();
        this.removeInteractionListeners = null;
        this.detachCaptureBridge();
        this.coverPoints?.geometry.dispose();
        this.coverMaterial.dispose();
        this.bloomMaterial.dispose();
        this.coverTexture?.dispose();
        this.edgeTexture?.dispose();
        this.fallbackCoverTexture.dispose();
        this.prevCoverTexture.dispose();
        this.dotTexture.dispose();
        this.rippleField.dispose();
        this.lyricStage.dispose();
        this.renderer?.dispose();
        this.renderer?.domElement.remove();
        this.container = null;
    }

    /** Capture/test seam: render one frame at a fixed elapsed (Playwright / export). */
    renderAt(options: {
        elapsed: number;
        inputs?: Partial<CoverParticleRuntimeInputs>;
    }): CoverParticleCaptureSnapshot {
        if (options.inputs) {
            this.latestInputs = { ...this.latestInputs, ...options.inputs };
        }
        this.forcedElapsed = options.elapsed;
        this.forcedDt = 1 / 30;
        this.renderFrame();
        this.forcedElapsed = null;
        this.forcedDt = null;
        return {
            elapsed: options.elapsed,
            uTime: this.uniforms.uTime.value as number,
            hasRenderer: Boolean(this.renderer),
            canvasWidth: this.renderer?.domElement.width ?? 0,
            canvasHeight: this.renderer?.domElement.height ?? 0,
        };
    }

    private attachCaptureBridge(container: HTMLElement) {
        container.setAttribute('data-capture-bridge', '1');
        const host = container as HTMLElement & {
            __coverParticleCapture?: {
                renderAt: CoverParticleRuntime['renderAt'];
            };
        };
        host.__coverParticleCapture = {
            renderAt: (options) => this.renderAt(options),
        };
    }

    private detachCaptureBridge() {
        if (!this.container) return;
        this.container.removeAttribute('data-capture-bridge');
        const host = this.container as HTMLElement & {
            __coverParticleCapture?: unknown;
        };
        delete host.__coverParticleCapture;
    }

    resize(width: number, height: number) {
        if (!this.renderer || width <= 0 || height <= 0) return;
        const profileCap = this.qualityProfile?.devicePixelRatioCap ?? 1;
        const electronCap = Boolean((window as Window & { electron?: unknown }).electron);
        const dpr = Math.min(
            window.devicePixelRatio || 1,
            electronCap ? Math.min(profileCap, 1) : profileCap,
        );
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        const pixel = this.renderer.getPixelRatio();
        this.uniforms.uPixel.value = pixel;
        this.syncLyricStageViewport();
    }

    /** Lock lyrics to the camera frustum. */
    private syncLyricStageViewport() {
        this.lyricStage.syncScreenLock(this.camera);
    }

    setShellBackgroundColor(cssColor: string | null | undefined) {
        const rgb = parseCssColorToCoverParticleRgb(cssColor);
        this.contrastLift = rgb ? resolveCoverParticleContrastLift(rgb) : 1;
    }

    configure(
        coverUrl: string | null | undefined,
        tuning: Interactive3dSceneTuning | undefined,
        qualityProfile: GeometricQualityProfile,
        shellBackgroundColor?: string | null,
    ) {
        this.tuning = tuning;
        this.qualityProfile = qualityProfile;
        this.coverUrl = coverUrl ?? null;
        if (shellBackgroundColor !== undefined) {
            this.setShellBackgroundColor(shellBackgroundColor);
        }
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
                const previousPreset = this.loadedVisualPreset;
                if (previousPreset && canMorphCoverParticlePresets(previousPreset, preset)) {
                    this.morphTween.cancel();
                    this.uniforms.uMorphFrom.value = resolveWebGLPresetIndex(previousPreset);
                    this.uniforms.uMorphTo.value = resolveWebGLPresetIndex(preset);
                    this.uniforms.uMorphLive.value = 1;
                    this.uniforms.uMorphT.value = 0;
                    this.morphTween.start(0, 1, COVER_PARTICLE_MORPH_MS, (value) => {
                        this.uniforms.uMorphT.value = value;
                        if (value >= 1) {
                            this.uniforms.uMorphLive.value = 0;
                        }
                    });
                } else {
                    this.uniforms.uMorphLive.value = 0;
                    this.uniforms.uMorphT.value = 1;
                }
                const presetBurst = preset === 'mineradioTunnel'
                    ? 0.32
                    : preset === 'mineradioOrbit'
                        ? 0.26
                        : preset === 'mineradioGalaxy'
                            ? 0.20
                        : 0.14;
                this.burstSmoother.trigger(presetBurst);
                this.loadedVisualPreset = preset;
            }
            this.uniforms.uPreset.value = resolveWebGLPresetIndex(preset);
            this.rebuildCoverGeometry(qualityProfile);
            if (!this.coverUrl) {
                this.ensureParticleAlphaVisible();
            }
            this.ensureCoverLoader().load(this.coverUrl);
            this.scheduleConfigurePaint();
        }
    }

    /** Defer post-configure paint so remounts stay off the GPU critical path. */
    private scheduleConfigurePaint() {
        if (this.configurePaintRaf != null) {
            cancelAnimationFrame(this.configurePaintRaf);
        }
        this.configurePaintRaf = requestAnimationFrame(() => {
            this.configurePaintRaf = null;
            if (!this.renderer) return;
            this.renderFrame();
        });
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

    setLyricColumnEndRatio(ratio: number | undefined, options?: { snap?: boolean }) {
        this.lyricColumnEndRatio = ratio;
        if (options?.snap) {
            this.snapPaneLookAt = true;
        }
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
        this.frameUnsubscribe = subscribeGeometricCanvasFrame(({ hidden, frameIndex }) => {
            if (hidden) return;
            if (this.inputProvider) {
                this.latestInputs = this.inputProvider();
            }
            if (shouldSkipCoverParticleFrameWhileYielded({
                paused: this.latestInputs.paused,
                morphLive: this.uniforms.uMorphLive.value > 0.5,
            })) {
                return;
            }
            const effectiveSkip = resolveCoverParticleEffectiveFrameSkip({
                profileFrameSkip: this.qualityProfile?.frameSkip ?? 1,
                isElectron: Boolean((window as Window & { electron?: unknown }).electron),
                devicePixelRatio: window.devicePixelRatio || 1,
                musicActive: this.latestInputs.musicActive,
            });
            const skipParticles = effectiveSkip > 1 && frameIndex % effectiveSkip !== 0;
            this.renderFrame({ skipParticles });
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

    private rebuildCoverGeometry(profile: GeometricQualityProfile) {
        if (this.mode !== 'cover') return;
        const preset = normalizeInteractive3dVisualPreset(this.tuning?.visualPreset);
        const grid = resolveCoverParticleGridForPreset(preset, profile.tier);
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

    private ensureCoverLoader(): CoverParticleCoverLoader {
        if (this.coverLoader) return this.coverLoader;
        const self = this;
        this.coverLoader = new CoverParticleCoverLoader({
            get container() { return self.container; },
            uniforms: this.uniforms,
            textureLoader: this.textureLoader,
            prevCoverTexture: this.prevCoverTexture,
            colorMixTween: this.colorMixTween,
            loadingTween: this.loadingTween,
            burstSmoother: this.burstSmoother,
            getCoverTexture: () => self.coverTexture,
            setCoverTexture: (texture) => { self.coverTexture = texture; },
            getEdgeTexture: () => self.edgeTexture,
            setEdgeTexture: (texture) => { self.edgeTexture = texture; },
            getTuning: () => self.tuning,
            getQualityTier: () => self.qualityProfile?.tier ?? 'balanced',
            setCoverDepthState: (depthTo, aiTo, durationMs) => self.setCoverDepthState(depthTo, aiTo, durationMs),
            ensureParticleAlphaVisible: () => self.ensureParticleAlphaVisible(),
            renderFrame: () => self.renderFrame(),
        });
        return this.coverLoader;
    }

    private ensureParticleAlphaVisible() {
        if (this.hasRevealedParticles) return;
        this.hasRevealedParticles = true;
        this.alphaTween.start(this.uniforms.uAlpha.value || 0, 1.0, 920, (alpha) => {
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

    private renderFrame(options?: { skipParticles?: boolean }) {
        if (!this.renderer || !this.container) return;
        const skipParticles = Boolean(options?.skipParticles);

        const { audioBands, beat, atmosphereEnergy, smartAtmosphereEnabled = true, musicActive, pointerX, pointerY, pointerActive, paused } = this.latestInputs;
        const baseIntensity = this.tuning?.rhythmIntensity ?? 0.85;
        const atmosphereSensitivity = this.tuning?.atmosphereSensitivity ?? 1;
        const cameraPunchStrength = this.tuning?.cameraPunchStrength ?? 1;
        const intensity = (smartAtmosphereEnabled ? baseIntensity : baseIntensity * 0.34) * atmosphereSensitivity;
        const directedBeat = smartAtmosphereEnabled ? beat * atmosphereSensitivity : 0;
        const directedAtmosphereEnergy = smartAtmosphereEnabled
            ? (atmosphereEnergy ?? 0) * atmosphereSensitivity
            : 0;
        const elapsed = this.forcedElapsed ?? this.clock.getElapsedTime();
        const dt = this.forcedDt ?? Math.min(this.clock.getDelta(), 0.05);

        if (this.lyricInputProvider) {
            this.latestLyricInputs = this.lyricInputProvider();
        }

        const hasParticles = this.mode !== 'none';
        // Lyrics may still need a frame even when particles are off.
        const willTickLyrics = this.lyricStageEnabled;

        if (skipParticles && !willTickLyrics) {
            return;
        }

        if (this.mode === 'cover' && !skipParticles) {
            const tick = tickCoverParticleCoverFrame({
                uniforms: this.uniforms,
                tuning: this.tuning,
                qualityProfile: this.qualityProfile,
                audioSmoother: this.audioSmoother,
                burstSmoother: this.burstSmoother,
                rippleField: this.rippleField,
                bloomPoints: this.bloomPoints,
                coverPoints: this.coverPoints,
                audioBands,
                directedBeat,
                intensity,
                dt,
                elapsed,
                musicActive,
                directedAtmosphereEnergy,
                smartAtmosphereEnabled,
                vinylSpin: this.vinylSpin,
                coverResolution: this.resolveCoverResolutionUniform(),
                contrastLift: this.contrastLift,
                pointerX,
                pointerY,
                pointerActive,
                interactivePointer: this.interactivePointer,
            });
            this.vinylSpin = tick.vinylSpin;

            const bassPulse = smartAtmosphereEnabled
                ? tick.audioUniforms.bass * 0.55 + tick.audioUniforms.beat * 0.35
                : tick.audioUniforms.bass * 0.12;
            this.applyInteractiveCamera(
                this.latestInputs.camera,
                bassPulse,
                tick.presetProfile,
                tick.presetModule.id,
                smartAtmosphereEnabled
                    ? (this.tuning?.cinemaShake ?? 0.5) * cameraPunchStrength
                    : 0.06,
                directedAtmosphereEnergy,
                dt,
                tick.audioUniforms.beat * cameraPunchStrength,
            );
        } else if (willTickLyrics || hasParticles) {
            this.applyInteractiveCamera(this.latestInputs.camera);
        }

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
        const renderStarted = performance.now();
        this.renderer.render(this.scene, this.camera);
        this.renderer.autoClear = true;
        const renderMs = performance.now() - renderStarted;
        if (renderStarted - this.lastVizFrameTelemetryAt >= VIZ_FRAME_COST_TELEMETRY_INTERVAL_MS) {
            this.lastVizFrameTelemetryAt = renderStarted;
            trackTelemetry('viz.frame_cost', {
                level: renderMs >= 12 ? 'warn' : 'debug',
                durMs: renderMs,
                data: {
                    preset: normalizeInteractive3dVisualPreset(this.tuning?.visualPreset),
                    hasParticles,
                    hasLyrics,
                },
            });
        }
    }

    private resolveCoverResolutionUniform(): number {
        const grid = this.coverPoints?.geometry.userData.grid;
        if (typeof grid !== 'number') return 1;
        // Match coverParticleGridForResolution clamp (0.55–1.55).
        return Math.max(0.55, Math.min(1.55, grid / 118));
    }

}

export { CoverParticleRuntime as MineradioPlaybackRuntime };
