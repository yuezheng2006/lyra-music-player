import * as THREE from 'three';
import type { Line, Theme } from '../../../../../types';
import {
    buildLyricMesh,
    getLyricLineProgress,
    resolveActiveLyricLineIndex,
    updateLyricMeshProgress,
} from './buildLyricMesh';
import { disposeLyricMesh } from './disposeLyricMesh';
import type { LyricPalette } from './lyricShaders';

// src/components/visualizer/geometric/mineradio/lyrics/LyricStageRuntime.ts
// Mineradio stage lyric system: one WebGL line mesh with karaoke progress.

export type LyricStageTickInput = {
    lines: Line[];
    currentTimeSec: number;
    playing: boolean;
    showLyrics: boolean;
    beatPulse: number;
    palette: LyricPalette;
    dt: number;
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

    mount(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;
        if (this.group) return;
        this.group = new THREE.Group();
        this.group.renderOrder = 38;
        scene.add(this.group);
    }

    dispose() {
        this.clear();
        if (this.group) {
            this.group.parent?.remove(this.group);
            this.group = null;
        }
        this.renderer = null;
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

    private showLine(text: string, palette: LyricPalette) {
        if (!this.group || !this.renderer) return;
        if (this.current) {
            this.current.userData.state = 'out';
            this.current.userData.age = 0;
            this.outgoing.push(this.current);
            this.current = null;
        }
        this.currentText = text;
        const mesh = buildLyricMesh(text, this.renderer, palette);
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
