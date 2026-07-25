// src/utils/visualizer/coverParticleTunnelMath.ts
// Pure helpers mirroring mineradioTunnel cylindrical helix / trail tuning.

export type TunnelSampleInput = {
    /** Circumferential UV.x in [0, 1]. */
    u: number;
    /** Axial UV.y in [0, 1] before flow scroll. */
    v: number;
    /** Shader time * speed. */
    t: number;
    bass?: number;
    mid?: number;
    intensity?: number;
};

export type TunnelSample = {
    angle: number;
    flow: number;
    zPos: number;
    radius: number;
    helixTwist: number;
    trail: number;
};

/** Helix twist along tube length (radians added to circumferential angle). */
export const resolveTunnelHelixTwist = (flow: number, mid = 0): number => (
    flow * (1.15 + Math.max(0, Math.min(1, mid)) * 0.55)
);

/** Tangential trail length driven by bass (speed-line feel). */
export const resolveTunnelTrail = (bass = 0, intensity = 1): number => (
    Math.max(0, Math.min(1, bass)) * 0.10 * Math.max(0.2, intensity) * 1.6
);

/** Sample tunnel angle / radius / z for a cover particle (TS mirror of GLSL). */
export const sampleTunnelParticle = (input: TunnelSampleInput): TunnelSample => {
    const bass = input.bass ?? 0;
    const mid = input.mid ?? 0;
    const K = (input.intensity ?? 1) * 1.6;
    const spin = input.t * 0.12;
    const flow = ((input.v - input.t * 0.08 * (1 + bass * 0.55)) % 1 + 1) % 1;
    const helixTwist = resolveTunnelHelixTwist(flow, mid);
    const angle = input.u * Math.PI * 2 + spin + helixTwist;
    const zPos = (flow - 0.5) * 9;
    const baseR = 2 - bass * 0.28 * K;
    const ripG = Math.sin(angle * 5 + zPos * 1.4 + input.t * 2.2) * 0.10 * (mid + (input.bass ?? 0)) * K;
    const radius = baseR + ripG;
    const trail = resolveTunnelTrail(bass, input.intensity ?? 1);
    return { angle, flow, zPos, radius, helixTwist, trail };
};
