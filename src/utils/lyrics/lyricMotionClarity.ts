// src/utils/lyrics/lyricMotionClarity.ts
// Caps lyric motion blur so glyphs stay sharp and readable (opacity dims; blur stays light).

/** Soft blur budgets in px — heavy blur dazzles and muddies CJK. */
export const LYRIC_MOTION_BLUR_PX = {
    /** Waiting / parked glyphs: stay optically sharp. */
    waiting: 0,
    /** Soft line enter hint. */
    enter: 2,
    /** Fast line exit. */
    exitFast: 3,
    /** Normal line exit (was often 10–20px). */
    exit: 5,
    /** Minimal exit when transition mode is none. */
    exitNone: 2,
} as const;

export const lyricBlurFilter = (px: number): string => (
    px <= 0 ? 'none' : `blur(${px}px)`
);
