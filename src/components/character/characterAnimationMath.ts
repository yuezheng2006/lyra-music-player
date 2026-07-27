import type { AnimationClip } from 'three';
import { DEFAULT_CHARACTER_IDLE_CLIP_CANDIDATES } from '../../types/character';

// src/components/character/characterAnimationMath.ts
// Pure helpers for clip selection and playback naming.

/**
 * Pick the best default clip name from available clips.
 */
export function resolveDefaultClipName(clipNames: string[]): string | null {
  if (clipNames.length === 0) return null;

  for (const candidate of DEFAULT_CHARACTER_IDLE_CLIP_CANDIDATES) {
    const hit = clipNames.find((name) => name === candidate);
    if (hit) return hit;
  }

  const caseInsensitive = clipNames.find((name) => (
    DEFAULT_CHARACTER_IDLE_CLIP_CANDIDATES.some(
      (candidate) => candidate.toLowerCase() === name.toLowerCase(),
    )
  ));
  if (caseInsensitive) return caseInsensitive;

  return clipNames[0] ?? null;
}

/**
 * Find an AnimationClip by name (exact, then case-insensitive).
 */
export function findClipByName(
  clips: AnimationClip[],
  name: string,
): AnimationClip | null {
  const exact = clips.find((clip) => clip.name === name);
  if (exact) return exact;
  const lowered = name.toLowerCase();
  return clips.find((clip) => clip.name.toLowerCase() === lowered) ?? null;
}

/**
 * Normalize a list of clip names (trim, drop empties, unique preserve order).
 */
export function normalizeClipNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }
  return result;
}
