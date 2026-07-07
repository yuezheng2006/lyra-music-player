import * as THREE from 'three';
import type { PlaylistShelfItem, ShelfCardTransform, ShelfLayoutProfile } from './shelfTypes';
import { computeShelfCardTransform } from './shelfLayout';

// src/components/visualizer/geometric/shelf/playlistShelfRuntime.ts
// Three.js runtime drawing sidebar/stage playlist cards as textured planes.

interface CardMeshEntry {
    mesh: THREE.Mesh;
    texture: THREE.CanvasTexture;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
}

export interface PlaylistShelfRuntimeCallbacks {
    onCardSelect?: (index: number, item: PlaylistShelfItem) => void;
}

const CARD_WIDTH = 1.28;
const CARD_HEIGHT = 0.82;

/** 在 canvas 上绘制歌单卡片纹理。 */
const drawCardTexture = (
    ctx: CanvasRenderingContext2D,
    item: PlaylistShelfItem,
    transform: ShelfCardTransform,
    accentColor: string,
) => {
    const { canvas } = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgAlpha = transform.isCenter ? 0.78 : 0.62;
    ctx.fillStyle = `rgba(8, 10, 16, ${bgAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = transform.isCenter ? accentColor : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = transform.isCenter ? 6 : 3;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(item.title.slice(0, 14), 28, 96);

    if (item.subtitle) {
        ctx.fillStyle = 'rgba(255,255,255,0.58)';
        ctx.font = '28px sans-serif';
        ctx.fillText(item.subtitle.slice(0, 18), 28, 142);
    }

    if (item.trackCount != null) {
        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.font = '24px sans-serif';
        ctx.fillText(`${item.trackCount} tracks`, 28, canvas.height - 36);
    }
};

export class PlaylistShelfRuntime {
    private container: HTMLElement | null = null;

    private renderer: THREE.WebGLRenderer | null = null;

    private scene = new THREE.Scene();

    private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);

    private cardGroup = new THREE.Group();

    private raycaster = new THREE.Raycaster();

    private pointer = new THREE.Vector2();

    private items: PlaylistShelfItem[] = [];

    private selectedIndex = 0;

    private layoutProfile: ShelfLayoutProfile | null = null;

    private cardEntries: CardMeshEntry[] = [];

    private accentColor = '#8fb7ff';

    private callbacks: PlaylistShelfRuntimeCallbacks = {};

    private animationFrameId: number | null = null;

    mount(container: HTMLElement) {
        this.container = container;
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 0, 2.35);
        this.camera.lookAt(0, 0, 0);
        this.scene.add(this.cardGroup);

        this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
        this.startLoop();
        this.resize(container.clientWidth, container.clientHeight);
    }

    dispose() {
        if (this.animationFrameId != null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.renderer?.domElement.removeEventListener('pointerdown', this.handlePointerDown);
        this.clearCards();

        this.renderer?.dispose();
        if (this.renderer?.domElement.parentElement) {
            this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
        }

        this.renderer = null;
        this.container = null;
    }

    resize(width: number, height: number) {
        if (!this.renderer || width <= 0 || height <= 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    setCallbacks(callbacks: PlaylistShelfRuntimeCallbacks) {
        this.callbacks = callbacks;
    }

    setAccentColor(color: string) {
        this.accentColor = color;
    }

    setItems(items: PlaylistShelfItem[]) {
        this.items = items;
        if (this.selectedIndex >= items.length) {
            this.selectedIndex = Math.max(0, items.length - 1);
        }
        this.rebuildCards();
    }

    setSelectedIndex(index: number) {
        if (this.items.length === 0) {
            this.selectedIndex = 0;
            return;
        }
        this.selectedIndex = Math.max(0, Math.min(index, this.items.length - 1));
        this.updateCardTransforms();
    }

    getSelectedIndex() {
        return this.selectedIndex;
    }

    setLayoutProfile(profile: ShelfLayoutProfile) {
        this.layoutProfile = profile;
        this.updateCardTransforms();
    }

    private startLoop = () => {
        const tick = () => {
            this.animationFrameId = requestAnimationFrame(tick);
            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        tick();
    };

    private handlePointerDown = (event: PointerEvent) => {
        if (!this.container || !this.renderer || this.items.length === 0 || !this.layoutProfile) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intersects = this.raycaster.intersectObjects(this.cardEntries.map(entry => entry.mesh));
        const hit = intersects[0]?.object;
        if (!hit) return;

        const index = this.cardEntries.findIndex(entry => entry.mesh === hit);
        if (index < 0) return;

        this.selectedIndex = index;
        this.updateCardTransforms();
        const item = this.items[index];
        if (item) {
            this.callbacks.onCardSelect?.(index, item);
        }
    };

    private clearCards() {
        for (const entry of this.cardEntries) {
            this.cardGroup.remove(entry.mesh);
            entry.texture.dispose();
            entry.mesh.geometry.dispose();
            (entry.mesh.material as THREE.Material).dispose();
        }
        this.cardEntries = [];
    }

    private rebuildCards() {
        this.clearCards();
        if (!this.layoutProfile) return;

        for (const item of this.items) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 328;
            const context = canvas.getContext('2d');
            if (!context) continue;

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
            });
            const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 12;
            this.cardGroup.add(mesh);

            this.cardEntries.push({ mesh, texture, canvas, context: context as CanvasRenderingContext2D });
        }

        this.updateCardTransforms();
    }

    private updateCardTransforms() {
        if (!this.layoutProfile) return;

        this.cardEntries.forEach((entry, index) => {
            const item = this.items[index];
            if (!item) return;

            const transform = computeShelfCardTransform({
                mode: this.layoutProfile!.mode,
                profile: this.layoutProfile!,
                index,
                selectedIndex: this.selectedIndex,
                total: this.items.length,
            });

            drawCardTexture(entry.context, item, transform, this.accentColor);
            entry.texture.needsUpdate = true;

            entry.mesh.position.set(transform.x, transform.y, transform.z);
            entry.mesh.rotation.y = THREE.MathUtils.degToRad(transform.rotateY);
            entry.mesh.scale.setScalar(transform.scale);
            (entry.mesh.material as THREE.MeshBasicMaterial).opacity = transform.opacity;
        });
    }
}
