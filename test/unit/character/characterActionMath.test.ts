import { describe, expect, it } from 'vitest';
import {
  CHARACTER_ACTION_LIBRARY,
  listResolvableActions,
  resolveActionClipName,
  resolveActionPlaybackTimeScale,
  resolveCharacterTimeScaleFromBpm,
} from '../../../src/components/character/characterActionMath';
import { CHARACTER_ACTION_IDS } from '../../../src/types/character';

// test/unit/character/characterActionMath.test.ts

describe('characterActionMath', () => {
  const foxClips = ['Survey', 'Walk', 'Run'];

  it('maps all preset actions onto Fox clips', () => {
    expect(resolveActionClipName('idle', foxClips)).toBe('Survey');
    expect(resolveActionClipName('dance-slow', foxClips)).toBe('Walk');
    expect(resolveActionClipName('dance-fast', foxClips)).toBe('Run');
    expect(resolveActionClipName('cheer', foxClips)).toBe('Run');
    expect(resolveActionClipName('sad', foxClips)).toBe('Survey');
    expect(resolveActionClipName('wave', foxClips)).toBe('Survey');
    expect(resolveActionClipName('spin', foxClips)).toBe('Run');
    expect(listResolvableActions(foxClips).sort()).toEqual([...CHARACTER_ACTION_IDS].sort());
  });

  it('prefers exact Mixamo-style clip names when present', () => {
    const clips = ['Idle', 'DanceSlow', 'DanceFast', 'Cheer', 'Sad'];
    expect(resolveActionClipName('idle', clips)).toBe('Idle');
    expect(resolveActionClipName('dance-slow', clips)).toBe('DanceSlow');
    expect(resolveActionClipName('cheer', clips)).toBe('Cheer');
  });

  it('scales BPM around a 120 baseline and clamps', () => {
    expect(resolveCharacterTimeScaleFromBpm(120)).toBe(1);
    expect(resolveCharacterTimeScaleFromBpm(60)).toBe(0.5);
    expect(resolveCharacterTimeScaleFromBpm(180)).toBe(1.5);
    expect(resolveCharacterTimeScaleFromBpm(300)).toBe(1.75);
    expect(resolveCharacterTimeScaleFromBpm(0)).toBe(1);
  });

  it('combines action base rate with BPM', () => {
    const cheer = CHARACTER_ACTION_LIBRARY.cheer;
    expect(resolveActionPlaybackTimeScale(cheer, 120)).toBeCloseTo(1.35, 5);
    expect(resolveActionPlaybackTimeScale(cheer, 60)).toBeCloseTo(1.35 * 0.5, 5);
  });
});
