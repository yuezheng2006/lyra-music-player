import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { EmotionTag } from '../../types/moodEngine';
import type { CharacterActionId } from '../../types/character';
import { useMoodEngineStore } from '../../stores/useMoodEngineStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useAtmosphereBeatMapStore } from '../../stores/useAtmosphereBeatMapStore';
import {
  advanceAmbientBeatCursor,
  createAmbientBeatCursor,
  resetAmbientBeatCursor,
  type AmbientBeatCursor,
} from '../../utils/atmosphere/ambientVisualRhythm';
import type { CharacterRuntime } from '../../components/character/CharacterRuntime';
import {
  resolveBpmFromBeatMap,
  resolveCharacterActionForEmotion,
  resolveCharacterBeatResponse,
  resolvePhraseAccentAction,
} from '../../components/character/characterRhythmMath';

// src/hooks/atmosphere/useCharacterRhythmDriver.ts
// Drives CharacterRuntime from mood engine + BeatMap without React setState on the beat path.

type UseCharacterRhythmDriverParams = {
  runtimeRef: MutableRefObject<CharacterRuntime | null>;
  /** Audio clock (seconds). Prefer MotionValue from the visualizer shell. */
  currentTime?: MotionValue<number> | null;
  enabled?: boolean;
};

/**
 * Sync emotion → playAction, BPM → timeScale, and BeatEvents → emphasis / phrase accents.
 */
export function useCharacterRhythmDriver({
  runtimeRef,
  enabled = true,
}: UseCharacterRhythmDriverParams): {
  tickCharacterRhythm: (currentTimeSec: number) => void;
  resetCharacterRhythm: () => void;
} {
  const currentEmotion = useMoodEngineStore((s) => s.currentEmotion);
  const status = useCharacterStore((s) => s.status);
  const beatMap = useAtmosphereBeatMapStore((s) => s.beatMap);
  const setBpm = useCharacterStore((s) => s.setBpm);
  const setCurrentAction = useCharacterStore((s) => s.setCurrentAction);

  const cursorRef = useRef<AmbientBeatCursor>(createAmbientBeatCursor());
  const lastEmotionRef = useRef<EmotionTag | null>(null);
  const baseActionRef = useRef<CharacterActionId>('idle');
  const phraseUntilRef = useRef(0);
  const accentActiveRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Emotion → action (discrete). Re-applies when model becomes ready.
  useEffect(() => {
    if (!enabled || status !== 'ready') return;
    const runtime = runtimeRef.current;
    if (!runtime || runtime.isInteractionLocked()) return;

    const emotion = currentEmotion?.emotion ?? 'neutral';
    const action = resolveCharacterActionForEmotion(emotion);
    baseActionRef.current = action;

    if (lastEmotionRef.current === emotion
      && runtime.getCurrentActionId() === action) {
      return;
    }
    lastEmotionRef.current = emotion;

    if (runtime.playAction(action)) {
      setCurrentAction(action);
    }
  }, [currentEmotion, enabled, runtimeRef, setCurrentAction, status]);

  // BPM from beat map (discrete)
  useEffect(() => {
    if (!enabled) return;
    const bpm = resolveBpmFromBeatMap(beatMap);
    const prev = useCharacterStore.getState().bpm;
    if (prev !== bpm) setBpm(bpm);
    runtimeRef.current?.setBpm(bpm);
  }, [beatMap, enabled, runtimeRef, setBpm]);

  // Hot path: mutate runtime/refs only — never Zustand/React setState (guardrails).
  const tickCharacterRhythm = useRef((currentTimeSec: number) => {
    if (!enabledRef.current) return;
    const runtime = runtimeRef.current;
    if (!runtime) return;

    // Click specials own the mixer; only keep beat emphasis pulses.
    if (runtime.isInteractionLocked()) {
      const map = useAtmosphereBeatMapStore.getState().beatMap;
      if (!map) return;
      const beats = map.pulseBeats.length > 0 ? map.pulseBeats : map.beats;
      advanceAmbientBeatCursor(cursorRef.current, beats, currentTimeSec, (beat) => {
        runtime.pulseBeatEmphasis(resolveCharacterBeatResponse(beat).emphasis);
      });
      return;
    }

    // Restore base mood action after a phrase accent window.
    if (accentActiveRef.current && currentTimeSec >= phraseUntilRef.current) {
      accentActiveRef.current = false;
      const base = baseActionRef.current;
      if (runtime.getCurrentActionId() !== base) {
        runtime.playAction(base);
      }
    }

    const map = useAtmosphereBeatMapStore.getState().beatMap;
    if (!map) return;

    const beats = map.pulseBeats.length > 0 ? map.pulseBeats : map.beats;
    advanceAmbientBeatCursor(cursorRef.current, beats, currentTimeSec, (beat) => {
      const response = resolveCharacterBeatResponse(beat);
      runtime.pulseBeatEmphasis(response.emphasis);

      if (response.switchAction && currentTimeSec >= phraseUntilRef.current) {
        const accent = resolvePhraseAccentAction(baseActionRef.current);
        if (accent !== runtime.getCurrentActionId()) {
          runtime.playAction(accent);
          accentActiveRef.current = true;
          phraseUntilRef.current = currentTimeSec + 1.6;
        }
      }
    });
  }).current;

  const resetCharacterRhythm = useRef(() => {
    resetAmbientBeatCursor(cursorRef.current);
    phraseUntilRef.current = 0;
    accentActiveRef.current = false;
  }).current;

  return { tickCharacterRhythm, resetCharacterRhythm };
}
