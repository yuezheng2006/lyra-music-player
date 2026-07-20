import { describe, expect, it } from 'vitest';
import {
  canAcceptCharacterClick,
  CHARACTER_CLICK_COOLDOWN_MS,
  isSpecialActionActive,
  resolveHoverEmissive,
  resolveNextSpecialAction,
  shouldSampleCharacterRaycast,
  stepHoverIntensity,
} from '@/components/character/characterInteractionMath';

// test/unit/character/characterInteractionMath.test.ts

describe('characterInteractionMath', () => {
  it('accepts the first click and enforces cooldown', () => {
    expect(canAcceptCharacterClick(1000, null)).toBe(true);
    expect(canAcceptCharacterClick(1000, 1000)).toBe(false);
    expect(canAcceptCharacterClick(1000 + CHARACTER_CLICK_COOLDOWN_MS - 1, 1000)).toBe(false);
    expect(canAcceptCharacterClick(1000 + CHARACTER_CLICK_COOLDOWN_MS, 1000)).toBe(true);
  });

  it('alternates wave and spin specials', () => {
    expect(resolveNextSpecialAction(null)).toBe('wave');
    expect(resolveNextSpecialAction('wave')).toBe('spin');
    expect(resolveNextSpecialAction('spin')).toBe('wave');
  });

  it('detects active special ownership window', () => {
    expect(isSpecialActionActive(1, null)).toBe(false);
    expect(isSpecialActionActive(1, 2)).toBe(true);
    expect(isSpecialActionActive(2, 2)).toBe(false);
  });

  it('throttles raycast samples', () => {
    expect(shouldSampleCharacterRaycast(0, null)).toBe(true);
    expect(shouldSampleCharacterRaycast(10, 0, 48)).toBe(false);
    expect(shouldSampleCharacterRaycast(48, 0, 48)).toBe(true);
  });

  it('eases hover intensity and maps emissive', () => {
    const up = stepHoverIntensity(0, true, 0.1);
    expect(up).toBeGreaterThan(0);
    expect(up).toBeLessThan(1);
    expect(stepHoverIntensity(1, false, 10)).toBe(0);

    const glow = resolveHoverEmissive(1);
    expect(glow.r).toBeGreaterThan(0);
    expect(resolveHoverEmissive(0)).toEqual({ r: 0, g: 0, b: 0 });
  });
});
