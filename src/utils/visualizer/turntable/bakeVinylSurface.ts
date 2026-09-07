// src/utils/visualizer/turntable/bakeVinylSurface.ts
// Bake a static vinyl disc into RGBA bytes (grooves are rotationally symmetric).

import { sampleVinylSurface, type VinylLightDir, VINYL_SCENE_LIGHT } from './vinylSurfaceMath';

export type BakedVinylSurface = Readonly<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
}>;

export const bakeVinylSurfaceRgba = (
    size: number,
    light: VinylLightDir = VINYL_SCENE_LIGHT,
): BakedVinylSurface => {
    const dim = Math.max(8, Math.floor(size));
    const data = new Uint8ClampedArray(dim * dim * 4);

    for (let y = 0; y < dim; y += 1) {
        for (let x = 0; x < dim; x += 1) {
            const sample = sampleVinylSurface(x + 0.5, y + 0.5, dim, light);
            const i = (y * dim + x) * 4;
            data[i] = Math.round(sample.r * 255);
            data[i + 1] = Math.round(sample.g * 255);
            data[i + 2] = Math.round(sample.b * 255);
            data[i + 3] = Math.round(sample.a * 255);
        }
    }

    return { width: dim, height: dim, data };
};
