import type { CSSProperties } from 'react';

// src/utils/visualizer/coverAtmosphereDownsample.ts
// Apple Music / YouLyPlus: blur a tiny cover bitmap, then upscale. Never live-blur a 1:1 viewport.

export const COVER_ATMOSPHERE_SOURCE_SIZE_PCT = 16;
export const COVER_ATMOSPHERE_BLUR_PX = 7;
export const COVER_ATMOSPHERE_UPSCALE = 8;

export const resolveCoverAtmosphereDownsampleStyle = (
    coverUrl: string,
): CSSProperties => ({
    position: 'absolute',
    width: `${COVER_ATMOSPHERE_SOURCE_SIZE_PCT}%`,
    height: `${COVER_ATMOSPHERE_SOURCE_SIZE_PCT}%`,
    left: `${(100 - COVER_ATMOSPHERE_SOURCE_SIZE_PCT) / 2}%`,
    top: `${(100 - COVER_ATMOSPHERE_SOURCE_SIZE_PCT) / 2}%`,
    transform: `scale(${COVER_ATMOSPHERE_UPSCALE})`,
    transformOrigin: 'center center',
    backgroundImage: `url(${coverUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: `blur(${COVER_ATMOSPHERE_BLUR_PX}px) saturate(1.35) brightness(1.05)`,
});
