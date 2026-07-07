// src/utils/atmosphere/beatMap/biquadFilter.ts
// Lightweight biquad helpers for offline energy filtering.

export type BiquadState = {
    b0: number;
    b1: number;
    b2: number;
    a1: number;
    a2: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
};

export const makeBiquad = (
    type: 'highpass' | 'lowpass',
    freq: number,
    q: number,
    sampleRate: number,
): BiquadState => {
    const clampedFreq = Math.max(8, Math.min(freq, sampleRate * 0.45));
    const w0 = 2 * Math.PI * clampedFreq / sampleRate;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const alpha = sin / (2 * (q || 0.707));
    let b0: number;
    let b1: number;
    let b2: number;
    if (type === 'highpass') {
        b0 = (1 + cos) * 0.5;
        b1 = -(1 + cos);
        b2 = (1 + cos) * 0.5;
    } else {
        b0 = (1 - cos) * 0.5;
        b1 = 1 - cos;
        b2 = (1 - cos) * 0.5;
    }
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;
    const inv = 1 / a0;
    return {
        b0: b0 * inv,
        b1: b1 * inv,
        b2: b2 * inv,
        a1: a1 * inv,
        a2: a2 * inv,
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 0,
    };
};

export const runBiquad = (state: BiquadState, input: number) => {
    const output = state.b0 * input + state.b1 * state.x1 + state.b2 * state.x2
        - state.a1 * state.y1 - state.a2 * state.y2;
    state.x2 = state.x1;
    state.x1 = input;
    state.y2 = state.y1;
    state.y1 = output;
    return output;
};
