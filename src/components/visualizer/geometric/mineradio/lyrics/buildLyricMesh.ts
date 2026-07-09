import * as THREE from 'three';
import type { Line } from '../../../../../types';
import { lyricThreeColor } from './lyricColorHelpers';
import { makeLyricMask } from './makeLyricMask';
import { getLyricSunBloomTexture, makeLyricShaderMaterial, type LyricPalette } from './lyricShaders';
import { resolveLyricStageFitScale } from './resolveLyricStageViewport';

// src/components/visualizer/geometric/mineradio/lyrics/buildLyricMesh.ts
// Builds a Mineradio-style WebGL lyric line group.

const DEFAULT_STAGE_WORLD_WIDTH = 4.8;
/** Glow / bloom extends slightly past glyph bounds — include in fit. */
const GLOW_OVERFLOW = 1.12;

export type BuildLyricMeshOptions = {
    /** Max world-space width the lyric plane may occupy on screen. */
    maxWorldWidth?: number;
};

export const buildLyricMesh = (
    text: string,
    renderer: THREE.WebGLRenderer,
    palette: LyricPalette,
    options: BuildLyricMeshOptions = {},
): THREE.Group => {
    const mask = makeLyricMask(text, renderer);
    const maxWorldWidth = Math.max(0.9, options.maxWorldWidth ?? DEFAULT_STAGE_WORLD_WIDTH);
    // Prefer filling the safe viewport width; shrink further if the glyph block is still wider.
    const worldW = Math.min(DEFAULT_STAGE_WORLD_WIDTH, maxWorldWidth);
    const worldH = worldW * (mask.height / mask.width);
    const textWorldW = worldW * (mask.textWidth / mask.width);
    const textWorldH = worldH * ((mask.textHeight || mask.fontSize) / mask.height);
    // Fit the full plane (not only glyph AABB) so transparent padding / bloom stay on-screen.
    const occupiedWorldW = Math.max(worldW, textWorldW) * GLOW_OVERFLOW;
    const fitScale = resolveLyricStageFitScale(occupiedWorldW, maxWorldWidth);

    const group = new THREE.Group();
    group.renderOrder = 42;
    // Parent LyricStageRuntime is camera-locked; keep mesh at local origin.
    group.position.set(0, 0, 0);
    group.scale.setScalar(0.9 * fitScale);
    group.userData.age = 0;
    group.userData.state = 'in';
    group.userData.lastLyricProgress = -1;
    group.userData.lyricText = text;
    group.userData.baseScale = 0.9;
    group.userData.fitScale = fitScale;
    group.userData.maxWorldWidth = maxWorldWidth;
    group.userData.occupiedWorldW = occupiedWorldW;

    const sunMat = new THREE.MeshBasicMaterial({
        map: getLyricSunBloomTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        color: lyricThreeColor(palette.highlight || palette.secondary, '#ffe7a6', 0.5),
    });
    const sun = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(worldW * 1.16, textWorldW * 1.18), worldH * 1.2, 1, 1),
        sunMat,
    );
    sun.renderOrder = 40;
    sun.position.set(0, 0.02, -0.03);
    group.add(sun);

    const readabilityMat = new THREE.MeshBasicMaterial({
        map: mask.texture,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        color: new THREE.Color(0, 0, 0),
    });
    const readability = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH, 1, 1), readabilityMat);
    readability.renderOrder = 42;
    readability.position.set(0, 0, -0.012);
    group.add(readability);

    const glowMat = new THREE.MeshBasicMaterial({
        map: mask.texture,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        color: lyricThreeColor(palette.secondary, '#9cffdf', 0.36),
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(textWorldW * 1.08, worldH * 1.08, 1, 1), glowMat);
    glow.renderOrder = 41;
    group.add(glow);

    const textMat = makeLyricShaderMaterial(mask, palette);
    const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH, 1, 1), textMat);
    textMesh.renderOrder = 43;
    group.add(textMesh);

    group.userData.lyric = {
        textMat,
        readabilityMat,
        glowMat,
        textWorldW,
        textWorldH,
        worldW,
        worldH,
    };
    updateLyricMeshProgress(group, 0);
    return group;
};

/** Re-apply viewport fit when the camera frustum / aspect changes. */
export const applyLyricMeshViewportFit = (
    mesh: THREE.Group,
    maxWorldWidth: number,
) => {
    const lyric = mesh.userData?.lyric;
    if (!lyric) return;
    const baseScale = typeof mesh.userData.baseScale === 'number' ? mesh.userData.baseScale : 0.9;
    const occupiedWorldW = typeof mesh.userData.occupiedWorldW === 'number'
        ? mesh.userData.occupiedWorldW
        : lyric.textWorldW * GLOW_OVERFLOW;
    const fitScale = resolveLyricStageFitScale(occupiedWorldW, maxWorldWidth);
    mesh.userData.fitScale = fitScale;
    mesh.userData.maxWorldWidth = maxWorldWidth;
    mesh.scale.setScalar(baseScale * fitScale);
};

export const updateLyricMeshProgress = (mesh: THREE.Group, progress: number) => {
    const lyric = mesh.userData?.lyric;
    if (!lyric?.textMat) return;
    const clamped = Math.max(0, Math.min(1, progress));
    lyric.textMat.uniforms.uProgress.value = clamped;
    mesh.userData.lastLyricProgress = clamped;
};

export const getLyricLineProgress = (
    line: Line,
    nextLine: Line | undefined,
    currentTimeSec: number,
): number => {
    const start = line.startTime ?? 0;
    const end = nextLine?.startTime ?? (start + Math.max(1.5, (line.endTime ?? start + 4) - start));
    const span = Math.max(0.75, end - start);
    const raw = Math.max(0, Math.min(1, (currentTimeSec - start) / span));
    return raw * raw * (3 - 2 * raw);
};

export const resolveActiveLyricLineIndex = (lines: Line[], currentTimeSec: number): number => {
    let index = -1;
    for (let i = 0; i < lines.length; i += 1) {
        if ((lines[i].startTime ?? 0) <= currentTimeSec + 0.05) index = i;
        else break;
    }
    return index;
};
