import { describe, expect, it } from 'vitest';
import type { BeatMap } from '../../../src/types/atmosphere';
import {
  resolveBpmFromBeatMap,
  resolveBeatEmphasis,
  resolveCharacterActionForEmotion,
  resolveCharacterBeatResponse,
  resolvePhraseAccentAction,
} from '../../../src/components/character/characterRhythmMath';

// test/unit/character/characterRhythmMath.test.ts

describe('characterRhythmMath', () => {
  it('maps emotions onto preset actions', () => {
    expect(resolveCharacterActionForEmotion('happy')).toBe('dance-fast');
    expect(resolveCharacterActionForEmotion('energetic')).toBe('cheer');
    expect(resolveCharacterActionForEmotion('sad')).toBe('sad');
    expect(resolveCharacterActionForEmotion('calm')).toBe('dance-slow');
    expect(resolveCharacterActionForEmotion('neutral')).toBe('idle');
  });

  it('infers BPM from gridStep', () => {
    const map = { gridStep: 0.5 } as BeatMap;
    expect(resolveBpmFromBeatMap(map)).toBe(120);
    expect(resolveBpmFromBeatMap({ gridStep: 1 } as BeatMap)).toBe(60);
    expect(resolveBpmFromBeatMap(null)).toBeNull();
  });

  it('scales beat emphasis with strength and tier', () => {
    expect(resolveBeatEmphasis(0, 'beat')).toBe(1);
    expect(resolveBeatEmphasis(1, 'beat')).toBeCloseTo(1.22, 5);
    expect(resolveBeatEmphasis(1, 'phrase')).toBeGreaterThan(resolveBeatEmphasis(1, 'beat'));
  });

  it('resolves phrase accent upgrades', () => {
    expect(resolvePhraseAccentAction('idle')).toBe('dance-fast');
    expect(resolvePhraseAccentAction('dance-fast')).toBe('cheer');
    expect(resolvePhraseAccentAction('sad')).toBe('sad');
  });

  it('classifies beat responses', () => {
    const drop = resolveCharacterBeatResponse({
      time: 1,
      strength: 0.9,
      confidence: 1,
      combo: 'drop',
    });
    expect(drop.tier).toBe('phrase');
    expect(drop.switchAction).toBe(true);
    expect(drop.emphasis).toBeGreaterThan(1.2);

    const weak = resolveCharacterBeatResponse({
      time: 1,
      strength: 0.2,
      confidence: 1,
      index: 1,
    });
    expect(weak.tier).toBe('beat');
    expect(weak.switchAction).toBe(false);
  });
});
