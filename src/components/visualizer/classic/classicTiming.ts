import { DEFAULT_CLASSIC_TUNING, type ClassicTuning, type Line, type Word as WordType } from '../../../types';
import { getLineRenderEndTime, getLineRenderHints } from '../../../utils/lyrics/renderHints';
import { LYRIC_MOTION_BLUR_PX, lyricBlurFilter } from '../../../utils/lyrics/lyricMotionClarity';
import type { ClassicLineRenderProfile } from './classicTypes';

// src/components/visualizer/classic/classicTiming.ts
// Discrete classic line/word timing helpers — no per-frame React state.

const clampClassicBreathingFloatMultiplier = (value: number) => Math.min(2, Math.max(0, value));
const clampClassicWordSpacing = (value: number) => Math.min(2, Math.max(0, value));

export const resolveClassicTuning = (tuning?: ClassicTuning): ClassicTuning => ({
    enableWordRotation: tuning?.enableWordRotation ?? DEFAULT_CLASSIC_TUNING.enableWordRotation,
    breathingFloatMultiplier: clampClassicBreathingFloatMultiplier(
        tuning?.breathingFloatMultiplier ?? DEFAULT_CLASSIC_TUNING.breathingFloatMultiplier,
    ),
    useLegacyLayout: tuning?.useLegacyLayout ?? DEFAULT_CLASSIC_TUNING.useLegacyLayout,
    wordSpacing: clampClassicWordSpacing(tuning?.wordSpacing ?? DEFAULT_CLASSIC_TUNING.wordSpacing ?? 0.7),
});

export const resolveClassicLineRenderProfile = (line: Line | null | undefined): ClassicLineRenderProfile | null => {
    if (!line) {
        return null;
    }

    const renderHints = getLineRenderHints(line);
    const wordRevealMode = renderHints?.wordRevealMode ?? 'normal';

    return {
        renderHints,
        lineRenderEndTime: getLineRenderEndTime(line),
        lineTransitionMode: renderHints?.lineTransitionMode ?? 'normal',
        wordRevealMode,
        wordLookahead: wordRevealMode === 'instant' ? 0.03 : wordRevealMode === 'fast' ? 0.08 : 0.15,
    };
};

export const getClassicWordActiveEndTime = (word: WordType, renderProfile: ClassicLineRenderProfile) => {
    if (renderProfile.wordRevealMode === 'instant') {
        return renderProfile.lineRenderEndTime;
    }

    if (renderProfile.wordRevealMode === 'fast') {
        return Math.min(renderProfile.lineRenderEndTime, Math.max(word.endTime, word.startTime + 0.12));
    }

    return word.endTime;
};

export const getClassicWordDisplayDuration = (word: WordType, renderProfile: ClassicLineRenderProfile) => {
    const activeEndTime = getClassicWordActiveEndTime(word, renderProfile);
    const minDuration = renderProfile.wordRevealMode === 'instant'
        ? 0.08
        : renderProfile.wordRevealMode === 'fast'
            ? 0.12
            : 0.1;

    return Math.max(activeEndTime - word.startTime, minDuration);
};

export const getClassicLineContainerMotion = (renderProfile: ClassicLineRenderProfile | null) => {
    if (renderProfile?.lineTransitionMode === 'none') {
        return {
            initial: { opacity: 1, scale: 1, filter: lyricBlurFilter(0) },
            animate: { opacity: 1, scale: 1, filter: lyricBlurFilter(0), transitionEnd: { filter: 'none' } },
            exit: {
                opacity: 0,
                scale: 1.02,
                filter: lyricBlurFilter(LYRIC_MOTION_BLUR_PX.exitNone),
                transition: { duration: 0.12, ease: 'easeOut' as const },
            },
        };
    }

    if (renderProfile?.lineTransitionMode === 'fast') {
        return {
            initial: { opacity: 0.35, scale: 0.96, filter: lyricBlurFilter(LYRIC_MOTION_BLUR_PX.enter) },
            animate: {
                opacity: 1,
                scale: 1,
                filter: lyricBlurFilter(0),
                transition: { duration: 0.16, ease: 'easeOut' as const },
                transitionEnd: { filter: 'none' },
            },
            exit: {
                opacity: 0,
                scale: 1.04,
                filter: lyricBlurFilter(LYRIC_MOTION_BLUR_PX.exitFast),
                transition: { duration: 0.16, ease: 'easeInOut' as const },
            },
        };
    }

    return {
        initial: { opacity: 0, scale: 0.96, rotateX: 8, z: -36, filter: lyricBlurFilter(LYRIC_MOTION_BLUR_PX.enter) },
        animate: {
            opacity: 1,
            scale: 1,
            rotateX: 0,
            z: 0,
            filter: lyricBlurFilter(0),
            transitionEnd: { filter: 'none' },
        },
        exit: {
            opacity: 0,
            scale: 1.04,
            rotateX: -6,
            z: -24,
            filter: lyricBlurFilter(LYRIC_MOTION_BLUR_PX.exit),
            transition: { duration: 0.24 },
        },
    };
};
