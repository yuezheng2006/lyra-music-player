// src/utils/atmosphere/atmospherePresentationBus.ts
// Module-level beat snapshots for lightweight UI chrome (no React).

let latestBeatPulse = 0;
let latestBeatOnset = 0;

/** Write the smoothed presentation beat pulse (0..1-ish) from atmosphere tick. */
export function setAtmospherePresentationBeatPulse(value: number): void {
  latestBeatPulse = Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Write a short-attack onset spike for lyric garnish (still 0..1-ish). */
export function setAtmospherePresentationBeatOnset(value: number): void {
  latestBeatOnset = Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Read the smoothed beat pulse without subscribing. */
export function getAtmospherePresentationBeatPulse(): number {
  return latestBeatPulse;
}

/** Read the sharper onset spike without subscribing. */
export function getAtmospherePresentationBeatOnset(): number {
  return latestBeatOnset;
}

/** Reset both channels (song change / engine reset). */
export function resetAtmospherePresentationBeat(): void {
  latestBeatPulse = 0;
  latestBeatOnset = 0;
}
