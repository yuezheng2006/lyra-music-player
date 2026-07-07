// src/utils/atmosphere/math.ts
// Small numeric helpers shared by atmosphere analysis.

export const clamp01 = (value: number) => Math.max(0, Math.min(1, Number(value) || 0));

export const clampRange = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number(value) || 0));

export const follow = (
    current: number,
    next: number,
    dt: number,
    upTau: number,
    downTau: number,
) => {
    const tau = next > current ? upTau : downTau;
    return current + (next - current) * (1 - Math.exp(-dt / Math.max(0.001, tau)));
};

export const percentile = (values: Float32Array | number[], p: number, maxSamples = 16000) => {
    const len = values.length;
    if (!len) return 0.001;

    let sample: number[];
    if (len <= maxSamples) {
        sample = Array.from(values);
    } else {
        sample = new Array(maxSamples);
        const step = (len - 1) / (maxSamples - 1);
        for (let i = 0; i < maxSamples; i += 1) {
            sample[i] = values[Math.min(len - 1, Math.floor(i * step))] || 0;
        }
    }

    sample.sort((a, b) => a - b);
    return sample[Math.max(0, Math.min(sample.length - 1, Math.floor(sample.length * p)))] || 0.001;
};

export const median = (values: number[]) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    return sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0;
};
