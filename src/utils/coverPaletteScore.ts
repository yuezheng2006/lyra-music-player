// src/utils/coverPaletteScore.ts
// Rank cover palette swatches by area share with a moderate-saturation preference.

export type CoverPaletteCandidate = {
    hex: string;
    r: number;
    g: number;
    b: number;
    proportion: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getHsvSaturation = (r: number, g: number, b: number) => {
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    if (max <= 0) {
        return 0;
    }
    return (max - min) / max;
};

const getRelativeLuminance = (r: number, g: number, b: number) => {
    const linearize = (channel: number) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    return (
        0.2126 * linearize(r)
        + 0.7152 * linearize(g)
        + 0.0722 * linearize(b)
    );
};

/** Soft peak: 1 inside [low, high], falls toward floor outside. */
const softPeak = (value: number, low: number, high: number, falloff: number, floor: number) => {
    if (value >= low && value <= high) {
        return 1;
    }

    const distance = value < low ? low - value : value - high;
    return floor + (1 - floor) * clamp01(1 - distance / falloff);
};

/** Score one palette color: proportion × moderate-sat × usable lightness. */
export const scoreCoverPaletteColor = (candidate: CoverPaletteCandidate): number => {
    const proportion = clamp01(candidate.proportion);
    const saturation = getHsvSaturation(candidate.r, candidate.g, candidate.b);
    const lightness = getRelativeLuminance(candidate.r, candidate.g, candidate.b);

    // Prefer mid saturation (~0.35–0.55); punish neon accents and near-gray equally softly.
    const satFactor = softPeak(saturation, 0.35, 0.55, 0.45, 0.18);
    // Prefer readable mid tones; pure black / white lose weight.
    const lightFactor = softPeak(lightness, 0.2, 0.75, 0.28, 0.2);

    return proportion * satFactor * lightFactor;
};

/** Sort palette candidates by score and return the top `count` hex colors. */
export const rankCoverPalette = (
    candidates: CoverPaletteCandidate[],
    count: number,
): string[] => {
    if (count <= 0 || candidates.length === 0) {
        return [];
    }

    return [...candidates]
        .sort((a, b) => scoreCoverPaletteColor(b) - scoreCoverPaletteColor(a))
        .slice(0, count)
        .map((candidate) => candidate.hex);
};
