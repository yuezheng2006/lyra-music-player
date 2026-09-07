import type { LyricData } from '../../types';
import { alignLyricAlternateTracks, type LyricTimedText } from './alignLyricAlternateTracks';

// src/utils/lyrics/attachLyricAlternateTracks.ts
// Applies an aligned alternate track onto parsed lyric lines without re-parsing the primary.

export type LyricAlternateField = 'translation' | 'romanization';

export const attachAlignedAlternateTrack = (
    data: LyricData,
    entries: LyricTimedText[],
    field: LyricAlternateField,
): LyricData => {
    if (!data.lines.length || entries.length === 0) return data;

    const texts = alignLyricAlternateTracks(data.lines.map(line => line.startTime), entries);
    let changed = false;
    const lines = data.lines.map((line, index) => {
        const nextText = texts[index];
        if (!nextText || line[field]) return line;
        changed = true;
        return { ...line, [field]: nextText };
    });

    return changed ? { ...data, lines } : data;
};
