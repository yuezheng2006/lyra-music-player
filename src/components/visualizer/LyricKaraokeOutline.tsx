import React from 'react';
import {
    buildLyricKaraokeOutlineLayers,
    type LyricVisualEffectIntensity,
} from '../../utils/lyricVisualEffects';

// src/components/visualizer/LyricKaraokeOutline.tsx
// Karaoke 色字白边: scaled solid rim + text-shadow ring (calligraphy-safe; no -webkit-text-stroke).

type LyricKaraokeOutlineProps = {
    text: React.ReactNode;
    fillColor: string;
    /** When false, render fill only. */
    enabled?: boolean;
    className?: string;
    fontPx?: number;
    intensity?: LyricVisualEffectIntensity;
    /** Extra classes on the visible fill face. */
    fillClassName?: string;
};

/** Scale a white/dark solid twin behind the fill so outline stays visible on any font. */
export const LyricKaraokeOutline: React.FC<LyricKaraokeOutlineProps> = ({
    text,
    fillColor,
    enabled = true,
    className = '',
    fontPx = 48,
    intensity = 'strong',
    fillClassName = '',
}) => {
    if (!enabled) {
        return (
            <span className={`${className} ${fillClassName}`.trim()} style={{ color: fillColor }}>
                {text}
            </span>
        );
    }

    const layers = buildLyricKaraokeOutlineLayers(fillColor, fontPx, intensity);

    return (
        <span className={`relative inline-block ${className}`.trim()} data-testid="lyric-karaoke-outline">
            <span
                aria-hidden
                className="lyric-karaoke-rim pointer-events-none absolute inset-0 select-none"
                style={{
                    color: layers.rimColor,
                    transform: `scale(${layers.rimScale})`,
                    transformOrigin: 'center center',
                    textShadow: layers.rimTextShadow,
                    zIndex: 0,
                }}
            >
                {text}
            </span>
            <span
                className={`relative z-[1] ${fillClassName}`.trim()}
                style={{ color: fillColor }}
            >
                {text}
            </span>
        </span>
    );
};

export default LyricKaraokeOutline;
