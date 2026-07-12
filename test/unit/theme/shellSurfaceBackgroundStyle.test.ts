import { describe, expect, it } from 'vitest';
import { resolveShellSurfaceBackgroundStyle } from '@/components/app/home/homeSurfaceStyles';

// test/unit/theme/shellSurfaceBackgroundStyle.test.ts

describe('resolveShellSurfaceBackgroundStyle', () => {
    it('uses cover shell CSS vars instead of static --bg-color', () => {
        const style = resolveShellSurfaceBackgroundStyle();
        expect(style.backgroundColor).toBe('var(--shell-surface)');
        expect(style.backgroundImage).toBe('var(--shell-canvas)');
        expect(style.color).toBe('var(--shell-text)');
    });
});
