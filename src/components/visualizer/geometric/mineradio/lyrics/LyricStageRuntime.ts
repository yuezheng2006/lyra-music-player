import * as THREE from 'three';
import type { Line, Theme } from '../../../../../types';
import {
    applyLyricMeshViewportFit,
    buildLyricMesh,
    getLyricLineProgress,
    resolveActiveLyricLineIndex,
    updateLyricMeshProgress,
} from './buildLyricMesh';
import { disposeLyricMesh } from './disposeLyricMesh';
import type { LyricPalette } from './lyricShaders';
import {
    LYRIC_STAGE_CAMERA_DISTANCE,
    LYRIC_STAGE_CAMERA_Y,
    LYRIC_STAGE_DEFAULT_EDGE_INSET,
    LYRIC_STAGE_DEFAULT_MARGIN,
    resolveLyricStageMaxWorldWidth,
} from './resolveLyricStageViewport';

// src/components/visualizer/geometric/mineradio/lyrics/LyricStageRuntime.ts
// Mineradio stage lyric system: screen-locked WebGL line mesh with karaoke progress.

export type LyricStageTickInput = {
    lines: Line[];
    currentTimeSec: number;
    playing: boolean;
    showLyrics: boolean;
    beatPulse: number;
    palette: LyricPalette;
    dt: number;
};

export type LyricStageCameraSnapshot = {
    aspect: number;
    fovDeg: number;
    /** World-space distance from camera to lyric plane. */
    cameraDistance: number;
    /** Usable fraction of frustum width after edge padding (optional). */
    margin?: number;
    /** Extra horizontal inset as a fraction of frustum width per side. */
    edgeInset?: number;
};

const buildPaletteFromTheme = (theme: Theme): LyricPalette => ({
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    highlight: theme.accentColor,
    glow: theme.accentColor,
});

const resolveLineText = (line: Line | undefined): string => {
    if (!line) return '';
    if (line.words?.length) {
        return line.words.map(word => word.text).join('');
    }
    return line.fullText ?? '';
};

export class LyricStageRuntime {
    private group: THREE.Group | null = null;

    private current: THREE.Group | null = null;

    private outgoing: THREE.Group[] = [];

    private currentIdx = -1;

    private currentText = '';

    private renderer: THREE.WebGLRenderer | null = null;

    private camera: THREE.PerspectiveCamera | null = null;

    private maxWorldWidth = 3.6;

    private lastViewportKey = '';

    /**
     * Mount lyrics as a camera child so orbit / cinema never push text off-screen.
     */
    mount(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera?: THREE.PerspectiveCamera) {
        this.renderer = renderer;
        this.camera = camera ?? null;
        if (this.group) {
            this.attachGroupToCamera();
            return;
        }
        this.group = new THREE.Group();
        this.group.name = 'lyric-stage';
        this.group.renderOrder = 38;
        this.attachGroupToCamera();
        // scene kept for API compatibility when camera is missing
        if (!this.camera) scene.add(this.group);
    }

    dispose() {
        this.clear();
        if (this.group) {
            this.group.parent?.remove(this.group);
            this.group = null;
        }
        this.renderer = null;
        this.camera = null;
    }

    hasContent(): boolean {
        return !!(this.current || this.outgoing.length);
    }

    clear() {
        disposeLyricMesh(this.current);
        this.current = null;
        this.currentIdx = -1;
        this.currentText = '';
        while (this.outgoing.length) disposeLyricMesh(this.outgoing.pop());
    }

    /** Update safe on-screen width from the live camera frustum. */
    setCameraViewport(snapshot: LyricStageCameraSnapshot) {
        const nextWidth = resolveLyricStageMaxWorldWidth({
            aspect: snapshot.aspect,
            fovDeg: snapshot.fovDeg,
            cameraDistance: snapshot.cameraDistance,
            margin: snapshot.margin,
            edgeInset: snapshot.edgeInset,
        });
        const key = `${snapshot.aspect.toFixed(3)}:${snapshot.fovDeg.toFixed(1)}:${snapshot.cameraDistance.toFixed(2)}:${(snapshot.margin ?? 0).toFixed(2)}:${(snapshot.edgeInset ?? 0).toFixed(2)}:${nextWidth.toFixed(3)}`;
        if (key === this.lastViewportKey) return;
        this.lastViewportKey = key;
        this.maxWorldWidth = nextWidth;
        if (this.current) applyLyricMeshViewportFit(this.current, nextWidth);
        this.outgoing.forEach(mesh => applyLyricMeshViewportFit(mesh, nextWidth));
    }

