import { describe, expect, it } from 'vitest';
import {
  findClipByName,
  normalizeClipNames,
  resolveDefaultClipName,
} from '../../../src/components/character/characterAnimationMath';
import { AnimationClip } from 'three';

// test/unit/character/characterAnimationMath.test.ts

describe('characterAnimationMath', () => {
  it('normalizes clip names', () => {
    expect(normalizeClipNames([' Walk ', '', 'Walk', 'Run'])).toEqual(['Walk', 'Run']);
  });

  it('prefers Survey / Idle candidates for Fox-style assets', () => {
    expect(resolveDefaultClipName(['Run', 'Walk', 'Survey'])).toBe('Survey');
    expect(resolveDefaultClipName(['dance', 'idle'])).toBe('idle');
    expect(resolveDefaultClipName(['OnlyClip'])).toBe('OnlyClip');
    expect(resolveDefaultClipName([])).toBeNull();
  });

  it('finds clips by exact then case-insensitive name', () => {
    const clips = [
      new AnimationClip('Walk', 1, []),
      new AnimationClip('Run', 1, []),
    ];
    expect(findClipByName(clips, 'Walk')?.name).toBe('Walk');
    expect(findClipByName(clips, 'run')?.name).toBe('Run');
    expect(findClipByName(clips, 'missing')).toBeNull();
  });
});
