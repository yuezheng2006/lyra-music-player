import { describe, expect, it } from 'vitest';
import { buildAppStyle } from '@/components/app/presentation/buildAppStyle';
import type { Theme } from '@/types';

// test/unit/app/buildAppStyle.test.ts

const daylightTheme: Theme = {
    name: 'Daylight',
    backgroundColor: '#f5f5f4',
    primaryColor: '#1c1917',
    accentColor: '#ea580c',
    secondaryColor: '#44403c',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

const defaultTheme: Theme = {
    name: 'Midnight',
    backgroundColor: '#09090b',
    primaryColor: '#fafafa',
    accentColor: '#ffffff',
    secondaryColor: '#b8b8c2',
    fontStyle: 'sans',
    animationIntensity: 'normal',
};

const wildfireTheme: Theme = {
    name: 'Wildfire',
    backgroundColor: '#1a0505',
    primaryColor: '#ff2a1a',
    accentColor: '#ff0000',
    secondaryColor: '#ff4d00',
    fontStyle: 'serif',
    animationIntensity: 'chaotic',
};

describe('buildAppStyle', () => {
    it('keeps chrome text neutral when the active lyric theme is wildfire red', () => {
        const style = buildAppStyle({
            bgMode: 'default',
            isDaylight: false,
            theme: wildfireTheme,
            daylightTheme,
            defaultTheme,
        });

        expect(style['--text-primary']).toBe('#fafafa');
        expect(style['--text-secondary']).toBe('#b8b8c2');
        expect(style['--text-accent']).toBe('#ffffff');
        expect(style['--lyric-primary']).toBe('#ff2a1a');
        expect(style['--lyric-accent']).toBe('#ff0000');
    });

    it('uses daylight chrome text in daylight mode', () => {
        const style = buildAppStyle({
            bgMode: 'default',
            isDaylight: true,
            theme: wildfireTheme,
            daylightTheme,
            defaultTheme,
        });

        expect(style['--text-primary']).toBe('#1c1917');
        expect(style['--lyric-primary']).toBe('#ff2a1a');
    });
});
