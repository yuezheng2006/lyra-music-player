import type { MineradioVisualPresetId } from '../../types';
import { normalizeInteractive3dVisualPreset } from '../../components/visualizer/geometric/mineradioVisualPresets';

// src/utils/visualizer/interactiveCoverDomMath.ts
// Pure layout helpers for the DOM/CSS interactive3d cover stage.

export type InteractiveCoverDomParticle = {
    id: number;
    left: number;
    top: number;
    size: number;
    opacity: number;
    depth: number;
};

export type InteractiveCoverDomPresetStyle = {
    preset: MineradioVisualPresetId;
    coverScale: number;
    coverRotateY: number;
    coverBlurPx: number;
    washOpacity: number;
    particleCount: number;
    spinSeconds: number;
};

/** Resolve visual style knobs for the DOM cover stage (all presets → emily atmosphere). */
export const resolveInteractiveCoverDomPresetStyle = (
    preset: unknown,
    qualityTier: 'high' | 'balanced' | 'lite' = 'balanced',
): InteractiveCoverDomPresetStyle => {
    // Legacy tunnel/galaxy ids normalize to emily; keep single soft style.
    const normalized = normalizeInteractive3dVisualPreset(preset);
    const particleBudget = qualityTier === 'high' ? 28 : qualityTier === 'lite' ? 10 : 18;
    return {
        preset: normalized,
        coverScale: 0.88,
        coverRotateY: 0,
        coverBlurPx: 0,
        washOpacity: 0.48,
        particleCount: Math.round(particleBudget * 0.55),
        spinSeconds: 0,
    };
};

/** Deterministic soft particles behind/around the cover card. */
export const buildInteractiveCoverDomParticles = (
    seed: string | number,
    count: number,
): InteractiveCoverDomParticle[] => {
    const safeCount = Math.max(0, Math.min(48, Math.floor(count)));
    let state = hashSeed(seed);
    const particles: InteractiveCoverDomParticle[] = [];
    for (let i = 0; i < safeCount; i += 1) {
        state = nextRand(state);
        const left = 4 + (state % 9200) / 100;
        state = nextRand(state);
        const top = 6 + (state % 8800) / 100;
        state = nextRand(state);
        const size = 2 + (state % 500) / 100;
        state = nextRand(state);
        const opacity = 0.12 + (state % 400) / 1000;
        state = nextRand(state);
        const depth = -120 + (state % 240);
        particles.push({ id: i, left, top, size, opacity, depth });
    }
    return particles;
};

const hashSeed = (seed: string | number): number => {
    const text = String(seed);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

const nextRand = (state: number): number => (Math.imul(state, 1664525) + 1013904223) >>> 0;
