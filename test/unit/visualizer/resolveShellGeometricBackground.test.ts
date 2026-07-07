import { describe, expect, it } from 'vitest';
import { resolveShellGeometricBackgroundDisabled } from '@/components/visualizer/resolveShellGeometricBackground';

describe('resolveShellGeometricBackgroundDisabled', () => {
    it('ignores mode-specific disable when interactive3d background is active', () => {
        expect(resolveShellGeometricBackgroundDisabled(false, 'interactive3d', true)).toBe(false);
    });

    it('still respects app-level disable for interactive3d', () => {
        expect(resolveShellGeometricBackgroundDisabled(true, 'interactive3d', false)).toBe(true);
    });

    it('keeps mode-specific disable for non-interactive3d backgrounds', () => {
        expect(resolveShellGeometricBackgroundDisabled(false, 'common', true)).toBe(true);
    });
});
