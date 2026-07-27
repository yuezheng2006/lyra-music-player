// src/utils/visualizer/soraStarfieldMath.ts
// Pure helpers for the Sora (星空) layered starfield.

export type SoraStarLayer = 'far' | 'mid' | 'near';

/** Distinct stars beat a grainy dust field — keep count moderate, size contrast high. */
export const SORA_STAR_COUNT = 720;

/** Split the index buffer into depth layers (far is the majority). */
export const resolveSoraStarLayer = (index: number, count = SORA_STAR_COUNT): SoraStarLayer => {
    const t = index / Math.max(1, count);
    if (t < 0.58) return 'far';
    if (t < 0.88) return 'mid';
    return 'near';
};

/** Relative motion / size weight per layer — nearer stars drift faster and read larger. */
export const resolveSoraStarLayerWeights = (layer: SoraStarLayer): {
    speedMul: number;
    sizeMul: number;
    blinkMul: number;
    accentChance: number;
} => {
    switch (layer) {
        case 'far':
            return { speedMul: 0.55, sizeMul: 0.55, blinkMul: 0.65, accentChance: 0.04 };
        case 'mid':
            return { speedMul: 1.0, sizeMul: 1.0, blinkMul: 1.0, accentChance: 0.10 };
        case 'near':
            return { speedMul: 1.55, sizeMul: 1.85, blinkMul: 1.35, accentChance: 0.22 };
        default:
            return { speedMul: 1.0, sizeMul: 1.0, blinkMul: 1.0, accentChance: 0.08 };
    }
};
