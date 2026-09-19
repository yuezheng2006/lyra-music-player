// src/utils/visualizer/coverAtmosphereBreathMath.ts
// Soft cover-atmosphere opacity from energy + analyser power (no beat-map engine).

/** Map analyser power + optional smart-atmosphere energy to cover opacity. */
export const resolveCoverAtmosphereBreathOpacity = (
    energy: number,
    audioPower: number,
    playing = true,
): number => {
    const energy01 = Math.min(1, Math.max(0, energy));
    const power01 = Math.min(1, Math.max(0, audioPower / 180));
    // Prefer audioPower so light atmosphere still breathes when smart atmosphere is off.
    const blend = Math.min(1, Math.max(0, energy01 * 0.3 + power01 * 0.7));
    const opacity = 0.58 + blend * 0.24;
    return playing ? opacity : Math.min(opacity, 0.68);
};

/** Dim overlay on a static cover so breath never retouches the expensive blur layer. */
export const resolveCoverAtmosphereWashOpacity = (coverOpacity: number): number => {
    const cover = Math.min(1, Math.max(0, coverOpacity));
    return Math.min(0.55, Math.max(0.12, 1 - cover));
};

export const COVER_ATMOSPHERE_BREATH_EPSILON = 0.012;
