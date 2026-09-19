// src/utils/lyrics/splitPodcastCaptionCues.ts
// Break shownote paragraphs into subtitle-length cues instead of lyric-sized blocks.

const CJK_RE = /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/;
const SENTENCE_SPLIT_RE = /(?<=[。！？!?；;…])\s*/;
const SOFT_BREAK_CHARS = new Set(['，', ',', '、', '：', ':', ' ']);

const countGraphemes = (text: string): number => Array.from(text).length;

const isCjkHeavy = (text: string): boolean => {
    const chars = Array.from(text);
    if (chars.length === 0) return false;
    const cjk = chars.filter((char) => CJK_RE.test(char)).length;
    return cjk >= chars.length * 0.35;
};

const cueLimits = (text: string): { target: number; max: number } => (
    isCjkHeavy(text) ? { target: 28, max: 48 } : { target: 64, max: 110 }
);

const sliceGraphemes = (text: string, start: number, end?: number): string => (
    Array.from(text).slice(start, end).join('')
);

const findSoftCut = (text: string, target: number, max: number): number => {
    const chars = Array.from(text);
    const upper = Math.min(max, chars.length);
    const lower = Math.max(Math.floor(target * 0.55), 1);
    for (let index = Math.min(target, upper) - 1; index >= lower; index -= 1) {
        if (SOFT_BREAK_CHARS.has(chars[index] ?? '')) {
            return index + 1;
        }
    }
    return Math.min(target, upper);
};

const wrapLongCue = (text: string, target: number, max: number): string[] => {
    const cues: string[] = [];
    let rest = text.trim();
    while (countGraphemes(rest) > max) {
        const cut = findSoftCut(rest, target, max);
        const piece = sliceGraphemes(rest, 0, cut).replace(/[，,、\s]+$/u, '').trim();
        if (piece) cues.push(piece);
        rest = sliceGraphemes(rest, cut).replace(/^[，,、\s]+/u, '').trim();
    }
    if (rest) cues.push(rest);
    return cues;
};

/** Split a paragraph into short cues that read as subtitles, not lyric stanzas. */
export const splitPodcastCaptionCues = (paragraph: string): string[] => {
    const text = String(paragraph || '').replace(/\s+/g, ' ').trim();
    if (!text) return [];
    const { target, max } = cueLimits(text);
    if (countGraphemes(text) <= max) return [text];

    const sentences = text.split(SENTENCE_SPLIT_RE).map((part) => part.trim()).filter(Boolean);
    const cues: string[] = [];
    let buffer = '';
    sentences.forEach((sentence) => {
        const next = buffer ? `${buffer}${sentence}` : sentence;
        if (buffer && countGraphemes(next) > max) {
            cues.push(...wrapLongCue(buffer, target, max));
            buffer = sentence;
            return;
        }
        buffer = next;
    });
    if (buffer) cues.push(...wrapLongCue(buffer, target, max));
    return cues.filter(Boolean);
};
