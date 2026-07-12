import React, { useMemo, useState } from 'react';
import { motion, useMotionValueEvent, type MotionValue } from 'framer-motion';
import type { Word as WordType } from '../../../types';
import { buildWordGraphemeTimings } from '../../../utils/lyrics/graphemeTiming';
import {
    combineShadowEffects,
    getStrokeStyle,
    type LyricVisualEffectConfig,
} from '../../../utils/lyricVisualEffects';
import type { WaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { colorWithAlpha } from '../colorMix';

// src/components/visualizer/dazibao/dazibaoWordStage.tsx
// 野火走位词级砸脸；字体/颜色/特效由 visualEffectConfig 驱动。

type WordStatus = 'waiting' | 'active' | 'passed';

type DazibaoWordProps = {
    word: WordType;
    currentTime: MotionValue<number>;
    baseColor: string;
    activeColor: string;
    glowColor: string;
    strokeColor: string;
    fontPx: number;
    fontStack: string;
    fontWeight: number;
    letterSpacingPx: number;
    waitingPresentation: WaitingWordPresentation;
    visualEffectConfig: LyricVisualEffectConfig;
    isChorus: boolean;
    lookaheadSec?: number;
};

const DazibaoWord: React.FC<DazibaoWordProps> = ({
    word,
    currentTime,
    baseColor,
    activeColor,
    glowColor,
    strokeColor,
    fontPx,
    fontStack,
    fontWeight,
    letterSpacingPx,
    waitingPresentation,
    visualEffectConfig,
    isChorus,
    lookaheadSec = 0.08,
}) => {
    const [status, setStatus] = useState<WordStatus>('waiting');
    const graphemeTimings = useMemo(() => buildWordGraphemeTimings(word), [word]);
    const activeEnd = Math.max(word.endTime, word.startTime + 0.1);

    useMotionValueEvent(currentTime, 'change', (latest: number) => {
        let next: WordStatus = 'waiting';
        if (latest >= word.startTime - lookaheadSec && latest <= activeEnd) {
            next = 'active';
        } else if (latest > activeEnd) {
            next = 'passed';
        }
        if (next !== status) {
            setStatus(next);
        }
    });

    const stroke = useMemo(() => {
        if (!visualEffectConfig.enableStroke) {
            return { WebkitTextStroke: '0', paintOrder: 'normal' as const };
        }
        const width = Math.max(1.2, fontPx * (isChorus ? 0.05 : 0.032));
        return getStrokeStyle(strokeColor, width, visualEffectConfig.immersive);
    }, [fontPx, isChorus, strokeColor, visualEffectConfig.enableStroke, visualEffectConfig.immersive]);

    const activeShadow = useMemo(() => {
        if (visualEffectConfig.enableIntenseGlow) {
            return combineShadowEffects(activeColor, glowColor, visualEffectConfig);
        }
        return `0 0 ${Math.round(fontPx * 0.2)}px ${colorWithAlpha(glowColor, 0.25)}`;
    }, [activeColor, fontPx, glowColor, visualEffectConfig]);

    const passedShadow = useMemo(
        () => `0 0 ${Math.round(fontPx * 0.35)}px ${colorWithAlpha(glowColor, 0.4)}`,
        [fontPx, glowColor],
    );

    const scaleTarget = status === 'active'
        ? (isChorus ? 1.14 : 1.08)
        : status === 'passed'
            ? 1
            : (waitingPresentation.parkAtRest ? 1 : 0.92);

    const opacityTarget = status === 'waiting'
        ? waitingPresentation.opacity
        : status === 'passed'
            ? 0.88
            : 1;

    const faceColor = status === 'waiting' ? baseColor : activeColor;

    const glyph = graphemeTimings.length > 1
        ? graphemeTimings.map((timing, index) => (
            <span key={`${timing.char}-${index}`}>{timing.char}</span>
        ))
        : word.text;

    const sharedType: React.CSSProperties = {
        fontFamily: fontStack,
        fontSize: `${fontPx}px`,
        fontWeight,
        letterSpacing: `${letterSpacingPx}px`,
        lineHeight: 1.05,
    };

    return (
        <motion.span
            className="relative inline-block origin-center whitespace-nowrap will-change-transform"
            initial={false}
            animate={{
                scale: status === 'active' ? [1.4, scaleTarget] : scaleTarget,
                opacity: opacityTarget,
                y: status === 'active' ? [12, 0] : 0,
                filter: status === 'waiting' && waitingPresentation.blurPx > 0
                    ? `blur(${waitingPresentation.blurPx}px)`
                    : 'blur(0px)',
            }}
            transition={{
                scale: status === 'active'
                    ? { duration: 0.3, times: [0, 1], ease: [0.16, 1.25, 0.32, 1] }
                    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.18 },
                y: { duration: 0.3, ease: [0.16, 1.25, 0.32, 1] },
                filter: { duration: 0.2 },
            }}
        >
            <span
                className="relative z-[1] inline-block"
                style={{
                    ...sharedType,
                    color: faceColor,
                    textShadow: status === 'active'
                        ? activeShadow
                        : status === 'passed'
                            ? passedShadow
                            : 'none',
                    WebkitTextStroke: status === 'waiting' ? '0' : stroke.WebkitTextStroke,
                    paintOrder: stroke.paintOrder,
                }}
            >
                {glyph}
            </span>
        </motion.span>
    );
};

export default DazibaoWord;
