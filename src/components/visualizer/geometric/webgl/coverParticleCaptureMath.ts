// src/components/visualizer/geometric/webgl/coverParticleCaptureMath.ts
// Deterministic helpers for capture/test rendering of cover particles.

/** Stable pseudo-random in [0, 1) from an integer-ish seed. */
export const seeded = (seed: number): number => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
};

/** Map capture progress onto loop elapsed seconds with [0, 1) wrap. */
export const resolveCaptureElapsed = (progress: number, loopSeconds: number): number => {
    const wrapped = ((progress % 1) + 1) % 1;
    return wrapped * loopSeconds;
};

export type DampedSpringState = {
    value: number;
    velocity: number;
};

/** Implicit damped spring step used to smooth discrete capture targets. */
export const dampedSpring = (
    value: number,
    velocity: number,
    target: number,
    frequency: number,
    dt: number,
): DampedSpringState => {
    const step = Math.max(1 / 240, Math.min(0.05, dt));
    const omega = frequency * Math.PI * 2;
    const f = 1 + 2 * step * omega;
    const oo = omega * omega;
    const hoo = step * oo;
    const hhoo = step * hoo;
    const inverse = 1 / (f + hhoo);
    return {
        value: (f * value + step * velocity + hhoo * target) * inverse,
        velocity: (velocity + hoo * (target - value)) * inverse,
    };
};

export type CoverParticleCaptureSnapshot = {
    elapsed: number;
    uTime: number;
    hasRenderer: boolean;
    canvasWidth: number;
    canvasHeight: number;
};

/** True when Playwright sets the localStorage flag, or when running Vitest (MODE=test). */
export const shouldEnableCoverParticleCaptureBridge = (): boolean => {
    try {
        if (
            typeof localStorage !== 'undefined'
            && localStorage.getItem('cover_particle_capture_bridge') === '1'
        ) {
            return true;
        }
    } catch {
        // Ignore storage access errors (private mode / SSR).
    }
    return import.meta.env.MODE === 'test';
};