    /**
     * Keep the lyric plane centered in the current camera frustum.
     * Call once per frame before tick/render.
     */
    syncScreenLock(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        this.attachGroupToCamera();
        if (this.group) {
            this.group.position.set(0, LYRIC_STAGE_CAMERA_Y, -LYRIC_STAGE_CAMERA_DISTANCE);
            this.group.rotation.set(0, 0, 0);
            this.group.quaternion.identity();
        }
        // Size against a stable FOV so beat punch does not thrash scale; aspect stays live.
        this.setCameraViewport({
            aspect: Math.max(0.2, camera.aspect || 1),
            fovDeg: 45,
            cameraDistance: LYRIC_STAGE_CAMERA_DISTANCE,
            margin: LYRIC_STAGE_DEFAULT_MARGIN,
            edgeInset: LYRIC_STAGE_DEFAULT_EDGE_INSET,
        });
    }

    tick(input: LyricStageTickInput) {
        if (!this.group || !this.renderer) return;
        if (!input.showLyrics || !input.playing || !input.lines.length) {
            if (this.current) this.clear();
            return;
        }

        const activeIndex = resolveActiveLyricLineIndex(input.lines, input.currentTimeSec);
        if (activeIndex < 0) {
            if (this.current) this.clear();
            return;
        }

        const activeLine = input.lines[activeIndex];
        const lineText = resolveLineText(activeLine);
        if (!lineText) {
            if (this.current) this.clear();
            return;
        }

        if (activeIndex !== this.currentIdx || lineText !== this.currentText) {
            this.showLine(lineText, input.palette);
            this.currentIdx = activeIndex;
        }

        if (this.current) {
            const progress = getLyricLineProgress(
                activeLine,
                input.lines[activeIndex + 1],
                input.currentTimeSec,
            );
            updateLyricMeshProgress(this.current, progress);
            this.animateMeshes(input.beatPulse, input.dt);
        }
    }

    /** 从主题色构建默认歌词调色板。 */
    static paletteFromTheme(theme: Theme): LyricPalette {
        return buildPaletteFromTheme(theme);
    }

    private attachGroupToCamera() {
        if (!this.group || !this.camera) return;
        if (this.group.parent !== this.camera) {
            this.group.parent?.remove(this.group);
            this.camera.add(this.group);
        }
        this.group.position.set(0, LYRIC_STAGE_CAMERA_Y, -LYRIC_STAGE_CAMERA_DISTANCE);
        this.group.rotation.set(0, 0, 0);
    }

    private showLine(text: string, palette: LyricPalette) {
        if (!this.group || !this.renderer) return;
        if (this.current) {
            this.current.userData.state = 'out';
            this.current.userData.age = 0;
            this.outgoing.push(this.current);
            this.current = null;
        }
        this.currentText = text;
        const mesh = buildLyricMesh(text, this.renderer, palette, {
            maxWorldWidth: this.maxWorldWidth,
        });
        this.group.add(mesh);
        this.current = mesh;
    }

    private animateMeshes(beatPulse: number, dt: number) {
        const animateOne = (mesh: THREE.Group, outgoing: boolean) => {
            mesh.userData.age = (mesh.userData.age || 0) + dt;
            const lyric = mesh.userData.lyric;
            if (!lyric) return;
            const targetOpacity = outgoing ? 0 : 0.96;
            const ease = outgoing ? 0.34 : 0.16;
            lyric.textMat.uniforms.uOpacity.value += (
                targetOpacity - lyric.textMat.uniforms.uOpacity.value
            ) * ease;
            lyric.readabilityMat.opacity += (targetOpacity * 0.24 - lyric.readabilityMat.opacity) * ease;
            lyric.glowMat.opacity += ((0.16 + beatPulse * 0.12) - lyric.glowMat.opacity) * 0.12;
            lyric.textMat.uniforms.uSolar.value = Math.min(1.2, beatPulse * 0.85);
            if (outgoing && mesh.userData.age > 0.8) {
                disposeLyricMesh(mesh);
                const index = this.outgoing.indexOf(mesh);
                if (index >= 0) this.outgoing.splice(index, 1);
            }
        };

        if (this.current) animateOne(this.current, false);
        [...this.outgoing].forEach(mesh => animateOne(mesh, true));
    }
}
