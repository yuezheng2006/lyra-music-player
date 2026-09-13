import { describe, expect, it } from 'vitest';
import { resolveFloatingDockGlassStyle } from '../../../src/utils/chrome/floatingPlayerDockGlass';

// test/unit/utils/floatingPlayerDockGlass.test.ts

describe('resolveFloatingDockGlassStyle', () => {
    it('uses a single live backdrop filter on the dock (no Tailwind blur class)', () => {
        const glass = resolveFloatingDockGlassStyle({
            performanceMode: 'high',
            effectiveTier: 'high',
            isDaylight: false,
        });
        expect(glass.tier).toBe('live');
        expect(glass.dockClassName).not.toMatch(/backdrop-blur/);
        expect(glass.dockStyle.backdropFilter).toContain('blur(24px)');
        expect(glass.popoverStyle.backdropFilter).toBe('none');
        expect(glass.popoverClassName).not.toMatch(/backdrop-blur/);
    });

    it('softens blur on balanced tier', () => {
        const glass = resolveFloatingDockGlassStyle({
            performanceMode: 'balanced',
            effectiveTier: 'balanced',
        });
        expect(glass.tier).toBe('soft');
        expect(glass.dockStyle.backdropFilter).toContain('blur(12px)');
        expect(glass.popoverStyle.backdropFilter).toBe('none');
    });

    it('disables backdrop-filter for lite and reduced motion', () => {
        expect(resolveFloatingDockGlassStyle({
            performanceMode: 'lite',
            effectiveTier: 'lite',
        }).tier).toBe('solid');
        expect(resolveFloatingDockGlassStyle({
            performanceMode: 'high',
            effectiveTier: 'high',
            reducedMotion: true,
        }).dockStyle.backdropFilter).toBe('none');
        expect(resolveFloatingDockGlassStyle({
            performanceMode: 'auto',
            effectiveTier: 'lite',
        }).tier).toBe('solid');
    });
});
