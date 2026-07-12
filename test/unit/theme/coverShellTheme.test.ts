import { describe, expect, it } from 'vitest';
import { createCoverShellTheme } from '@/utils/coverShellTheme';

// test/unit/theme/coverShellTheme.test.ts
// Covers deterministic shell tokens and safe no-cover fallbacks.

describe('createCoverShellTheme', () => {
    it('derives a high-brightness canvas with deeper sidebar and dock layers', () => {
        const theme = createCoverShellTheme(['#d946ef'], false);

        expect(theme.surface).toBe('rgba(144, 54, 167, 1)');
        expect(theme.canvas).toContain('rgba(217, 70, 239, 0.42)');
        expect(theme.stageAtmosphere).toContain('rgba(217, 70, 239, 0.48)');
        expect(theme.stageAtmosphere).not.toContain('rgba(144, 54, 167, 0.9)');
        expect(theme.sidebarGlass).toBe('rgba(108, 47, 132, 0.94)');
        expect(theme.dockGlass).toBe('rgba(127, 51, 151, 0.88)');
        expect(theme.surface).not.toBe('rgba(9, 9, 11, 1)');
        expect(theme.text).toBe('#fafafa');
    });

    it('falls back to a readable daylight shell without cover colors', () => {
        const theme = createCoverShellTheme([], true);

        expect(theme.surface).toBe('#f5f5f4');
        expect(theme.text).toBe('#171717');
        expect(theme.mutedText).toBe('rgba(23, 23, 23, 0.62)');
    });
});
