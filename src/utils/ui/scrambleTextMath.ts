// src/utils/ui/scrambleTextMath.ts
// DIY scramble reveal frames for emotion chip label (Variant B).

export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789░▒▓#*';

/**
 * Build one scramble frame; characters before revealedCount are final.
 */
export function buildScrambleFrame(
  text: string,
  revealedCount: number,
  randomGlyph: () => string = () => SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0],
): string {
  const chars = Array.from(text);
  const safeRevealed = Math.max(0, Math.min(chars.length, revealedCount));
  return chars
    .map((ch, index) => {
      if (ch === ' ') return ' ';
      if (index < safeRevealed) return ch;
      return randomGlyph();
    })
    .join('');
}

/**
 * Progress 0..1 → how many graphemes are revealed.
 */
export function scrambleRevealedCount(text: string, progress: number): number {
  const len = Array.from(text).length;
  if (len === 0) return 0;
  const t = Math.max(0, Math.min(1, progress));
  return Math.floor(t * len);
}
