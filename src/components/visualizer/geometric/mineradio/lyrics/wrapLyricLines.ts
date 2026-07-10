import {
    lyricFontCss,
    lyricMeasureText,
    type LyricFontStyle,
    DEFAULT_LYRIC_FONT_STYLE,
} from './lyricCanvasHelpers';

// src/components/visualizer/geometric/mineradio/lyrics/wrapLyricLines.ts
// Balanced CJK-aware wrapping for Mineradio stage lyric masks.

const BREAK_AFTER = new Set('，。！？、；：,.!?;:…—-~· ');

const splitGraphemes = (text: string): string[] => {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        try {
            const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
            return Array.from(segmenter.segment(text), ({ segment }) => segment);
        } catch {
            // fall through
        }
    }
    return Array.from(text);
};

const measure = (
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    style: LyricFontStyle,
) => lyricMeasureText(ctx, text, fontSize, style);

/**
 * For two-line wraps, pick a break that minimizes the wider line
 * (balanced layout) while keeping both lines within maxWidth when possible.
 */
const wrapBalancedTwoLines = (
    ctx: CanvasRenderingContext2D,
    graphemes: string[],
    fontSize: number,
    maxWidth: number,
    style: LyricFontStyle,
): { lines: string[]; widest: number } => {
    let bestBreak = Math.max(1, Math.floor(graphemes.length / 2));
    let bestScore = Number.POSITIVE_INFINITY;
    let bestWidest = Number.POSITIVE_INFINITY;

    const minBreak = 1;
    const maxBreak = graphemes.length - 1;
    for (let breakAt = minBreak; breakAt <= maxBreak; breakAt += 1) {
        const line1 = graphemes.slice(0, breakAt).join('');
        const line2 = graphemes.slice(breakAt).join('');
        const w1 = measure(ctx, line1, fontSize, style);
        const w2 = measure(ctx, line2, fontSize, style);
        const widest = Math.max(w1, w2);
        const balance = Math.abs(w1 - w2);
        const overflow = Math.max(0, widest - maxWidth);
        // Prefer no overflow, then smaller widest, then more balanced, then soft breaks.
        const softBonus = BREAK_AFTER.has(graphemes[breakAt - 1]) ? -8 : 0;
        const score = overflow * 10000 + widest + balance * 0.15 + softBonus;
        if (score < bestScore) {
            bestScore = score;
            bestBreak = breakAt;
            bestWidest = widest;
        }
    }

    const lines = [
        graphemes.slice(0, bestBreak).join(''),
        graphemes.slice(bestBreak).join(''),
    ];
    return { lines, widest: Math.max(1, bestWidest) };
};

/**
 * Wrap a lyric line into at most `maxLines` rows that fit `maxWidth`.
 * Returns measured widest line width for the chosen font.
 */
export const wrapLyricLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    maxWidth: number,
    maxLines: number,
    style: LyricFontStyle = DEFAULT_LYRIC_FONT_STYLE,
): { lines: string[]; widest: number } => {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return { lines: [''], widest: 1 };

    ctx.font = lyricFontCss(fontSize, style);
    const singleWidth = measure(ctx, normalized, fontSize, style);
    if (singleWidth <= maxWidth || maxLines <= 1) {
        return { lines: [normalized], widest: Math.max(1, singleWidth) };
    }

    const graphemes = splitGraphemes(normalized);
    if (maxLines === 2 && graphemes.length >= 2) {
        return wrapBalancedTwoLines(ctx, graphemes, fontSize, maxWidth, style);
    }

    // Fallback greedy wrap for >2 lines.
    const lines: string[] = [];
    let cursor = 0;
    while (cursor < graphemes.length && lines.length < maxLines) {
        const remaining = graphemes.length - cursor;
        const linesLeft = maxLines - lines.length;
        if (linesLeft === 1) {
            lines.push(graphemes.slice(cursor).join(''));
            break;
        }

        let low = 1;
        let high = remaining;
        let fitCount = 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const slice = graphemes.slice(cursor, cursor + mid).join('');
            const width = measure(ctx, slice, fontSize, style);
            if (width <= maxWidth) {
                fitCount = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (fitCount >= remaining) {
            lines.push(graphemes.slice(cursor).join(''));
            break;
        }

        const take = Math.max(1, fitCount);
        lines.push(graphemes.slice(cursor, cursor + take).join(''));
        cursor += take;
    }

    const widest = Math.max(
        1,
        ...lines.map(line => measure(ctx, line, fontSize, style)),
    );
    return { lines, widest };
};
