import { describe, expect, it } from 'vitest';
import {
  advanceAmbientBeatCursor,
  classifyAmbientRhythmTier,
  createAmbientBeatCursor,
  dispatchAmbientRhythmEvent,
  resetAmbientBeatCursor,
} from '../../../src/utils/atmosphere/ambientVisualRhythm';
import type { BeatEvent } from '../../../src/types/atmosphere';
import type { VisualStrategy } from '../../../src/types/visualStrategy';

// test/unit/visualizer/ambientVisualRhythm.test.ts
// Ambient beat / bar / phrase routing used by VisualStrategyManager.

const beat = (partial: Partial<BeatEvent>): BeatEvent => ({
  time: 0,
  strength: 0.5,
  confidence: 0.8,
  ...partial,
});

describe('ambientVisualRhythm', () => {
  it('classifies drop / primary-16 as phrase, downbeat/primary as bar, else beat', () => {
    expect(classifyAmbientRhythmTier(beat({ combo: 'drop' }))).toBe('phrase');
    expect(classifyAmbientRhythmTier(beat({ index: 16, primary: true }))).toBe('phrase');
    expect(classifyAmbientRhythmTier(beat({ combo: 'downbeat' }))).toBe('bar');
    expect(classifyAmbientRhythmTier(beat({ primary: true }))).toBe('bar');
    expect(classifyAmbientRhythmTier(beat({ index: 4 }))).toBe('bar');
    expect(classifyAmbientRhythmTier(beat({ index: 1 }))).toBe('beat');
  });

  it('dispatches lower tiers together with phrase/bar', () => {
    const calls: string[] = [];
    const target: Pick<VisualStrategy, 'onBeat' | 'onBar' | 'onPhrase'> = {
      onBeat: () => calls.push('beat'),
      onBar: () => calls.push('bar'),
      onPhrase: () => calls.push('phrase'),
    };

    dispatchAmbientRhythmEvent(target, beat({ combo: 'drop' }));
    expect(calls).toEqual(['beat', 'bar', 'phrase']);

    calls.length = 0;
    dispatchAmbientRhythmEvent(target, beat({ primary: true }));
    expect(calls).toEqual(['beat', 'bar']);

    calls.length = 0;
    dispatchAmbientRhythmEvent(target, beat({ index: 1 }));
    expect(calls).toEqual(['beat']);
  });

  it('advances cursor and fires due beats once', () => {
    const cursor = createAmbientBeatCursor();
    const events: number[] = [];
    const beats = [
      beat({ time: 0.1, index: 0 }),
      beat({ time: 0.5, index: 1 }),
      beat({ time: 1.0, index: 2 }),
    ];

    advanceAmbientBeatCursor(cursor, beats, 0.12, (b) => events.push(b.time));
    expect(events).toEqual([0.1]);

    advanceAmbientBeatCursor(cursor, beats, 0.52, (b) => events.push(b.time));
    expect(events).toEqual([0.1, 0.5]);

    resetAmbientBeatCursor(cursor);
    expect(cursor.pulseIdx).toBe(0);
    expect(cursor.lastTime).toBe(-1);
  });
});
