// src/components/visualizer/geometric/webgl/prepareCoverParticleTexture.ts
// Normalizes cover artwork into square canvases before it is sampled by WebGL particles.

export const COVER_PARTICLE_TEXTURE_SIZE = 512;

const readCanvasSourceSize = (
    source: CanvasImageSource,
    axis: 'width' | 'height',
    fallback: number,
): number => {
    const naturalAxis = axis === 'width' ? 'naturalWidth' : 'naturalHeight';
    const sourceRecord = source as Partial<Record<typeof axis | typeof naturalAxis, number>>;
    return Number(sourceRecord[naturalAxis] ?? sourceRecord[axis]) || fallback;
};

export const drawCoverToSquareCanvas = (
    source: CanvasImageSource,
    size = COVER_PARTICLE_TEXTURE_SIZE,
): HTMLCanvasElement | null => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const sourceWidth = readCanvasSourceSize(source, 'width', size);
    const sourceHeight = readCanvasSourceSize(source, 'height', size);
    const sourceSize = Math.min(sourceWidth, sourceHeight);
    const sx = Math.max(0, (sourceWidth - sourceSize) / 2);
    const sy = Math.max(0, (sourceHeight - sourceSize) / 2);

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, sx, sy, sourceSize, sourceSize, 0, 0, size, size);

    return canvas;
};
