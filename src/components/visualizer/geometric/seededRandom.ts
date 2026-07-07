// src/components/visualizer/geometric/seededRandom.ts
// Deterministic PRNG for geometric layout generation.

export const createSeededRandom = (seed: string | number = 'default') => {
    let state = 2166136261;
    const input = String(seed);
    for (let i = 0; i < input.length; i += 1) {
        state ^= input.charCodeAt(i);
        state = Math.imul(state, 16777619);
    }
    if (state === 0) state = 3187917;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
};
