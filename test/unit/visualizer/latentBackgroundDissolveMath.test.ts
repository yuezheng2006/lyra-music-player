import { describe, expect, it } from 'vitest';
import {
    LATENT_DISSOLVE_GRID_H,
    LATENT_DISSOLVE_GRID_W,
    paintLatentDissolveFrame,
    parseLatentDissolveAccentRgb,
    resolveDissolveEdge,
    resolveDissolveLive,
} from '@/utils/visualizer/latentBackgroundDissolveMath';

describe('latentBackgroundDissolveMath', () => {
    it('parses accent colors for the dissolve rim', () => {
        expect(parseLatentDissolveAccentRgb('#0f8')).toEqual([0, 255, 136]);
        expect(parseLatentDissolveAccentRgb('#112233')).toEqual([17, 34, 51]);
        expect(parseLatentDissolveAccentRgb('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
    });

    it('paints only the live dissolve edge into ImageData', () => {
        const data = new Uint8ClampedArray(LATENT_DISSOLVE_GRID_W * LATENT_DISSOLVE_GRID_H * 4);
        paintLatentDissolveFrame({
            data,
            width: LATENT_DISSOLVE_GRID_W,
            height: LATENT_DISSOLVE_GRID_H,
            dissolve: 0.5,
            live: 1,
            accent: [255, 0, 128],
        });
        let lit = 0;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) lit += 1;
        }
        expect(lit).toBeGreaterThan(20);
        expect(lit).toBeLessThan(LATENT_DISSOLVE_GRID_W * LATENT_DISSOLVE_GRID_H);

        paintLatentDissolveFrame({
            data,
            width: LATENT_DISSOLVE_GRID_W,
            height: LATENT_DISSOLVE_GRID_H,
            dissolve: 0.5,
            live: 0,
            accent: [255, 0, 128],
        });
        expect(data.every((v) => v === 0)).toBe(true);
        expect(resolveDissolveLive(0.3, true)).toBe(1);
        expect(resolveDissolveEdge(0.5, 0.5, 1)).toBeGreaterThan(0.9);
    });
});
