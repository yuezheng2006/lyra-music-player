// src/utils/visualizer/coverParticleBandTrackerMath.ts
// Per-band onset trackers for cover-particle ripples (ported from Folia diorama).

export interface CoverParticleBandTracker {
  fast: number;
  floor: number;
  peak: number;
  /** Schmitt trigger: true after HIGH until transient falls under LOW. */
  armed: boolean;
  primed: boolean;
}

export interface CoverParticleBandSignal {
  transient: number;
  sustained: number;
  /** True on the single frame a hit crosses the trigger. */
  onset: boolean;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const stepEnvelope = (
  current: number,
  target: number,
  attack: number,
  release: number,
  delta: number,
): number => current + (target - current) * (1 - Math.exp(-(target > current ? attack : release) * delta));

const FAST_ATTACK = 22;
const FAST_RELEASE = 7;
const FLOOR_RISE = 2.5;
const FLOOR_FALL = 4;
const PEAK_RISE = 9;
const PEAK_FALL = 0.28;
const MIN_RANGE = 0.12;
const MIN_PEAK = 0.22;
const TRIGGER_HIGH = 0.42;
const TRIGGER_LOW = 0.2;

export const createCoverParticleBandTracker = (): CoverParticleBandTracker => ({
  fast: 0,
  floor: 0,
  peak: 0,
  armed: false,
  primed: false,
});

/** Advances valley/peak envelopes and returns loudness-invariant onset. */
export const stepCoverParticleBandTracker = (
  state: CoverParticleBandTracker,
  level: number,
  delta: number,
): CoverParticleBandSignal => {
  const safe = clamp01(level);
  if (!state.primed) {
    state.fast = safe;
    state.floor = safe;
    state.peak = safe;
    state.primed = true;
  } else {
    state.fast = stepEnvelope(state.fast, safe, FAST_ATTACK, FAST_RELEASE, delta);
    state.floor = stepEnvelope(state.floor, safe, FLOOR_RISE, FLOOR_FALL, delta);
    state.peak = stepEnvelope(state.peak, safe, PEAK_RISE, PEAK_FALL, delta);
  }
  const range = Math.max(MIN_RANGE, state.peak - state.floor);
  const transient = clamp01((state.fast - state.floor) / range);
  const sustained = clamp01(state.fast / Math.max(MIN_PEAK, state.peak));
  let onset = false;
  if (!state.armed && transient >= TRIGGER_HIGH) {
    state.armed = true;
    onset = true;
  } else if (state.armed && transient <= TRIGGER_LOW) {
    state.armed = false;
  }
  return { transient, sustained, onset };
};

export type CoverParticleRippleBandId = 'bass' | 'mid' | 'treble';

/** Per-band spawn scale for cover-plane ripples (strength only; shader shape stays shared). */
export const COVER_PARTICLE_RIPPLE_BANDS: ReadonlyArray<{
  id: CoverParticleRippleBandId;
  strength: number;
  regionScale: number;
}> = [
  { id: 'bass', strength: 1.35, regionScale: 1 },
  { id: 'mid', strength: 0.95, regionScale: 0.82 },
  { id: 'treble', strength: 0.62, regionScale: 0.68 },
];

export const COVER_PARTICLE_RIPPLE_SLOTS_PER_BAND = 4;
export const COVER_PARTICLE_RIPPLE_MAX = COVER_PARTICLE_RIPPLE_BANDS.length * COVER_PARTICLE_RIPPLE_SLOTS_PER_BAND;

/** Maps band index + round-robin cursor into the shared ripple pool. */
export const resolveCoverParticleRippleSlotIndex = (
  bandIndex: number,
  cursor: number,
  slotsPerBand = COVER_PARTICLE_RIPPLE_SLOTS_PER_BAND,
): number => bandIndex * slotsPerBand + (cursor % slotsPerBand);
