import { describe, expect, it } from 'vitest';
import {
    buildCoverEdgeAndDepthFromRgba,
    COVER_EDGE_MAP_SIZE,
} from '../../../src/components/visualizer/geometric/webgl/buildCoverEdgeAndDepth';

const samplePixel = (
    data: Uint8ClampedArray,
    width: number,
    x: number,
    y: number,
) => {
    const i = (y * width + x) * 4;
    return {
        depth: data[i] / 255,
        edge: data[i + 1] / 255,
        fg: data[i + 2] / 255,
        lum: data[i + 3] / 255,
    };
};

describe('buildCoverEdgeAndDepthFromRgba', () => {
    it('raises center depth bias on a bright center disc', () => {
        const size = COVER_EDGE_MAP_SIZE;
        const src = new Uint8ClampedArray(size * size * 4);
        const cx = size / 2;
        const cy = size / 2;

        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
                const i = (y * size + x) * 4;
                const dx = x - cx;
                const dy = y - cy;
                const inside = dx * dx + dy * dy < (size * 0.18) ** 2;
                const value = inside ? 240 : 20;
                src[i] = value;
                src[i + 1] = value;
                src[i + 2] = value;
                src[i + 3] = 255;
            }
        }

        const map = buildCoverEdgeAndDepthFromRgba(src, size, size);
        const center = samplePixel(map.data, size, cx, cy);
        const corner = samplePixel(map.data, size, 8, 8);

        expect(center.depth).toBeGreaterThan(corner.depth);
        expect(center.lum).toBeGreaterThan(corner.lum);
    });

    it('detects strong edges on a vertical contrast seam', () => {
        const size = COVER_EDGE_MAP_SIZE;
        const src = new Uint8ClampedArray(size * size * 4);

        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
                const i = (y * size + x) * 4;
                const value = x < size / 2 ? 20 : 230;
                src[i] = value;
                src[i + 1] = value;
                src[i + 2] = value;
                src[i + 3] = 255;
            }
        }

        const map = buildCoverEdgeAndDepthFromRgba(src, size, size);
        const seam = samplePixel(map.data, size, size / 2, size / 2);
        const flat = samplePixel(map.data, size, size / 4, size / 2);

        expect(seam.edge).toBeGreaterThan(flat.edge);
    });
});
