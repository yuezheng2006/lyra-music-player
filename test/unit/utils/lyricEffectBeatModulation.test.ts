import { describe, expect, it } from 'vitest';
import {
  LYRIC_PACK_BEAT_CHORUS_PEAK,
  LYRIC_PACK_BEAT_FLOOR,
  LYRIC_PACK_BEAT_PEAK,
  resolveLyricBeatDrive,
  resolveLyricEffectBeatModulation,
  shapeLyricEffectBeatAmount,
} from '../../../src/utils/lyricEffectBeatModulation';

// test/unit/utils/lyricEffectBeatModulation.test.ts

describe('lyricEffectBeatModulation', () => {
  it('blends groove pulse with leading onset without exceeding 1', () => {
    expect(resolveLyricBeatDrive(0, 0)).toBe(0);
    expect(resolveLyricBeatDrive(0.4, 0)).toBeCloseTo(0.4 * 0.62, 5);
    // Onset ahead of slow pulse should raise drive vs pulse alone.
    const lagged = resolveLyricBeatDrive(0.25, 0);
    const locked = resolveLyricBeatDrive(0.25, 0.9);
    expect(locked).toBeGreaterThan(lagged);
    expect(locked).toBeLessThanOrEqual(1);
    expect(resolveLyricBeatDrive(1.5, 2)).toBe(1);
    expect(resolveLyricBeatDrive(-1, -0.5)).toBe(0);
  });

  it('keeps none inert at any beat', () => {
    const quiet = resolveLyricEffectBeatModulation(0, 'none', 'extreme');
    const loud = resolveLyricEffectBeatModulation(1, 'none', 'extreme');
    expect(quiet).toEqual({ echoMul: 1, glowMul: 1, glitchMul: 1, scanMul: 1 });
    expect(loud).toEqual(quiet);
  });

  it('shapes near-zero beat to zero amount', () => {
    expect(shapeLyricEffectBeatAmount(0)).toBe(0);
    expect(shapeLyricEffectBeatAmount(0.01)).toBe(0);
    expect(shapeLyricEffectBeatAmount(1)).toBeGreaterThan(0.9);
  });

  it('intensifies yehuo echo on strong beat within garnish peak', () => {
    const weak = resolveLyricEffectBeatModulation(0.08, 'yehuo', 'strong');
    const strong = resolveLyricEffectBeatModulation(1, 'yehuo', 'strong');
    expect(strong.echoMul).toBeGreaterThan(weak.echoMul);
    expect(strong.echoMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_PEAK.echo);
    expect(strong.glowMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_PEAK.glow);
    expect(strong.glitchMul).toBe(1);
    expect(strong.scanMul).toBe(1);
  });

  it('breathes slightly below 1 on weak yehuo pulse', () => {
    const weak = resolveLyricEffectBeatModulation(0.05, 'yehuo', 'normal');
    expect(weak.echoMul).toBeGreaterThanOrEqual(LYRIC_PACK_BEAT_FLOOR);
    expect(weak.echoMul).toBeLessThanOrEqual(1.02);
  });

  it('drives neon scan/glow and glitch offset axes only', () => {
    const neon = resolveLyricEffectBeatModulation(1, 'neon', 'strong');
    expect(neon.scanMul).toBeGreaterThan(1);
    expect(neon.glowMul).toBeGreaterThan(1);
    expect(neon.echoMul).toBe(1);
    expect(neon.glitchMul).toBe(1);

    const glitch = resolveLyricEffectBeatModulation(1, 'glitch', 'strong');
    expect(glitch.glitchMul).toBeGreaterThan(1);
    expect(glitch.glitchMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_PEAK.glitch);
    expect(glitch.scanMul).toBe(1);
    expect(glitch.echoMul).toBe(1);
  });

  it('scales beat response with visualEffectIntensity (restraint bias)', () => {
    const subtle = resolveLyricEffectBeatModulation(1, 'neon', 'subtle');
    const extreme = resolveLyricEffectBeatModulation(1, 'neon', 'extreme');
    expect(extreme.glowMul).toBeGreaterThan(subtle.glowMul);
    expect(extreme.scanMul).toBeGreaterThan(subtle.scanMul);
    expect(extreme.glowMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_PEAK.glow);
  });

  it('lifts chorus peaks a hair without leaving garnish range', () => {
    const verse = resolveLyricEffectBeatModulation(1, 'neon', 'extreme');
    const chorus = resolveLyricEffectBeatModulation(1, 'neon', 'extreme', { isChorus: true });
    expect(chorus.glowMul).toBeGreaterThan(verse.glowMul);
    expect(chorus.scanMul).toBeGreaterThan(verse.scanMul);
    expect(chorus.glowMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_CHORUS_PEAK.glow);
    expect(chorus.scanMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_CHORUS_PEAK.scan);
    expect(chorus.glowMul).toBeLessThanOrEqual(1.16);

    const yehuoChorus = resolveLyricEffectBeatModulation(1, 'yehuo', 'extreme', { isChorus: true });
    expect(yehuoChorus.echoMul).toBeLessThanOrEqual(LYRIC_PACK_BEAT_CHORUS_PEAK.echo);
    expect(yehuoChorus.echoMul).toBeGreaterThan(
      resolveLyricEffectBeatModulation(1, 'yehuo', 'extreme').echoMul,
    );
  });
});
