import { describe, expect, it } from 'vitest';
import { resolveLyricActiveWordColor, resolveLyricInkFills } from '@/components/visualizer/lyricInk';

// test/unit/visualizer/lyricInk.test.ts
// One-hue lyric fills shared by classic / partita / dazibao / monet / fume.

describe('resolveLyricInkFills', () => {
    it('keeps sung and body on the same primary hue', () => {
        const ink = resolveLyricInkFills({
            primaryColor: '#ff006e',
            accentColor: '#ffffff',
            secondaryColor: '#71717a',
        });

        expect(ink.body).toBe('#ff006e');
        expect(ink.sung).toBe('#ff006e');
        expect(ink.unsung).toContain('255, 0, 110');
        expect(ink.inactive).toContain('255, 0, 110');
        expect(ink.meta).toBe('#71717a');
    });

    it('never uses accent white as the lyric body', () => {
        const ink = resolveLyricInkFills({
            primaryColor: '#fff000',
            accentColor: '#ffffff',
            secondaryColor: '#71717a',
        });

        expect(ink.sung).toBe('#fff000');
        expect(ink.sung).not.toBe('#ffffff');
        expect(ink.unsung).not.toContain('255, 255, 255');
    });
});

describe('resolveLyricActiveWordColor', () => {
    it('falls back to primary instead of accent', () => {
        expect(resolveLyricActiveWordColor('你好', {
            primaryColor: '#00ffff',
            wordColors: [],
        })).toBe('#00ffff');
    });
});
