import React, { useMemo, useState } from 'react';
import { motion, useMotionValueEvent, type MotionValue } from 'framer-motion';
import type { Word as WordType } from '../../../types';
import { buildWordGraphemeTimings } from '../../../utils/lyrics/graphemeTiming';
import {
    resolveLyricWordStatus,
    type LyricWordStatus,
} from '../../../utils/lyrics/lyricWordStatusMath';
import {
    buildLyricKaraokeOutlineLayers,
    combineShadowEffects,
    type LyricVisualEffectConfig,
} from '../../../utils/lyricVisualEffects';
import type { ResolvedLyricEffectPack } from '../../../utils/lyricEffectPacks';
import type { WaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { colorWithAlpha } from '../colorMix';
import { LYRIC_LINE_OPACITY } from '../../../utils/theme/lyricColorPresets';
import LyricEffectPackLayers, { isLyricEffectPackNeonActive } from '../LyricEffectPackLayers';

// src/components/visualizer/dazibao/dazibaoWordStage.tsx
// 野火走位词级砸脸；特效包为衬托，节拍通过舞台 CSS vars 微调（不喧宾夺主）。

type WordStatus = LyricWordStatus;

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

    useMotionValueEvent(currentTime, 'change', (latest: number) => {
        const next = resolveLyricWordStatus(latest, word.startTime, word.endTime, lookaheadSec);
        // Functional update avoids stale-closure skips when the main thread is busy (3D).
        setStatus((prev) => (prev === next ? prev : next));
    });

    const karaokeOutline = useMemo(() => {
        if (!visualEffectConfig.enableStroke || status !== 'active') {
            return null;
        }
        return buildLyricKaraokeOutlineLayers(activeColor, fontPx, visualEffectConfig.intensity);
    }, [activeColor, fontPx, status, visualEffectConfig.enableStroke, visualEffectConfig.intensity]);

    // Prefer solid ink over soft halos — glow/text-shadow makes brush glyphs hard to read.
    const activeShadow = useMemo(() => {
        if (!visualEffectConfig.enableIntenseGlow) return 'none';
        const base = combineShadowEffects(activeColor, glowColor, visualEffectConfig);
        if (effectPack.glowBoost <= 0) return base;
        const boostBlur = Math.round(fontPx * (0.22 + effectPack.glowBoost * 0.35));
        const boost = `0 0 ${boostBlur}px ${colorWithAlpha(glowColor, 0.22 + effectPack.glowBoost * 0.22)}`;
        return `${base}, ${boost}`;
    }, [activeColor, effectPack.glowBoost, fontPx, glowColor, visualEffectConfig]);

    const passedShadow = 'none';

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

    const neonActive = isLyricEffectPackNeonActive(effectPack, status);

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
                // Keep punch short so the word lands on the beat instead of after it.
                scale: status === 'active'
                    ? { duration: 0.16, times: [0, 1], ease: [0.16, 1.25, 0.32, 1] }
                    : { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.12 },
                y: { duration: 0.16, ease: [0.16, 1.25, 0.32, 1] },
                filter: { duration: 0.14 },
            }}
        >
            <span className="relative z-[1] inline-block">
                <LyricEffectPackLayers
                    glyph={glyph}
                    status={status}
                    effectPack={effectPack}
                    glowColor={glowColor}
                    fontPx={fontPx}
                    typeStyle={sharedType}
                />
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
