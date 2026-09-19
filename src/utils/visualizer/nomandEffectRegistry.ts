import type { NomandBackgroundEffect, NomandBuiltinEffect } from '../../types/nomandBackground';

// src/utils/visualizer/nomandEffectRegistry.ts
// Pluggable Nomand effect ids. Built-ins are listed here; plugins call registerNomandEffectId.

export const NOMAND_BUILTIN_EFFECTS: readonly NomandBuiltinEffect[] = [
    'dithering',
    'fluted-glass',
    'paper-texture',
    'halftone-dots',
    // lens-distortion ships in @paper-design/shaders-react >= 0.0.80; 0.0.77 has no export.
];

const extraEffects = new Set<string>();

export const registerNomandEffectId = (effect: string) => {
    const id = effect.trim();
    if (!id) return;
    extraEffects.add(id);
};

export const listNomandEffectIds = (): NomandBackgroundEffect[] => [
    ...NOMAND_BUILTIN_EFFECTS,
    ...extraEffects,
];

export const isNomandEffectId = (value: unknown): value is NomandBackgroundEffect => (
    typeof value === 'string'
    && (NOMAND_BUILTIN_EFFECTS.includes(value as NomandBuiltinEffect) || extraEffects.has(value))
);
