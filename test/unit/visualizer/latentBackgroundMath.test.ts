import { describe, expect, it } from 'vitest';
import {
  resolveLatentBroadbandEnergy,
  resolveLatentCoverBrightness,
  resolveLatentOnsetPulse,
  resolveLatentReadableOverlayOpacity,
  resolveLatentShaderColors,
  resolveLatentShaderSpeed,
} from '@/utils/visualizer/latentBackgroundMath';

describe('latentBackgroundMath', () => {
  it('maps silent bands near zero and loud bands higher', () => {
    expect(resolveLatentBroadbandEnergy(0, 0, 0, 0, 0)).toBeCloseTo(0, 5);
    expect(resolveLatentBroadbandEnergy(255, 255, 255, 255, 255)).toBeGreaterThan(0.7);
  });

  it('pulses on energy rises and decays otherwise', () => {
    const rise = resolveLatentOnsetPulse(0.5, 0.1, 0);
    expect(rise).toBeGreaterThan(0.2);
    expect(resolveLatentOnsetPulse(0.1, 0.5, rise)).toBeLessThan(rise);
  });

  it('keeps paused shader speed as a fraction of base', () => {
    expect(resolveLatentShaderSpeed(1, 2, 1, true)).toBeCloseTo(0.12, 5);
  });

  it('uses theme wash colors for cover-theme source', () => {
    const colors = resolveLatentShaderColors(
      ['#ff0000', '#00ff00'],
      {
        backgroundColor: '#111111',
        primaryColor: '#abcdef',
        secondaryColor: '#fedcba',
        accentColor: '#123456',
      },
      'cover-theme',
    );
    expect(colors.ditheringBack).toBe('#111111');
    expect(colors.ditheringFront).toBe('#ff0000');
    expect(colors.mesh[4]).toBe('#111111');
  });

  it('boosts overlay wash for bright cover palettes', () => {
    const bright = resolveLatentCoverBrightness(['#f5f5f5', '#eeeeee']);
    const dark = resolveLatentCoverBrightness(['#111111', '#1a1a1a']);
    expect(bright).toBeGreaterThan(dark);
    expect(resolveLatentReadableOverlayOpacity(0.48, bright, true)).toBeGreaterThan(0.48);
    expect(resolveLatentReadableOverlayOpacity(0.48, dark, true)).toBeCloseTo(0.48, 5);
    expect(resolveLatentReadableOverlayOpacity(0.48, bright, false)).toBe(0);
  });
});
