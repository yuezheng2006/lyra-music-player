import React, { useMemo } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import type { GraphemeTiming } from '../../utils/lyrics/graphemeTiming';
import {
    buildKaraokeWipeMaskImage,
    resolveKaraokeWipeFillWidth,
} from '../../utils/lyrics/karaokeWipeMath';
import { measureLyricGraphemeOffsets } from '../../utils/lyrics/measureLyricGraphemeOffsets';
import {
    buildLyricKaraokeOutlineLayers,
    type LyricVisualEffectIntensity,
} from '../../utils/lyricVisualEffects';

// src/components/visualizer/LyricKaraokeWipe.tsx
// Traditional LTR karaoke wipe fill for DOM lyric modes (classic / partita). Monet keeps its private sweep.

export type LyricKaraokeWipeProps = {
    text: string;
    startTime: number;
    endTime: number;
    graphemeTimings?: readonly GraphemeTiming[];
    currentTime: MotionValue<number>;
    /** When false, wipe stays empty and only the underlay shows. */
    active?: boolean;
    wordColor: string;
    baseColor: string;
    fontPx: number;
    fontSpec: string;
    enableStroke?: boolean;
    intensity?: LyricVisualEffectIntensity;
    className?: string;
};

const LyricKaraokeWipe: React.FC<LyricKaraokeWipeProps> = ({
    text,
    startTime,
    endTime,
    graphemeTimings = [],
    currentTime,
    active = true,
    wordColor,
    baseColor,
    fontPx,
    fontSpec,
    enableStroke = true,
    intensity = 'strong',
    className = '',
}) => {
    const outlineLayers = useMemo(
        () => buildLyricKaraokeOutlineLayers(wordColor, fontPx, intensity),
        [fontPx, intensity, wordColor],
    );
    const graphemeOffsets = useMemo(
        () => measureLyricGraphemeOffsets(text, fontPx, fontSpec),
        [text, fontPx, fontSpec],
    );

    const fillWidth = useTransform(currentTime, latest => (
        resolveKaraokeWipeFillWidth({
            time: latest,
            startTime,
            endTime,
            graphemeOffsets,
            graphemeTimings,
            active,
        })
    ));

    const maskImage = useTransform(fillWidth, latest => (
        buildKaraokeWipeMaskImage(latest, fontPx)
    ));

    return (
        <span className={`relative inline-block whitespace-nowrap ${className}`.trim()}>
            {enableStroke && active ? (
                <motion.span
                    aria-hidden
                    className="lyric-karaoke-rim pointer-events-none absolute inset-0 select-none block"
                    style={{
                        WebkitMaskImage: maskImage,
                        maskImage,
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        color: outlineLayers.rimColor,
                        transform: `scale(${outlineLayers.rimScale})`,
                        transformOrigin: 'center center',
                        textShadow: outlineLayers.rimTextShadow,
                    }}
                >
                    {text}
                </motion.span>
            ) : null}
            <span className="relative block" style={{ color: baseColor }}>
                {text}
            </span>
            {active ? (
                <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 block"
                    style={{
                        WebkitMaskImage: maskImage,
                        maskImage,
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        color: wordColor,
                        filter: enableStroke ? outlineLayers.fillFilter : undefined,
                    }}
                >
                    {text}
                </motion.span>
            ) : null}
        </span>
    );
};

export default LyricKaraokeWipe;
