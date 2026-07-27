import type { CharacterActionId } from '../../types/character';
import { CHARACTER_BPM_BASELINE } from '../../types/character';

// src/components/character/characterActionMath.ts
// Pure helpers for action registry, clip resolution, and BPM → timeScale.

export type CharacterActionDefinition = {
  id: CharacterActionId;
  /** Preferred clip names on the loaded model (first match wins). */
  clipCandidates: readonly string[];
  /** Base playback rate before BPM scaling (1 = normal). */
  baseTimeScale: number;
  /** Default cross-fade seconds when entering this action. */
  fadeSec: number;
};

/**
 * Preset action library. Fox MVP maps onto Survey / Walk / Run;
 * richer Mixamo clips can be added to candidates later without API changes.
 */
export const CHARACTER_ACTION_LIBRARY: Record<CharacterActionId, CharacterActionDefinition> = {
  idle: {
    id: 'idle',
    clipCandidates: ['Idle', 'idle', 'Survey', 'Stand', 'TPose'],
    baseTimeScale: 1,
    fadeSec: 0.35,
  },
  'dance-slow': {
    id: 'dance-slow',
    clipCandidates: ['DanceSlow', 'dance-slow', 'Walk', 'walk', 'Survey'],
    baseTimeScale: 0.85,
    fadeSec: 0.4,
  },
  'dance-fast': {
    id: 'dance-fast',
    clipCandidates: ['DanceFast', 'dance-fast', 'Run', 'run', 'Walk'],
    baseTimeScale: 1.15,
    fadeSec: 0.3,
  },
  cheer: {
    id: 'cheer',
    clipCandidates: ['Cheer', 'cheer', 'Jump', 'Run', 'run', 'Walk'],
    baseTimeScale: 1.35,
    fadeSec: 0.25,
  },
  sad: {
    id: 'sad',
    clipCandidates: ['Sad', 'sad', 'Cry', 'Survey', 'Idle', 'idle'],
    baseTimeScale: 0.65,
    fadeSec: 0.45,
  },
  /** Ticket 09 click special — fox uses Survey as a friendly “look / nod”. */
  wave: {
    id: 'wave',
    clipCandidates: ['Wave', 'wave', 'Survey', 'Idle', 'idle'],
    baseTimeScale: 1.25,
    fadeSec: 0.2,
  },
  /** Ticket 09 click special — fox Run + runtime yaw spin. */
  spin: {
    id: 'spin',
    clipCandidates: ['Spin', 'spin', 'Run', 'run', 'Walk'],
    baseTimeScale: 1.45,
    fadeSec: 0.2,
  },
};

/**
 * Map song BPM onto mixer timeScale (120 BPM → 1.0x).
 */
export function resolveCharacterTimeScaleFromBpm(
  bpm: number,
  baseline = CHARACTER_BPM_BASELINE,
): number {
  if (!Number.isFinite(bpm) || bpm <= 0) return 1;
  const safeBaseline = Math.max(1, baseline);
  return Math.min(1.75, Math.max(0.5, bpm / safeBaseline));
}

/**
 * Combine action base rate with BPM scale.
 */
export function resolveActionPlaybackTimeScale(
  action: CharacterActionDefinition,
  bpm: number | null | undefined,
): number {
  const bpmScale = bpm == null ? 1 : resolveCharacterTimeScaleFromBpm(bpm);
  return action.baseTimeScale * bpmScale;
}

/**
 * Pick the first clip name that exists on the loaded model for an action.
 */
export function resolveActionClipName(
  actionId: CharacterActionId,
  availableClipNames: readonly string[],
  library: Record<CharacterActionId, CharacterActionDefinition> = CHARACTER_ACTION_LIBRARY,
): string | null {
  const def = library[actionId];
  if (!def || availableClipNames.length === 0) return null;

  const lowered = new Map(
    availableClipNames.map((name) => [name.toLowerCase(), name] as const),
  );

  for (const candidate of def.clipCandidates) {
    const hit = lowered.get(candidate.toLowerCase());
    if (hit) return hit;
  }

  return availableClipNames[0] ?? null;
}

/**
 * List which preset actions currently have a resolvable clip.
 */
export function listResolvableActions(
  availableClipNames: readonly string[],
  library: Record<CharacterActionId, CharacterActionDefinition> = CHARACTER_ACTION_LIBRARY,
): CharacterActionId[] {
  return (Object.keys(library) as CharacterActionId[]).filter(
    (id) => resolveActionClipName(id, availableClipNames, library) !== null,
  );
}
