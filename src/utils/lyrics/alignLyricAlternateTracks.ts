// src/utils/lyrics/alignLyricAlternateTracks.ts
// Aligns translation / romanization tracks onto primary line start times.

export type LyricTimedText = {
    startTime: number;
    text: string;
};

const NEAREST_WINDOW_SEC = 1;

const alignByNearest = (startTimes: number[], entries: LyricTimedText[]): Array<string | undefined> => {
    if (entries.length === 0) return startTimes.map(() => undefined);
    const sorted = [...entries].sort((left, right) => left.startTime - right.startTime);
    return startTimes.map((startTime) => {
        let best: LyricTimedText | undefined;
        let bestDiff = NEAREST_WINDOW_SEC;
        for (const entry of sorted) {
            const diff = Math.abs(entry.startTime - startTime);
            if (diff < bestDiff) {
                bestDiff = diff;
                best = entry;
            }
        }
        return best?.text;
    });
};

/**
 * Prefer exact millisecond hits (same writer / container). If no exact hit exists
 * anywhere, fall back to nearest-neighbour within 1s.
 */
export const alignLyricAlternateTracks = (
    startTimes: number[],
    entries: LyricTimedText[],
): Array<string | undefined> => {
    if (entries.length === 0) return startTimes.map(() => undefined);

    const exactByMs = new Map<number, string>();
    for (const entry of entries) {
        const key = Math.round(entry.startTime * 1000);
        if (!exactByMs.has(key)) exactByMs.set(key, entry.text);
    }

    const exact = startTimes.map(startTime => exactByMs.get(Math.round(startTime * 1000)));
    if (exact.some(text => text !== undefined)) return exact;
    return alignByNearest(startTimes, entries);
};
