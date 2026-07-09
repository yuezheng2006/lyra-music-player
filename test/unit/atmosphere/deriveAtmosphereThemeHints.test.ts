import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERACTIVE3D_SCENE_TUNING, type DualTheme } from '../../../src/types';
import { applyAtmosphereThemeHintsToTuning } from '../../../src/utils/atmosphere/applyAtmosphereThemeHints';
import {
    deriveAtmosphereThemeHints,
    withDerivedAtmosphereHints,
} from '../../../src/utils/atmosphere/deriveAtmosphereThemeHints';

// test/unit/atmosphere/deriveAtmosphereThemeHints.test.ts

const baseTheme = {
    name: 'Test',
    backgroundColor: '#0b1220',
    primaryColor: '#f8fafc',
    accentColor: '#38bdf8',
    secondaryColor: '#94a3b8',
    fontStyle: 'sans' as const,
    animationIntensity: 'chaotic' as const,
};

describe('deriveAtmosphereThemeHints', () => {
    it('derives energetic hints for dark chaotic themes', () => {
        const dual: DualTheme = { light: baseTheme, dark: baseTheme };
        const hints = deriveAtmosphereThemeHints(dual);
        expect(hints.visualPreset).toBeTruthy();
        expect(hints.atmosphereSensitivity).toBeGreaterThan(0.8);
        expect(hints.cameraPunchStrength).toBeGreaterThan(0.8);
    });

    it('preserves explicit atmosphereHints on the dual theme', () => {
        const dual: DualTheme = {
            light: baseTheme,
            dark: baseTheme,
            atmosphereHints: {
                visualPreset: 'terrain',
                atmosphereSensitivity: 0.6,
            },
        };
        expect(deriveAtmosphereThemeHints(dual)).toMatchObject({
            visualPreset: 'emily',
            atmosphereSensitivity: 0.6,
        });
    });

    it('applies intensity hints onto interactive3d tuning without changing visualPreset', () => {
        const dual = withDerivedAtmosphereHints({ light: baseTheme, dark: baseTheme });
        const current = {
            ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
            visualPreset: 'terrain' as const,
        };
        const next = applyAtmosphereThemeHintsToTuning(current, dual.atmosphereHints);
        expect(next).not.toBeNull();
        expect(next?.visualPreset).toBe('emily');
        expect(next?.atmosphereSensitivity).toBeTypeOf('number');
        expect(next?.cameraPunchStrength).toBeTypeOf('number');
    });

    it('ignores theme-derived visualPreset when applying atmosphere hints', () => {
        const next = applyAtmosphereThemeHintsToTuning(
            {
                ...DEFAULT_INTERACTIVE3D_SCENE_TUNING,
                visualPreset: 'terrain',
            },
            {
                visualPreset: 'mineradioGalaxy',
                atmosphereSensitivity: 1.1,
            },
        );
        expect(next?.visualPreset).toBe('emily');
        expect(next?.atmosphereSensitivity).toBe(1.1);
    });
});
