// src/components/visualizer/geometric/webgl/buildCoverEdgeAndDepth.ts
// Heuristic cover edge/depth map for Emily silk 3D (R=depth G=edge B=fg A=lum).

export const COVER_EDGE_MAP_SIZE = 256;

export type CoverEdgeMapPixels = {
    width: number;
    height: number;
    data: Uint8ClampedArray;
};

const blurHorizontal = (
    source: Float32Array,
    target: Float32Array,
    width: number,
    height: number,
    radius: number,
) => {
    for (let y = 0; y < height; y += 1) {
        let sum = 0;
        for (let x = -radius; x <= radius; x += 1) {
            sum += source[y * width + Math.max(0, Math.min(width - 1, x))];
        }
        for (let x = 0; x < width; x += 1) {
            target[y * width + x] = sum / (2 * radius + 1);
            const xRight = Math.min(width - 1, x + radius + 1);
            const xLeft = Math.max(0, x - radius);
            sum += source[y * width + xRight] - source[y * width + xLeft];
        }
    }
};

const blurVertical = (
    source: Float32Array,
    target: Float32Array,
    width: number,
    height: number,
    radius: number,
) => {
    for (let x = 0; x < width; x += 1) {
        let sum = 0;
        for (let y = -radius; y <= radius; y += 1) {
            sum += source[Math.max(0, Math.min(height - 1, y)) * width + x];
        }
        for (let y = 0; y < height; y += 1) {
            target[y * width + x] = sum / (2 * radius + 1);
            const yDown = Math.min(height - 1, y + radius + 1);
            const yUp = Math.max(0, y - radius);
            sum += source[yDown * width + x] - source[yUp * width + x];
        }
    }
};

/** 从 RGBA 封面像素生成 256×256 边缘/深度图（可在 Node 单测）。 */
export const buildCoverEdgeAndDepthFromRgba = (
    src: Uint8ClampedArray,
    width = COVER_EDGE_MAP_SIZE,
    height = COVER_EDGE_MAP_SIZE,
): CoverEdgeMapPixels => {
    const count = width * height;
    const lum = new Float32Array(count);
    const blur = new Float32Array(count);
    const tmp = new Float32Array(count);
    const edge = new Float32Array(count);
    const depth = new Float32Array(count);
    const fg = new Float32Array(count);
    const out = new Uint8ClampedArray(count * 4);

    for (let i = 0; i < count; i += 1) {
        const di = i * 4;
        lum[i] = (src[di] * 0.299 + src[di + 1] * 0.587 + src[di + 2] * 0.114) / 255;
    }

    blurHorizontal(lum, tmp, width, height, 4);
    blurVertical(tmp, blur, width, height, 4);

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const gx = -blur[(y - 1) * width + (x - 1)] - 2 * blur[y * width + (x - 1)] - blur[(y + 1) * width + (x - 1)]
                + blur[(y - 1) * width + (x + 1)] + 2 * blur[y * width + (x + 1)] + blur[(y + 1) * width + (x + 1)];
            const gy = -blur[(y - 1) * width + (x - 1)] - 2 * blur[(y - 1) * width + x] - blur[(y - 1) * width + (x + 1)]
                + blur[(y + 1) * width + (x - 1)] + 2 * blur[(y + 1) * width + x] + blur[(y + 1) * width + (x + 1)];
            edge[y * width + x] = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 1.4);
        }
    }

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const i = y * width + x;
            const cx = (x / (width - 1) - 0.5) * 2;
            const cy = (y / (height - 1) - 0.5) * 2;
            const rr = Math.sqrt(cx * cx + cy * cy);
            const centerBias = 1 - Math.min(1, rr * 0.75);
            depth[i] = Math.min(1, blur[i] * 0.45 + centerBias * 0.55);
            fg[i] = Math.min(1, depth[i] * 0.6 + edge[i] * 0.5);
        }
    }

    for (let i = 0; i < count; i += 1) {
        const di = i * 4;
        out[di] = Math.round(depth[i] * 255);
        out[di + 1] = Math.round(edge[i] * 255);
        out[di + 2] = Math.round(fg[i] * 255);
        out[di + 3] = Math.round(lum[i] * 255);
    }

    return { width, height, data: out };
};

/** 浏览器端：从 ImageData 生成边缘/深度图 canvas。 */
export const buildCoverEdgeAndDepthCanvas = (imageData: ImageData): HTMLCanvasElement => {
    const map = buildCoverEdgeAndDepthFromRgba(imageData.data, imageData.width, imageData.height);
    const canvas = document.createElement('canvas');
    canvas.width = map.width;
    canvas.height = map.height;
    canvas.getContext('2d')?.putImageData(new ImageData(map.data, map.width, map.height), 0, 0);
    return canvas;
};

/** 浏览器端：从封面图源采样并生成边缘/深度 canvas。 */
export const buildCoverEdgeAndDepthFromSource = (
    source: CanvasImageSource,
    size = COVER_EDGE_MAP_SIZE,
): HTMLCanvasElement | null => {
    if (typeof document === 'undefined') return null;
    const normalized = document.createElement('canvas');
    normalized.width = size;
    normalized.height = size;
    const ctx = normalized.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, size, size);
    return buildCoverEdgeAndDepthCanvas(ctx.getImageData(0, 0, size, size));
};
