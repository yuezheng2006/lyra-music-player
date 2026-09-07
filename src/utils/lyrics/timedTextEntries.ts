// src/utils/lyrics/timedTextEntries.ts
// Shared timed-text rows used by parserCore and Navidrome structured lyrics.

export type TimedTextEntry = {
    startTime: number;
    endTime?: number;
    text: string;
};

/** Align translation/roma rows onto already-sorted main-line start times. */
export const findTranslationsForSortedStartTimes = (
    startTimes: number[],
    entries: TimedTextEntry[],
): Array<string | undefined> => {
    if (startTimes.length === 0 || entries.length === 0) {
        return startTimes.map(() => undefined);
    }

    const translations: Array<string | undefined> = [];
    let upperIndex = 0;

    for (const startTime of startTimes) {
        while (upperIndex < entries.length && entries[upperIndex].startTime < startTime) {
            upperIndex += 1;
        }

        let bestEntry: TimedTextEntry | undefined;
        let bestDiff = 1.0;

        const previous = entries[upperIndex - 1];
        if (previous) {
            const diff = Math.abs(previous.startTime - startTime);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestEntry = previous;
            }
        }

        const current = entries[upperIndex];
        if (current) {
            const diff = Math.abs(current.startTime - startTime);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestEntry = current;
            }
        }

        translations.push(bestEntry?.text);
    }

    return translations;
};
