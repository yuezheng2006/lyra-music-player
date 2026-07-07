import * as THREE from 'three';
import type { GeometricQualityTier } from '../geometricQuality';

// src/components/visualizer/geometric/webgl/buildCoverParticleGeometry.ts
// Builds a cover-sampling particle grid aligned with Mineradio density curve.

export const PLANE_SIZE = 4.8;

/** Mineradio: grid = round(118 * resolution), clamped 88–183. */
export const coverParticleGridForResolution = (resolution: number): number => {
    const clamped = Math.max(0.75, Math.min(1.55, resolution));
    let grid = Math.round(118 * clamped);
    grid = Math.max(88, Math.min(183, grid));
    return grid % 2 === 0 ? grid + 1 : grid;
};

export const coverParticleGridForQualityTier = (tier: GeometricQualityTier): number => {
    switch (tier) {
        case 'high':
            return coverParticleGridForResolution(1.55);
        case 'balanced':
            return coverParticleGridForResolution(1.15);
        case 'lite':
            return coverParticleGridForResolution(0.85);
        default:
            return coverParticleGridForResolution(1.0);
    }
};

export const buildCoverParticleGeometry = (grid: number): THREE.BufferGeometry => {
    const count = grid * grid;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const rand = new Float32Array(count);
    const texelStep = 1 / grid;

    for (let i = 0; i < count; i += 1) {
        const gx = i % grid;
        const gy = Math.floor(i / grid);
        const u = (gx + 0.5) * texelStep;
        const v = (gy + 0.5) * texelStep;
        const px = gx / (grid - 1);
        const py = gy / (grid - 1);
        positions[i * 3] = (px - 0.5) * PLANE_SIZE;
        positions[i * 3 + 1] = (py - 0.5) * PLANE_SIZE;
        positions[i * 3 + 2] = 0;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
        rand[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    geometry.userData.grid = grid;
    geometry.userData.count = count;
    return geometry;
};
