import { describe, expect, it } from 'vitest';
import {
  parseLyricEffectPackId,
  resolveLyricEffectPack,
} from '../../../src/utils/lyricEffectPacks';

// test/unit/utils/lyricEffectPacks.test.ts

describe('lyricEffectPacks', () => {
  it('parses known ids and falls back to none', () => {
    expect(parseLyricEffectPackId('yehuo')).toBe('yehuo');
    expect(parseLyricEffectPackId('nope')).toBe('none');
  });

  it('resolves yehuo echo and suggestion', () => {
    const pack = resolveLyricEffectPack('yehuo', 'strong');
    expect(pack.echo).toBe(true);
    expect(pack.echoScale).toBeGreaterThan(1);
    expect(pack.suggestion).toEqual({
      fontPresetId: 'yehuo-brush',
      colorPresetId: 'dazibao-red',
    });
  });

  it('scales glitch offset with intensity', () => {
    const subtle = resolveLyricEffectPack('glitch', 'subtle');
    const extreme = resolveLyricEffectPack('glitch', 'extreme');
    expect(extreme.glitchOffsetPx).toBeGreaterThan(subtle.glitchOffsetPx);
    expect(subtle.glitch).toBe(true);
  });

  it('keeps pack base presentation restrained (readable garnish)', () => {
    const yehuo = resolveLyricEffectPack('yehuo', 'extreme');
    const neon = resolveLyricEffectPack('neon', 'extreme');
    const glitch = resolveLyricEffectPack('glitch', 'extreme');
    expect(yehuo.echoScale).toBeLessThanOrEqual(1.12);
    expect(yehuo.echoOpacity).toBeLessThanOrEqual(0.28);
    expect(neon.glowBoost).toBeLessThanOrEqual(0.6);
    expect(glitch.glitchOffsetPx).toBeLessThanOrEqual(2);
  });

  it('keeps none inert', () => {
    const pack = resolveLyricEffectPack('none', 'extreme');
    expect(pack.echo).toBe(false);
    expect(pack.neonScan).toBe(false);
    expect(pack.glitch).toBe(false);
    expect(pack.glowBoost).toBe(0);
  });
});
