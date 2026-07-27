// src/utils/visualizer/coverParticleDissolveMath.ts
// Pure helpers for cover-change emissive dissolve (Codrops / emissive-dissolve style).

/** Edge half-width in noise space — wider = softer glowing rim. */
export const DISSOLVE_EDGE_WIDTH = 0.085;

/** Peak outward scatter at a full-hot edge sample. */
export const DISSOLVE_SCATTER_MAX = 0.28;

export type DissolveEdgeSample = {
    /** 0–1 glow strength at this particle. */
    edge: number;
    /** World-space scatter magnitude for displacement. */
    scatter: number;
};

/** Stable-ish 0–1 noise from UV + rand (mirrors GLSL hash/snoise role in tests). */
export const sampleDissolveNoise = (u: number, v: number, rand: number): number => {
    const x = Math.sin(u * 12.9898 + v * 78.233 + rand * 45.164) * 43758.5453;
    return x - Math.floor(x);
};

/** Edge glow when particle noise sits on the moving dissolve front. */
export const resolveDissolveEdge = (
    noise: number,
    dissolve: number,
    live: number,
    edgeWidth = DISSOLVE_EDGE_WIDTH,
): number => {
    if (live <= 0.001) return 0;
    const w = Math.max(0.001, edgeWidth);
    const dist = Math.abs(noise - dissolve);
    const edge = 1 - Math.min(1, dist / w);
    return Math.max(0, edge) * Math.max(0, Math.min(1, live));
};

/** Scatter + edge sample for a particle during cover dissolve. */
export const sampleDissolveEdge = (input: {
    noise: number;
    dissolve: number;
    live: number;
    burstAmt?: number;
    edgeWidth?: number;
}): DissolveEdgeSample => {
    const edge = resolveDissolveEdge(
        input.noise,
        input.dissolve,
        input.live,
        input.edgeWidth,
    );
    const burst = Math.max(0, Math.min(1, input.burstAmt ?? 0));
    const scatter = edge * (DISSOLVE_SCATTER_MAX + burst * 0.22);
    return { edge, scatter };
};

/** Keep dissolve live flag on while the color-mix tween is in flight. */
export const resolveDissolveLive = (mix: number, tweening: boolean): number => {
    if (!tweening) return 0;
    return mix >= 1 ? 0 : 1;
};
