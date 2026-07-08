import * as THREE from 'three';
import type { AudioBands, Interactive3dSceneTuning } from '../../../../types';
import type { GeometricQualityProfile } from '../geometricQuality';
import type { InteractiveCameraSnapshot } from '../interactiveCamera/interactiveCameraTypes';
import { orbitToCameraPosition } from '../interactiveCamera/interactiveCameraMath';
import {
    buildCoverParticleGeometry,
    coverParticleGridForQualityTier,
} from './buildCoverParticleGeometry';
import {
    applyCoverParticleCinemaOffset,
    CoverParticleCinemaCamera,
} from './coverParticleCinemaCamera';
import { createCoverParticleMaterials, type CoverParticleUniforms } from './coverParticleMaterials';
import { createDotTexture, createEmptyColorTexture } from './createDotTexture';
import { buildCoverEdgeAndDepthFromSource } from './buildCoverEdgeAndDepth';
import { CoverColorMixTween } from './coverColorMixTween';
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

    private coverMaterials = createCoverMaterial(this.dotTexture, this.fallbackCoverTexture);

    private uniforms: CoverParticleUniforms = this.coverMaterials.uniforms;

    private coverMaterial = this.coverMaterials.mainMaterial;

    private bloomMaterial = this.coverMaterials.bloomMaterial;

    private coverPoints: THREE.Points | null = null;

    private bloomPoints: THREE.Points | null = null;

    private coverTexture: THREE.Texture | null = null;

    private textureLoader = new THREE.TextureLoader();

    private mode: 'cover' | 'none' = 'none';

    private tuning: Interactive3dSceneTuning | undefined;

    private qualityProfile: GeometricQualityProfile | undefined;

    private coverUrl: string | null = null;

    private loadedCoverUrl: string | null = null;

    private audioSmoother = new CoverParticleAudioSmoother();

    private burstSmoother = new CoverParticleBurstSmoother();

    private cinemaCamera = new CoverParticleCinemaCamera();

    private loadedVisualPreset: Interactive3dSceneTuning['visualPreset'] | null = null;

    private frameUnsubscribe: (() => void) | null = null;

    private inputProvider: (() => CoverParticleRuntimeInputs) | null = null;

    private clock = new THREE.Clock();

    private lyricStage = new LyricStageRuntime();

    private rippleField = new CoverParticleRippleField();

    private lyricStageEnabled = true;

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

        syncRotation(0, 0);

        const baseZ = presetProfile.cameraZ - bassPulse * presetProfile.bassCameraPunch;
        const cinemaOffset = this.cinemaCamera.tick(dt, beat, cinemaShake, atmosphereEnergy);
        const cinematicPosition = applyCoverParticleCinemaOffset(baseZ, cinemaOffset);
        this.camera.fov = presetProfile.fov;
        this.camera.updateProjectionMatrix();

        if (!snapshot || snapshot.mode === 'auto') {
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
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        this.camera.position.set(0, 0, 5.2);
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(0, 0, 0);
        this.uniforms.uRippleTex.value = this.rippleField.texture;
        this.uniforms.uPrevCoverTex.value = this.prevCoverTexture;
        this.uniforms.uEdgeTex.value = this.fallbackCoverTexture;
        this.lyricStage.mount(this.scene, this.renderer);
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
    }

    dispose() {
        this.frameUnsubscribe?.();
        this.frameUnsubscribe = null;
        this.colorMixTween.cancel();
        this.inputProvider = null;
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

    resize(width: number, height: number) {
        if (!this.renderer || width <= 0 || height <= 0) return;
        const dpr = Math.min(window.devicePixelRatio || 1, this.qualityProfile?.devicePixelRatioCap ?? 1.25);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        const pixel = this.renderer.getPixelRatio();
        this.uniforms.uPixel.value = pixel;
    }

    configure(
        coverUrl: string | null | undefined,
        tuning: Interactive3dSceneTuning | undefined,
        qualityProfile: GeometricQualityProfile,
    ) {
        this.tuning = tuning;
        this.qualityProfile = qualityProfile;
        this.coverUrl = coverUrl ?? null;
        const preset = tuning?.visualPreset ?? 'emily';
        const enabled = tuning?.enableCoverParticles ?? true;
        const nextMode = !enabled || !shouldRenderMineradioWebGL(preset, enabled)
            ? 'none'
            : 'cover';

        if (nextMode !== this.mode) {
            this.switchMode(nextMode);
        }

        if (nextMode === 'cover') {
            if (this.loadedVisualPreset !== preset) {
                this.burstSmoother.trigger(preset === 'tunnel' ? 0.24 : 0.14);
                this.loadedVisualPreset = preset;
            }
            this.uniforms.uPreset.value = resolveWebGLPresetIndex(preset);
            this.rebuildCoverGeometry(qualityProfile);
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

    private rebuildCoverGeometry(profile: GeometricQualityProfile) {
        if (this.mode !== 'cover') return;
        const grid = coverParticleGridForQualityTier(profile.tier);
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

    private loadCoverTexture(url: string | null) {
        if (url === this.loadedCoverUrl) return;

        if (!url) {
            this.loadedCoverUrl = null;
            this.uniforms.uHasCover.value = 0;
            this.uniforms.uHasDepth.value = 0;
            return;
        }
        this.textureLoader.setCrossOrigin('anonymous');
        this.textureLoader.load(
            url,
            (texture) => {
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                this.loadedCoverUrl = url;

                if (this.coverTexture?.image) {
                    this.copyCoverImageToPrevious(this.coverTexture.image as CanvasImageSource);
                    this.colorMixTween.start((mix) => {
                        this.uniforms.uColorMixT.value = mix;
                    });
                } else {
                    this.uniforms.uColorMixT.value = 1;
                }

                this.coverTexture?.dispose();
                this.coverTexture = texture;
                this.uniforms.uCoverTex.value = texture;
                this.uniforms.uHasCover.value = 1;
                this.applyCoverEdgeFromImage(texture.image as CanvasImageSource);
                this.renderFrame();
            },
            undefined,
            () => {
                this.loadedCoverUrl = null;
                this.uniforms.uHasCover.value = 0;
                this.uniforms.uHasDepth.value = 0;
            },
        );
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
        this.uniforms.uHasDepth.value = 1;
        this.uniforms.uAiBoost.value = 1;
        this.uniforms.uDepth.value = 1;
        this.container?.setAttribute('data-cover-depth-ready', 'true');
    }

    private renderFrame() {
        if (!this.renderer || !this.container) return;

        const { audioBands, beat, atmosphereEnergy, smartAtmosphereEnabled = true, musicActive, pointerX, pointerY, pointerActive, paused } = this.latestInputs;
        const baseIntensity = this.tuning?.rhythmIntensity ?? 0.85;
        const intensity = smartAtmosphereEnabled ? baseIntensity : baseIntensity * 0.34;
        const directedBeat = smartAtmosphereEnabled ? beat : 0;
        const directedAtmosphereEnergy = smartAtmosphereEnabled ? (atmosphereEnergy ?? 0) : 0;
        const elapsed = this.clock.getElapsedTime();
        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.lyricInputProvider) {
            this.latestLyricInputs = this.lyricInputProvider();
        }
        if (this.lyricStageEnabled) {
            this.lyricStage.tick({
                ...this.latestLyricInputs,
                beatPulse: directedBeat,
                dt,
            });
        }

        const hasParticles = this.mode !== 'none';
        const hasLyrics = this.lyricStageEnabled && this.lyricStage.hasContent();
        if (!hasParticles && !hasLyrics) return;

        if (this.mode === 'cover') {
            const uniforms = this.uniforms;
            const preset = this.tuning?.visualPreset ?? 'emily';
            const presetProfile = resolveCoverParticlePresetRuntime(preset);
            const audioUniforms = this.audioSmoother.tick(
                audioBands,
                directedBeat,
                intensity,
                dt,
                musicActive,
                directedAtmosphereEnergy,
            );
            const burstAmt = this.burstSmoother.tick(audioUniforms.beat, dt);
            const emilyPreset = preset === 'emily';
            const rippleCount = this.rippleField.tick(
                dt,
                elapsed,
                audioUniforms.bass,
                smartAtmosphereEnabled && emilyPreset && (this.tuning?.enableBassRipples ?? true),
                !musicActive,
            );
            const bloomStrength = (this.tuning?.bloomStrength ?? 0.62) * (smartAtmosphereEnabled ? 1 : 0.38);
            uniforms.uBloomStrength.value = bloomStrength;
            if (this.bloomPoints) {
                this.bloomPoints.visible = bloomStrength > 0.01;
            }
            uniforms.uRippleCount.value = rippleCount;
            uniforms.uTime.value = elapsed;
            uniforms.uSpeed.value = (smartAtmosphereEnabled ? 0.85 + intensity * 0.35 : 0.34 + intensity * 0.18) * presetProfile.speedMul;
            uniforms.uIntensity.value = intensity;
            uniforms.uBass.value = audioUniforms.bass;
            uniforms.uMid.value = audioUniforms.mid;
            uniforms.uTreble.value = audioUniforms.treble;
            uniforms.uBeat.value = audioUniforms.beat;
            uniforms.uEnergy.value = audioUniforms.energy;
            uniforms.uBurstAmt.value = burstAmt;
            uniforms.uPointScale.value = presetProfile.pointScale;
            uniforms.uMouseXY.value.set(pointerX * 2.1, pointerY * 2.1);
            uniforms.uMouseActive.value = pointerActive ? 1 : 0;
            uniforms.uAlpha.value = smartAtmosphereEnabled ? 0.88 + bloomStrength * 0.22 : 0.58 + bloomStrength * 0.12;

            const bassPulse = smartAtmosphereEnabled
                ? audioUniforms.bass * 0.55 + audioUniforms.beat * 0.35
                : audioUniforms.bass * 0.12;
            this.applyInteractiveCamera(
                this.latestInputs.camera,
                bassPulse,
                presetProfile,
                smartAtmosphereEnabled ? (this.tuning?.cinemaShake ?? 0.5) : 0.06,
                directedAtmosphereEnergy,
                dt,
                audioUniforms.beat,
            );
        } else {
            this.applyInteractiveCamera(this.latestInputs.camera);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

export { CoverParticleRuntime as MineradioPlaybackRuntime };
