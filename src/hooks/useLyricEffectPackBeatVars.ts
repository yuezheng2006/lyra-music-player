import { useEffect, type RefObject } from 'react';
import type { MotionValue } from 'framer-motion';
import type { LyricEffectPackId } from '../utils/lyricEffectPacks';
import type { LyricVisualEffectIntensity } from '../utils/lyricVisualEffects';
import {
  getAtmospherePresentationBeatOnset,
  getAtmospherePresentationBeatPulse,
} from '../utils/atmosphere/atmospherePresentationBus';
import {
  clearLyricEffectBeatCssVars,
  resolveLyricBeatDrive,
  resolveLyricEffectBeatModulation,
  writeLyricEffectBeatCssVars,
} from '../utils/lyricEffectBeatModulation';

// src/hooks/useLyricEffectPackBeatVars.ts
// Drive pack CSS vars from atmosphere beat (RAF / refs only — no React setState per frame).

type UseLyricEffectPackBeatVarsArgs = {
  hostRef: RefObject<HTMLElement | null>;
  packId: LyricEffectPackId;
  intensity: LyricVisualEffectIntensity;
  beatPulse?: MotionValue<number>;
  /** Chorus lines get a tiny peak lift (still garnish). */
  isChorus?: boolean;
};

/**
 * Subscribe to beatPulse MotionValue (fallback: presentation bus) and write
 * restrained pack multipliers onto the stage host as CSS variables.
 */
export function useLyricEffectPackBeatVars({
  hostRef,
  packId,
  intensity,
  beatPulse,
  isChorus = false,
}: UseLyricEffectPackBeatVarsArgs): void {
  useEffect(() => {
    const host = hostRef.current;
    if (!host || packId === 'none') {
      if (host) clearLyricEffectBeatCssVars(host);
      return undefined;
    }

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      clearLyricEffectBeatCssVars(host);
      return undefined;
    }

    let raf = 0;
    let pollTimer = 0;
    let idleFrames = 0;
    let cancelled = false;
    let lastKey = '';

    const stopRaf = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const readBeat = () => {
      const fromMotion = beatPulse?.get();
      const pulse = (typeof fromMotion === 'number' && Number.isFinite(fromMotion))
        ? fromMotion
        : getAtmospherePresentationBeatPulse();
      // Blend smoothed MotionValue/bus pulse with the sharper bus onset channel.
      return resolveLyricBeatDrive(pulse, getAtmospherePresentationBeatOnset());
    };

    const apply = (beat: number) => {
      const modulation = resolveLyricEffectBeatModulation(beat, packId, intensity, { isChorus });
      const key = `${modulation.echoMul.toFixed(3)}:${modulation.glowMul.toFixed(3)}:${modulation.glitchMul.toFixed(3)}:${modulation.scanMul.toFixed(3)}`;
      if (key === lastKey) return;
      lastKey = key;
      writeLyricEffectBeatCssVars(host, modulation);
    };

    const tick = () => {
      if (cancelled) return;
      const beat = readBeat();
      apply(beat);
      if (beat < 0.02) {
        idleFrames += 1;
        if (idleFrames > 40) {
          stopRaf();
          pollTimer = window.setInterval(() => {
            if (cancelled) return;
            if (readBeat() >= 0.02) {
              window.clearInterval(pollTimer);
              pollTimer = 0;
              idleFrames = 0;
              raf = requestAnimationFrame(tick);
            }
          }, 200);
          return;
        }
      } else {
        idleFrames = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    apply(readBeat());
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      stopRaf();
      if (pollTimer) window.clearInterval(pollTimer);
      clearLyricEffectBeatCssVars(host);
    };
  }, [beatPulse, hostRef, intensity, isChorus, packId]);
}
