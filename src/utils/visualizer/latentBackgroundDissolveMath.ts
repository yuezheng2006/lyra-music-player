import {
    DISSOLVE_EDGE_WIDTH,
    resolveDissolveEdge,
    resolveDissolveLive,
    sampleDissolveNoise,
} from './coverParticleDissolveMath';

// src/utils/visualizer/latentBackgroundDissolveMath.ts
// Cover-change dissolve helpers for the latent (隐现) compositing overlay.

/** Low-res grid for the canvas dissolve pass (CSS-scaled to full viewport). */
export const LATENT_DISSOLVE_GRID_W = 96;
export const LATENT_DISSOLVE_GRID_H = 54;

/** Cover-change dissolve duration for latent overlay. */
export const LATENT_DISSOLVE_MS = 680;

export {
    DISSOLVE_EDGE_WIDTH,
    resolveDissolveEdge,
    resolveDissolveLive,
    sampleDissolveNoise,
};

/** Parse #rgb/#rrggbb (or rgb()) into RGB 0–255 for canvas fills. */
export const parseLatentDissolveAccentRgb = (
    cssColor: string | null | undefined,
): [number, number, number] => {
    if (!cssColor) return [80, 180, 255];
    const hex = cssColor.trim();
    const short = /^#([0-9a-f]{3})$/i.exec(hex);
    if (short) {
        const [r, g, b] = short[1].split('');
        return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
    }
    const long = /^#([0-9a-f]{6})$/i.exec(hex);
    if (long) {
        const n = long[1];
        return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
    }
    const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(hex);
    if (rgb) {
        return [
            Math.round(Number(rgb[1])),
            Math.round(Number(rgb[2])),
            Math.round(Number(rgb[3])),
        ];
    }
    return [80, 180, 255];
};

/**
 * Paint one dissolve frame into ImageData (mutates data).
 * Only edge pixels are lit — cheap soft-light overlay over Paper shaders.
 */
export const paintLatentDissolveFrame = (input: {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    dissolve: number;
    live: number;
    accent: readonly [number, number, number];
    timeSeed?: number;
}): void => {
    const { data, width, height, dissolve, live, accent } = input;
    if (live <= 0.001) {
        data.fill(0);
        return;
    }
    const seed = input.timeSeed ?? 0;
    const [ar, ag, ab] = accent;
    for (let y = 0; y < height; y += 1) {
        const v = (y + 0.5) / height;
        for (let x = 0; x < width; x += 1) {
            const u = (x + 0.5) / width;
            const noise = sampleDissolveNoise(u * 3.1, v * 3.1, seed + u * 0.17 + v * 0.31);
            const edge = resolveDissolveEdge(noise, dissolve, live);
            const i = (y * width + x) * 4;
            if (edge <= 0.001) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 0;
                continue;
            }
            const a = Math.round(edge * 220);
            data[i] = ar;
            data[i + 1] = ag;
            data[i + 2] = ab;
            data[i + 3] = a;
        }
    }
};
