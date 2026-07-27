import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { BeatMap } from '../../types/atmosphere';
import type { EmotionTag } from '../../types/moodEngine';
import {
  getVisualParamsForEmotion,
  getVisualStrategyForEmotion,
} from '../../types/moodEngine';
import type { VisualStrategyType } from '../../types/visualStrategy';
import { useMoodEngineStore } from '../../stores/useMoodEngineStore';
import { useAmbientVisualStore } from '../../stores/useAmbientVisualStore';
import { VisualStrategyManager } from '../../components/visualizer/strategies/VisualStrategyManager';
import {
  advanceAmbientBeatCursor,
  createAmbientBeatCursor,
  resetAmbientBeatCursor,
  type AmbientBeatCursor,
} from '../../utils/atmosphere/ambientVisualRhythm';

// src/hooks/atmosphere/useAmbientVisualController.ts
// Bridges mood engine + beat map into VisualStrategyManager without touching the hot tick path.

type UseAmbientVisualControllerParams = {
  managerRef: MutableRefObject<VisualStrategyManager | null>;
  beatMapRef?: MutableRefObject<BeatMap | null>;
  enabled?: boolean;
};

/**
 * Syncs emotion → strategy switches into the manager, and advances a beat cursor
 * against the shared atmosphere BeatMap when tickAmbientRhythm is called.
 *
 * Frame loop only mutates the manager / refs. Zustand updates are discrete
 * (emotion change, transition start/end, strategy identity change).
 */
export function useAmbientVisualController({
  managerRef,
  beatMapRef,
  enabled = true,
}: UseAmbientVisualControllerParams) {
  const currentEmotion = useMoodEngineStore((s) => s.currentEmotion);
  const ambientEnabled = useAmbientVisualStore((s) => s.enabled);
  const transitionDuration = useAmbientVisualStore((s) => s.transitionDuration);
  const setStrategy = useAmbientVisualStore((s) => s.setStrategy);
  const setTransitioning = useAmbientVisualStore((s) => s.setTransitioning);

  const cursorRef = useRef<AmbientBeatCursor>(createAmbientBeatCursor());
  const lastEmotionRef = useRef<EmotionTag | null>(null);
  const lastEmotionTouchRef = useRef(0);
  const lastTransitioningRef = useRef(false);
  const lastStrategyRef = useRef<VisualStrategyType | null>(null);
  const enabledRef = useRef(enabled && ambientEnabled);
  const beatMapRefHolder = useRef(beatMapRef);
  beatMapRefHolder.current = beatMapRef;
  enabledRef.current = enabled && ambientEnabled;

  useEffect(() => {
    managerRef.current?.setTransitionDuration(transitionDuration);
  }, [managerRef, transitionDuration]);

  useEffect(() => {
    const manager = managerRef.current;
    if (!enabled || !ambientEnabled || !manager || !currentEmotion) return;

    const emotion = currentEmotion.emotion;
    const emotionTouchedAt = currentEmotion.updatedAt ?? 0;
    // User corrections bump updatedAt even when the tag string is unchanged.
    const sameEmotion = lastEmotionRef.current === emotion;
    if (sameEmotion && emotionTouchedAt <= (lastEmotionTouchRef.current || 0)) return;

    const previousEmotion = lastEmotionRef.current;
    lastEmotionRef.current = emotion;
    lastEmotionTouchRef.current = emotionTouchedAt;

    const target = getVisualStrategyForEmotion(emotion);
    const params = getVisualParamsForEmotion(emotion);
    // Same strategy family (happy→energetic) used to no-op; force remount with new params.
    const forceSameFamily = previousEmotion != null
      && lastStrategyRef.current === target;
    const forceUserCorrection = currentEmotion.source === 'user';
    manager.switchByEmotion(emotion, params, { force: forceSameFamily || forceUserCorrection });

    if (target !== lastStrategyRef.current) {
      lastStrategyRef.current = target;
      setStrategy(target);
    } else if (forceSameFamily || forceUserCorrection) {
      setStrategy(target);
    }

    const transitioning = manager.getIsTransitioning();
    if (transitioning !== lastTransitioningRef.current) {
      lastTransitioningRef.current = transitioning;
      setTransitioning(transitioning);
    }
  }, [
    ambientEnabled,
    currentEmotion,
    enabled,
    managerRef,
    setStrategy,
    setTransitioning,
  ]);

  const tickAmbientRhythm = useRef((currentTimeSec: number, deltaTime: number) => {
    const manager = managerRef.current;
    if (!enabledRef.current || !manager) return;

    manager.update(deltaTime);

    const transitioning = manager.getIsTransitioning();
    if (transitioning !== lastTransitioningRef.current) {
      lastTransitioningRef.current = transitioning;
      setTransitioning(transitioning);
    }

    if (!transitioning) {
      const type = manager.getCurrentStrategyType();
      if (type && type !== lastStrategyRef.current) {
        lastStrategyRef.current = type;
        setStrategy(type);
      }
    }

    const beatMap = beatMapRefHolder.current?.current;
    if (!beatMap) return;

    const beats = beatMap.pulseBeats.length > 0 ? beatMap.pulseBeats : beatMap.beats;
    advanceAmbientBeatCursor(cursorRef.current, beats, currentTimeSec, (beat) => {
      manager.onRhythmEvent(beat);
    });
  }).current;

  const resetRhythmCursor = useRef(() => {
    resetAmbientBeatCursor(cursorRef.current);
  }).current;

  return { tickAmbientRhythm, resetRhythmCursor };
}
