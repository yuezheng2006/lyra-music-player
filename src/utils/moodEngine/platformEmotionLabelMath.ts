// src/utils/moodEngine/platformEmotionLabelMath.ts
// Map platform wiki/style label strings onto EmotionTag.

import type { EmotionTag } from '../../types/moodEngine';

const LABEL_TO_EMOTION: Array<{ emotion: EmotionTag; needles: string[] }> = [
  { emotion: 'happy', needles: ['快乐', '欢快', '开心', '愉悦', 'happy', 'cheerful', 'joyful'] },
  { emotion: 'sad', needles: ['悲伤', '伤心', '难过', '苦情', 'sad', 'sorrow'] },
  { emotion: 'energetic', needles: ['激昂', '活力', '热血', '燃', 'energetic', 'powerful', '狂欢'] },
  { emotion: 'calm', needles: ['舒缓', '平静', '抒情', 'calm', 'peaceful', '平静抒情'] },
  { emotion: 'angry', needles: ['愤怒', '怒', 'angry', 'rage'] },
  { emotion: 'romantic', needles: ['浪漫', '甜蜜', '温柔', 'romantic', 'sweet', 'love'] },
  { emotion: 'melancholic', needles: ['忧郁', '思念', '抑郁', 'melanchol', 'longing', 'nostalg'] },
  { emotion: 'uplifting', needles: ['振奋', '励志', '治愈', 'healing', 'inspiring', 'uplift'] },
  { emotion: 'relaxed', needles: ['放松', '惬意', '轻松', 'relax', 'chill'] },
  { emotion: 'tense', needles: ['紧张', '压抑', '暗黑', 'tense', 'dark', 'anxious'] },
  { emotion: 'neutral', needles: ['中性', 'neutral'] },
];

/**
 * Map a single platform label (CN/EN) to EmotionTag; null if unknown.
 */
export function mapPlatformEmotionLabel(label: string): EmotionTag | null {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return null;
  for (const entry of LABEL_TO_EMOTION) {
    for (const needle of entry.needles) {
      if (normalized.includes(needle.toLowerCase())) {
        return entry.emotion;
      }
    }
  }
  return null;
}

/**
 * Pick the best emotion from a bag of label strings (first strong non-neutral match wins by vote).
 */
export function pickEmotionFromPlatformLabels(labels: string[]): EmotionTag | null {
  const votes = new Map<EmotionTag, number>();
  for (const label of labels) {
    const mapped = mapPlatformEmotionLabel(label);
    if (!mapped || mapped === 'neutral') continue;
    votes.set(mapped, (votes.get(mapped) || 0) + 1);
  }
  let best: EmotionTag | null = null;
  let bestCount = 0;
  for (const [emotion, count] of votes) {
    if (count > bestCount) {
      best = emotion;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Collect string leaves from wiki/summary JSON (breadth-limited).
 */
export function collectPlatformLabelCandidates(payload: unknown, max = 80): string[] {
  const out: string[] = [];
  const queue: unknown[] = [payload];
  const seen = new Set<unknown>();

  while (queue.length > 0 && out.length < max) {
    const node = queue.shift();
    if (node == null || seen.has(node)) continue;
    if (typeof node === 'object') seen.add(node);

    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (trimmed.length >= 2 && trimmed.length <= 24) {
        out.push(trimmed);
      }
      continue;
    }

    if (Array.isArray(node)) {
      for (const item of node) queue.push(item);
      continue;
    }

    if (typeof node === 'object') {
      for (const value of Object.values(node as Record<string, unknown>)) {
        queue.push(value);
      }
    }
  }

  return out;
}
