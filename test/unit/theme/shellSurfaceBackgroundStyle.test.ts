import { describe, expect, it } from 'vitest';
import { resolveShellSurfaceBackgroundStyle } from '@/components/app/home/homeSurfaceStyles';

// test/unit/theme/shellSurfaceBackgroundStyle.test.ts

describe('resolveShellSurfaceBackgroundStyle', () => {
    it('uses cover shell CSS vars instead of static --bg-color', () => {
        const style = resolveShellSurfaceBackgroundStyle();
        expect(style.backgroundColor).toBe('var(--shell-surface)');
        expect(style.backgroundImage).toBe('var(--shell-canvas)');
    expect(style.color).toBe('var(--content-text)');
});

describe('resolveContentTextColor', () => {
    it('stays daylight-stable and ignores cover palette', async () => {
        const { resolveContentTextColor, resolveContentMutedTextColor } = await import('@/components/app/home/homeSurfaceStyles');
        expect(resolveContentTextColor(false)).toBe('#fafafa');
        expect(resolveContentTextColor(true)).toBe('#171717');
        expect(resolveContentMutedTextColor(false)).toContain('250, 250, 250');
        expect(resolveContentMutedTextColor(true)).toContain('23, 23, 23');
    });
});
});
