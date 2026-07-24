import { describe, expect, it } from 'vitest';
import { resolveAtmosphereBackgroundColor } from '@/utils/theme/resolveAtmosphereBackgroundColor';

// test/unit/theme/resolveAtmosphereBackgroundColor.test.ts
// Cover/chrome atmosphere and AI lyric theme must stay dual-owned.

describe('resolveAtmosphereBackgroundColor', () => {
    const chrome = '#09090b';
    const aiBg = '#1a0a12';
    const customBg = '#102030';

    it('uses chrome atmosphere for default theme source', () => {
        expect(resolveAtmosphereBackgroundColor({
            bgMode: 'default',
            chromeBackgroundColor: chrome,
            themeBackgroundColor: aiBg,
        })).toBe(chrome);
    });

    it('keeps chrome atmosphere when AI lyric theme is active (dual mode)', () => {
        expect(resolveAtmosphereBackgroundColor({
            bgMode: 'ai',
            chromeBackgroundColor: chrome,
            themeBackgroundColor: aiBg,
        })).toBe(chrome);
    });

    it('lets custom theme own the atmosphere wash', () => {
        expect(resolveAtmosphereBackgroundColor({
            bgMode: 'custom',
            chromeBackgroundColor: chrome,
            themeBackgroundColor: customBg,
        })).toBe(customBg);
    });

    it('prefers cover shell canvas wash when provided for default/ai', () => {
        expect(resolveAtmosphereBackgroundColor({
            bgMode: 'ai',
            chromeBackgroundColor: chrome,
            themeBackgroundColor: aiBg,
            shellCanvasBackground: 'rgba(40, 20, 30, 0.9)',
        })).toBe('rgba(40, 20, 30, 0.9)');
    });

    it('does not override custom theme with shell canvas', () => {
        expect(resolveAtmosphereBackgroundColor({
            bgMode: 'custom',
            chromeBackgroundColor: chrome,
            themeBackgroundColor: customBg,
            shellCanvasBackground: 'rgba(40, 20, 30, 0.9)',
        })).toBe(customBg);
    });
});
