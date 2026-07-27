import { layoutWithLines, prepareWithSegments } from '@chenglou/pretext';
import { splitLyricGraphemes } from './graphemeTiming';

// src/utils/lyrics/measureLyricGraphemeOffsets.ts
// Cumulative grapheme widths for karaoke wipe edges (shared across DOM lyric modes).

const OFFSETS_CACHE_LIMIT = 256;
const graphemeOffsetsCache = new Map<string, number[]>();

const buildCacheKey = (text: string, fontPx: number, fontSpec: string) => (
    `${fontPx}|${fontSpec}|${text}`
);

const rememberOffsets = (key: string, offsets: number[]) => {
    if (graphemeOffsetsCache.size >= OFFSETS_CACHE_LIMIT) {
        const oldestKey = graphemeOffsetsCache.keys().next().value;
        if (oldestKey) {
            graphemeOffsetsCache.delete(oldestKey);
        }
    }
    graphemeOffsetsCache.set(key, offsets);
    return offsets;
};

const measureTextWidthAtPx = (text: string, fontPx: number, fontSpec: string): number => {
    const prepared = prepareWithSegments(text || ' ', fontSpec);
    const layout = layoutWithLines(prepared, 99999, fontPx * 1.2);
    return layout.lines[0]?.width ?? Math.max(text.length, 1) * fontPx * 0.6;
};

/** Builds cumulative grapheme offsets so the lyric fill edge can sweep through glyphs. */
export const measureLyricGraphemeOffsets = (
    text: string,
    fontPx: number,
    fontSpec: string,
): number[] => {
    const cacheKey = buildCacheKey(text, fontPx, fontSpec);
    const cached = graphemeOffsetsCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const graphemes = splitLyricGraphemes(text);
    const offsets = new Array<number>(graphemes.length + 1).fill(0);
    for (let index = 1; index <= graphemes.length; index += 1) {
        offsets[index] = measureTextWidthAtPx(graphemes.slice(0, index).join(''), fontPx, fontSpec);
    }
    return rememberOffsets(cacheKey, offsets);
};
