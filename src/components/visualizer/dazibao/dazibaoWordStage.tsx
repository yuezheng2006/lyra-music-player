import React, { useMemo, useState } from 'react';
import { motion, useMotionValueEvent, type MotionValue } from 'framer-motion';
import type { Word as WordType } from '../../../types';
import { buildWordGraphemeTimings } from '../../../utils/lyrics/graphemeTiming';
import {
    buildLyricKaraokeOutlineLayers,
    combineShadowEffects,
    type LyricVisualEffectConfig,
} from '../../../utils/lyricVisualEffects';
import type { ResolvedLyricEffectPack } from '../../../utils/lyricEffectPacks';
import type { WaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { colorWithAlpha } from '../colorMix';
import { LYRIC_LINE_OPACITY } from '../../../utils/theme/lyricColorPresets';

// src/components/visualizer/dazibao/dazibaoWordStage.tsx
// 野火走位词级砸脸；特效包为衬托，节拍通过舞台 CSS vars 微调（不喧宾夺主）。

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
    effectPack: ResolvedLyricEffectPack;
    /** Active-word punch from phrase presentation (verse/chorus/breath). */
    wordActiveScale: number;
    lookaheadSec?: number;
};

const DazibaoWord: React.FC<DazibaoWordProps> = ({
    word,
    currentTime,
    baseColor,
    activeColor,
    glowColor,
    strokeColor: _strokeColor,
    fontPx,
    fontStack,
    fontWeight,
    letterSpacingPx,
    waitingPresentation,
    visualEffectConfig,
    effectPack,
    wordActiveScale,
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

    const karaokeOutline = useMemo(() => {
        if (!visualEffectConfig.enableStroke || status !== 'active') {
            return null;
        }
        return buildLyricKaraokeOutlineLayers(activeColor, fontPx, visualEffectConfig.intensity);
    }, [activeColor, fontPx, status, visualEffectConfig.enableStroke, visualEffectConfig.intensity]);

    const activeShadow = useMemo(() => {
        const base = visualEffectConfig.enableIntenseGlow
            ? combineShadowEffects(activeColor, glowColor, visualEffectConfig)
            : `0 0 ${Math.round(fontPx * 0.2)}px ${colorWithAlpha(glowColor, 0.25)}`;
        if (effectPack.glowBoost <= 0) return base;
        // Soft static halo; beat lift comes from a separate opacity-driven layer + CSS var.
        const boostBlur = Math.round(fontPx * (0.22 + effectPack.glowBoost * 0.35));
        const boost = `0 0 ${boostBlur}px ${colorWithAlpha(glowColor, 0.22 + effectPack.glowBoost * 0.22)}`;
        return `${base}, ${boost}`;
    }, [activeColor, effectPack.glowBoost, fontPx, glowColor, visualEffectConfig]);

    const passedShadow = useMemo(
        () => `0 0 ${Math.round(fontPx * 0.35)}px ${colorWithAlpha(glowColor, 0.4)}`,
        [fontPx, glowColor],
    );

    const scaleTarget = status === 'active'
        ? wordActiveScale
        : status === 'passed'
            ? 1
            : (waitingPresentation.parkAtRest ? 1 : 0.92);

    const opacityTarget = status === 'waiting'
        ? waitingPresentation.opacity
        : status === 'passed'
            ? LYRIC_LINE_OPACITY.passedNear
            : LYRIC_LINE_OPACITY.active;

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

    const glitchActive = effectPack.glitch && status === 'active';
    const neonActive = effectPack.neonScan && status === 'active';
    const glowBeatActive = effectPack.glowBoost > 0 && status === 'active';

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
            <span className="relative z-[1] inline-block">
                {effectPack.echo ? (
                    <span
                        aria-hidden
                        className="absolute inset-0 select-none pointer-events-none"
                        style={{
                            ...sharedType,
                            color: colorWithAlpha('#000000', Math.min(0.7, effectPack.echoOpacity + 0.18)),
                            // Beat modulates opacity / micro-scale via stage CSS vars (no setState).
                            opacity: `calc(${effectPack.echoOpacity} * var(--lyric-pack-echo-mul, 1))`,
                            transform: `scale(calc(${effectPack.echoScale} * (0.92 + 0.08 * var(--lyric-pack-echo-mul, 1)))) translate(0.03em, 0.05em)`,
                            transformOrigin: 'center center',
                            filter: 'blur(0.35px)',
                        } as React.CSSProperties}
                    >
                        {glyph}
                    </span>
                ) : null}
                {glowBeatActive ? (
                    <span
                        aria-hidden
                        className="absolute inset-0 select-none pointer-events-none"
                        style={{
                            ...sharedType,
                            color: 'transparent',
                            opacity: `calc(${0.2 + effectPack.glowBoost * 0.25} * var(--lyric-pack-glow-mul, 1))`,
                            textShadow: `0 0 ${Math.round(fontPx * (0.18 + effectPack.glowBoost * 0.28))}px ${colorWithAlpha(glowColor, 0.55)}`,
                        } as React.CSSProperties}
                    >
                        {glyph}
                    </span>
                ) : null}
                {glitchActive ? (
                    <>
                        <span
                            aria-hidden
                            className="absolute inset-0 select-none pointer-events-none mix-blend-screen"
                            style={{
                                ...sharedType,
                                color: colorWithAlpha('#ff3b5c', 0.28),
                                opacity: 'calc(0.55 * var(--lyric-pack-glitch-mul, 1))',
                                transform: `translate(calc(${-effectPack.glitchOffsetPx}px * var(--lyric-pack-glitch-mul, 1)), 0)`,
                            } as React.CSSProperties}
                        >
                            {glyph}
                        </span>
                        <span
                            aria-hidden
                            className="absolute inset-0 select-none pointer-events-none mix-blend-screen"
                            style={{
                                ...sharedType,
                                color: colorWithAlpha('#3bd6ff', 0.28),
                                opacity: 'calc(0.55 * var(--lyric-pack-glitch-mul, 1))',
                                transform: `translate(calc(${effectPack.glitchOffsetPx}px * var(--lyric-pack-glitch-mul, 1)), 0)`,
                            } as React.CSSProperties}
                        >
                            {glyph}
                        </span>
                    </>
                ) : null}
                {karaokeOutline ? (
                    <span
                        aria-hidden
                        className="lyric-karaoke-rim absolute inset-0 select-none pointer-events-none"
                        style={{
                            ...sharedType,
                            color: karaokeOutline.rimColor,
                            transform: `scale(${karaokeOutline.rimScale})`,
                            transformOrigin: 'center center',
                            textShadow: karaokeOutline.rimTextShadow,
                        }}
                    >
                        {glyph}
                    </span>
                ) : null}
                <span
                    className={`relative inline-block${neonActive ? ' lyric-effect-neon-scan' : ''}`}
                    style={{
                        ...sharedType,
                        color: faceColor,
                        textShadow: status === 'active'
                            ? activeShadow
                            : status === 'passed'
                                ? passedShadow
                                : 'none',
                    }}
                >
                    {glyph}
                </span>
            </span>
        </motion.span>
    );
};

export default DazibaoWord;
