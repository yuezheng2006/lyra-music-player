import * as THREE from 'three';
import type { Line } from '../../../../../types';
import { lyricThreeColor } from './lyricColorHelpers';
import { makeLyricMask } from './makeLyricMask';
import { getLyricSunBloomTexture, makeLyricShaderMaterial, type LyricPalette } from './lyricShaders';

// src/components/visualizer/geometric/mineradio/lyrics/buildLyricMesh.ts
// Builds a Mineradio-style WebGL lyric line group.

export const buildLyricMesh = (
    text: string,
    renderer: THREE.WebGLRenderer,
    palette: LyricPalette,
): THREE.Group => {
    const mask = makeLyricMask(text, renderer);
    const worldW = 6.1;
    const worldH = worldW * (mask.height / mask.width);
    const textWorldW = worldW * (mask.textWidth / mask.width);
    const textWorldH = worldH * ((mask.textHeight || mask.fontSize) / mask.height);

    const group = new THREE.Group();
    group.renderOrder = 42;
    group.position.set((Math.random() - 0.5) * 0.08, 0.2, 1.46);
    group.scale.setScalar(0.96);
    group.userData.age = 0;
    group.userData.state = 'in';
    group.userData.lastLyricProgress = -1;

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
