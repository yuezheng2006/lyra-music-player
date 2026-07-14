import type { BeatEvent } from '../../types/atmosphere';
import type { VisualStrategy } from '../../types/visualStrategy';

// src/utils/atmosphere/ambientVisualRhythm.ts
// Maps BeatEvent metadata onto VisualStrategy beat / bar / phrase tiers.

/** Rhythm tier dispatched to ambient visual strategies. */
export type AmbientRhythmTier = 'beat' | 'bar' | 'phrase';

/**
 * Classify a BeatEvent into beat / bar / phrase intensity tiers.
 * Phrase > bar > beat; every event still fires the beat tier.
 */
export function classifyAmbientRhythmTier(event: BeatEvent): AmbientRhythmTier {
  if (event.combo === 'drop' || (event.index !== undefined && event.index % 16 === 0 && event.primary)) {
    return 'phrase';
  }

  if (
    event.combo === 'downbeat'
    || event.primary
    || (event.index !== undefined && event.index % 4 === 0)
  ) {
    return 'bar';
  }

  return 'beat';
}

/**
 * Dispatch a BeatEvent to the matching VisualStrategy rhythm callbacks.
 * Phrase and bar events also fire the lower tiers so strategies stay in sync.
 */
export function dispatchAmbientRhythmEvent(
  target: Pick<VisualStrategy, 'onBeat' | 'onBar' | 'onPhrase'>,
  event: BeatEvent,
): AmbientRhythmTier {
  const tier = classifyAmbientRhythmTier(event);

  target.onBeat(event);

  if (tier === 'bar' || tier === 'phrase') {
    target.onBar(event);
  }

  if (tier === 'phrase') {
    target.onPhrase(event);
  }

  return tier;
}

/** Cursor that walks pulseBeats in lockstep with playback time. */
export interface AmbientBeatCursor {
  pulseIdx: number;
  lastTime: number;
}

export function createAmbientBeatCursor(): AmbientBeatCursor {
  return { pulseIdx: 0, lastTime: -1 };
}

export function resetAmbientBeatCursor(cursor: AmbientBeatCursor): void {
  cursor.pulseIdx = 0;
  cursor.lastTime = -1;
}

const LOOKAHEAD_SEC = 0.075;

/**
 * Advance cursor through beatMap.pulseBeats (fallback: beats) and invoke onEvent
 * for each newly due beat. Mirrors atmosphere scheduler timing without mutating it.
 */
export function advanceAmbientBeatCursor(
  cursor: AmbientBeatCursor,
  beats: BeatEvent[],
  currentTimeSec: number,
  onEvent: (beat: BeatEvent) => void,
): void {
  if (cursor.lastTime >= 0 && Math.abs(currentTimeSec - cursor.lastTime) > 0.55) {
    const nextIdx = beats.findIndex((beat) => beat.time >= currentTimeSec - 0.04);
    cursor.pulseIdx = nextIdx < 0 ? beats.length : nextIdx;
  }

  while (cursor.pulseIdx < beats.length) {
    const beat = beats[cursor.pulseIdx];
    if (beat.time > currentTimeSec + LOOKAHEAD_SEC) break;
    if (beat.time >= currentTimeSec - 0.04) {
      onEvent(beat);
    }
    cursor.pulseIdx += 1;
  }

  cursor.lastTime = currentTimeSec;
}
