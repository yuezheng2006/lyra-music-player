import { describe, expect, it } from 'vitest';
import {
    rankCoverPalette,
    scoreCoverPaletteColor,
    type CoverPaletteCandidate,
} from '@/utils/coverPaletteScore';

// test/unit/theme/coverPaletteScore.test.ts
// Verifies area + moderate-saturation ranking for cover palette colors.

const candidate = (
    hex: string,
    rgb: [number, number, number],
    proportion: number,
): CoverPaletteCandidate => ({
    hex,
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
    proportion,
});

describe('scoreCoverPaletteColor', () => {
    it('prefers a larger moderately saturated area over a neon accent', () => {
        const neonCenter = candidate('#ffe600', [255, 230, 0], 0.12);
        const balancedField = candidate('#5a7a6a', [90, 122, 106], 0.34);

        expect(scoreCoverPaletteColor(balancedField))
            .toBeGreaterThan(scoreCoverPaletteColor(neonCenter));
    });

    it('still ranks a low-saturation color by proportion when everything is muted', () => {
        const majorMuted = candidate('#6b6b6b', [107, 107, 107], 0.5);
        const minorMuted = candidate('#808080', [128, 128, 128], 0.1);

        expect(scoreCoverPaletteColor(majorMuted))
            .toBeGreaterThan(scoreCoverPaletteColor(minorMuted));
    });
});

describe('rankCoverPalette', () => {
    it('returns the highest-scoring colors as hex in score order', () => {
        const palette = [
            candidate('#ffe600', [255, 230, 0], 0.12),
            candidate('#5a7a6a', [90, 122, 106], 0.34),
            candidate('#3d5a80', [61, 90, 128], 0.22),
            candidate('#111111', [17, 17, 17], 0.18),
        ];

        const ranked = rankCoverPalette(palette, 3);

        expect(ranked).toHaveLength(3);
        expect(ranked[0]).toBe('#5a7a6a');
        expect(ranked.every((hex) => /^#[0-9a-f]{6}$/i.test(hex))).toBe(true);
    });

    it('returns an empty list when count is zero or palette is empty', () => {
        expect(rankCoverPalette([], 5)).toEqual([]);
        expect(rankCoverPalette([candidate('#abcdef', [171, 205, 239], 1)], 0)).toEqual([]);
    });
});
