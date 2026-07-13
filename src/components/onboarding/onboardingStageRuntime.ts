import * as THREE from 'three';
import { createDotTexture } from '../visualizer/geometric/webgl/createDotTexture';
import {
    resolveOnboardingStageTheme,
    type OnboardingStageStep,
    type OnboardingStageTheme,
} from './onboardingStageTheme';

// src/components/onboarding/onboardingStageRuntime.ts
// Lightweight Three.js premiere stage for first-run onboarding only.

const PARTICLE_COUNT = 420;
const LERP = 0.045;

type LiveTheme = {
    ringHue: number;
    ringRadius: number;
    exposure: number;
    particleColor: THREE.Color;
};

/** Isolated WebGL stage used behind the onboarding glass panel. */
export class OnboardingStageRuntime {
    private renderer: THREE.WebGLRenderer | null = null;
    private scene: THREE.Scene | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private ring: THREE.Mesh | null = null;
    private ringOuter: THREE.Mesh | null = null;
    private points: THREE.Points | null = null;
    private particleTexture: THREE.CanvasTexture | null = null;
    private rafId = 0;
    private running = false;
    private failed = false;
    private reducedMotion = false;
    private startMs = 0;
    private container: HTMLElement | null = null;
    private onVisibility: (() => void) | null = null;
    private target: OnboardingStageTheme = resolveOnboardingStageTheme(1);
    private targetParticleColor = new THREE.Color(this.target.particleTint);
    private live: LiveTheme = {
        ringHue: this.target.ringHue,
        ringRadius: this.target.ringRadius,
        exposure: this.target.exposure,
        particleColor: new THREE.Color(this.target.particleTint),
    };

    mount(container: HTMLElement): void {
        if (this.renderer || this.failed) {
            return;
        }
        this.container = container;

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'low-power',
            });
        } catch {
            this.failed = true;
            return;
        }

        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
        camera.position.set(0, 0.15, 4.2);

        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(`hsl(${this.live.ringHue}, 35%, 72%)`),
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.02, 96), ringMat);
        ring.rotation.x = Math.PI * 0.42;
        scene.add(ring);

        const ringOuterMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(`hsl(${this.live.ringHue}, 28%, 58%)`),
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const ringOuter = new THREE.Mesh(new THREE.RingGeometry(1.28, 1.36, 96), ringOuterMat);
        ringOuter.rotation.x = Math.PI * 0.42;
        scene.add(ringOuter);

        const positions = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i += 1) {
            const r = 0.4 + Math.random() * 2.8;
            const theta = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * 2.2;
            positions[i * 3] = Math.cos(theta) * r;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(theta) * r * 0.65;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleTexture = createDotTexture();
        const pointsMat = new THREE.PointsMaterial({
            map: this.particleTexture,
            color: this.live.particleColor,
            size: 0.045,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, pointsMat);
        scene.add(points);

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.ring = ring;
        this.ringOuter = ringOuter;
        this.points = points;
        this.startMs = performance.now();

        this.onVisibility = () => {
            if (document.hidden) {
                this.stop();
            } else if (this.container) {
                this.start();
            }
        };
        document.addEventListener('visibilitychange', this.onVisibility);

        const rect = container.getBoundingClientRect();
        this.resize(rect.width || container.clientWidth, rect.height || container.clientHeight);
    }

    setStep(step: OnboardingStageStep): void {
        this.target = resolveOnboardingStageTheme(step);
        this.targetParticleColor.set(this.target.particleTint);
    }

    setReducedMotion(enabled: boolean): void {
        this.reducedMotion = enabled;
        if (this.points) {
            this.points.visible = !enabled;
        }
    }

    start(): void {
        if (this.failed || this.running || !this.renderer) {
            return;
        }
        this.running = true;
        const tick = (now: number) => {
            if (!this.running) {
                return;
            }
            this.rafId = window.requestAnimationFrame(tick);
            this.draw(now);
        };
        this.rafId = window.requestAnimationFrame(tick);
    }

    stop(): void {
        this.running = false;
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    resize(width: number, height: number): void {
        if (!this.renderer || !this.camera || width <= 0 || height <= 0) {
            return;
        }
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    dispose(): void {
        this.stop();
        if (this.onVisibility) {
            document.removeEventListener('visibilitychange', this.onVisibility);
            this.onVisibility = null;
        }

        if (this.ring) {
            this.ring.geometry.dispose();
            (this.ring.material as THREE.Material).dispose();
            this.ring = null;
        }
        if (this.ringOuter) {
            this.ringOuter.geometry.dispose();
            (this.ringOuter.material as THREE.Material).dispose();
            this.ringOuter = null;
        }
        if (this.points) {
            this.points.geometry.dispose();
            (this.points.material as THREE.Material).dispose();
            this.points = null;
        }
        this.particleTexture?.dispose();
        this.particleTexture = null;

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
        }
        this.scene = null;
        this.camera = null;
        this.container = null;
    }

    get didFail(): boolean {
        return this.failed;
    }

    private draw(now: number): void {
        const renderer = this.renderer;
        const scene = this.scene;
        const camera = this.camera;
        if (!renderer || !scene || !camera) {
            return;
        }

        this.live.ringHue += (this.target.ringHue - this.live.ringHue) * LERP;
        this.live.ringRadius += (this.target.ringRadius - this.live.ringRadius) * LERP;
        this.live.exposure += (this.target.exposure - this.live.exposure) * LERP;
        this.live.particleColor.lerp(this.targetParticleColor, LERP);

        const t = (now - this.startMs) * 0.001;
        const orbit = this.reducedMotion ? 0 : t * 0.12;
        const radius = 4.15;
        camera.position.x = Math.sin(orbit) * 0.35;
        camera.position.y = 0.12 + Math.sin(orbit * 0.7) * 0.08;
        camera.position.z = radius;
        camera.lookAt(0, 0, 0);

        if (this.ring) {
            const scale = this.live.ringRadius;
            this.ring.scale.set(scale, scale, scale);
            const mat = this.ring.material as THREE.MeshBasicMaterial;
            mat.color.setHSL(this.live.ringHue / 360, 0.35, 0.72);
            mat.opacity = 0.42 + this.live.exposure * 0.18;
            if (!this.reducedMotion) {
                this.ring.rotation.z = t * 0.08;
            }
        }
        if (this.ringOuter) {
            const scale = this.live.ringRadius * 1.05;
            this.ringOuter.scale.set(scale, scale, scale);
            const mat = this.ringOuter.material as THREE.MeshBasicMaterial;
            mat.color.setHSL(this.live.ringHue / 360, 0.28, 0.55);
            if (!this.reducedMotion) {
                this.ringOuter.rotation.z = -t * 0.05;
            }
        }
        if (this.points && !this.reducedMotion) {
            this.points.rotation.y = t * 0.04;
            const mat = this.points.material as THREE.PointsMaterial;
            mat.color.copy(this.live.particleColor);
            mat.opacity = 0.4 + this.live.exposure * 0.18;
        }

        renderer.render(scene, camera);
    }
}
