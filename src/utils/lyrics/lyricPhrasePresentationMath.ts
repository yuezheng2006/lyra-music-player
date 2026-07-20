import type { LineTimingClass } from './renderHints';

// src/utils/lyrics/lyricPhrasePresentationMath.ts
// 乐句感：副歌 / 气口 / 主歌 → 克制的字号、字距、入场与词级缩放（不喧宾夺主）。

export type LyricPhraseKind = 'verse' | 'chorus' | 'breath';

export type LyricPhrasePresentation = {
    kind: LyricPhraseKind;
    /** Multiplier on lyricsFontScale / container fit. */
    fontScaleMul: number;
    /** Multiplier on preset letter-spacing px. */
    letterSpacingMul: number;
    /** Multiplier on inter-word gap (em-based). */
    wordGapMul: number;
    /** Active-word punch scale (rest words stay near 1). */
    wordActiveScale: number;
    lineEnterFromScale: number;
    lineEnterFromY: number;
    lineEnterDuration: number;
};

const VERSE: LyricPhrasePresentation = {
    kind: 'verse',
    fontScaleMul: 1,
    letterSpacingMul: 1,
    wordGapMul: 1,
    wordActiveScale: 1.08,
    lineEnterFromScale: 0.72,
    lineEnterFromY: 28,
    lineEnterDuration: 0.42,
};

const CHORUS: LyricPhrasePresentation = {
    kind: 'chorus',
    fontScaleMul: 1.1,
    letterSpacingMul: 1.06,
    wordGapMul: 1.1,
    wordActiveScale: 1.12,
    lineEnterFromScale: 0.7,
    lineEnterFromY: 24,
    lineEnterDuration: 0.4,
};

const BREATH: LyricPhrasePresentation = {
    kind: 'breath',
    fontScaleMul: 0.96,
    letterSpacingMul: 0.92,
    wordGapMul: 0.88,
    wordActiveScale: 1.04,
    lineEnterFromScale: 0.9,
    lineEnterFromY: 12,
    lineEnterDuration: 0.26,
};

/** Chorus wins over short/micro breath so marked hooks stay present. */
export const resolveLyricPhraseKind = (input: {
    isChorus?: boolean;
    timingClass?: LineTimingClass | null;
}): LyricPhraseKind => {
    if (input.isChorus) return 'chorus';
    if (input.timingClass === 'short' || input.timingClass === 'micro') return 'breath';
    return 'verse';
};

export const resolveLyricPhrasePresentation = (
    kindOrInput: LyricPhraseKind | {
        isChorus?: boolean;
        timingClass?: LineTimingClass | null;
    },
): LyricPhrasePresentation => {
    const kind = typeof kindOrInput === 'string'
        ? kindOrInput
        : resolveLyricPhraseKind(kindOrInput);

    switch (kind) {
        case 'chorus':
            return CHORUS;
        case 'breath':
            return BREATH;
        default:
            return VERSE;
    }
};
