// src/components/command-palette/search/fuzzyScore.ts
// Subsequence scorer (a slim fzf) used only as the lowest command-palette match tier.

const BOUNDARY_CHARS = new Set([' ', '-', '_', ':', '|', '.', '/']);

const isBoundary = (character: string) => BOUNDARY_CHARS.has(character);

const CONSECUTIVE_BONUS = 8;
const BOUNDARY_BONUS = 6;
const PLAIN_BONUS = 1;
const GAP_PENALTY = 0.5;
const LENGTH_PENALTY = 0.05;

/**
 * Whether `needle` is a subsequence of `haystack` worth showing.
 * Call per field — never on a concatenated blob, or long pinyin will match anything.
 */
export const scoreSubsequence = (haystack: string, needle: string): number | null => {
    if (!needle || !haystack || needle.length > haystack.length) {
        return null;
    }

    let cursor = 0;
    let score = 0;
    let gaps = 0;
    let previousIndex = -2;

    for (let i = 0; i < needle.length; i += 1) {
        const found = haystack.indexOf(needle[i], cursor);
        if (found < 0) {
            return null;
        }

        if (found === previousIndex + 1) {
            score += CONSECUTIVE_BONUS;
        } else if (found === 0 || isBoundary(haystack[found - 1])) {
            score += BOUNDARY_BONUS;
        } else {
            score += PLAIN_BONUS;
        }

        gaps += found - cursor;
        previousIndex = found;
        cursor = found + 1;
    }

    const raw = score - gaps * GAP_PENALTY - (haystack.length - needle.length) * LENGTH_PENALTY;
    return raw > 0 ? raw : null;
};
