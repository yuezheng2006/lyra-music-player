// src/utils/mediaSessionSeekMath.ts
// Resolve Media Session seekbackward / seekforward / seekto times.

const DEFAULT_SEEK_OFFSET_SEC = 10;

export const resolveMediaSessionSeekTime = (
    currentTime: number,
    duration: number,
    details: { seekTime?: number; seekOffset?: number } | null | undefined,
    direction: 'to' | 'backward' | 'forward',
) => {
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const safeCurrent = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
    const offset = Number.isFinite(details?.seekOffset)
        ? Number(details?.seekOffset)
        : DEFAULT_SEEK_OFFSET_SEC;

    let next = safeCurrent;
    if (direction === 'to' && Number.isFinite(details?.seekTime)) {
        next = Number(details?.seekTime);
    } else if (direction === 'backward') {
        next = safeCurrent - offset;
    } else if (direction === 'forward') {
        next = safeCurrent + offset;
    }

    if (safeDuration > 0) {
        return Math.min(Math.max(next, 0), safeDuration);
    }
    return Math.max(next, 0);
};
