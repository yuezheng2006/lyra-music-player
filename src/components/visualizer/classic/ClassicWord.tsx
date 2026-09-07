import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, type MotionValue, type Variants, useMotionValueEvent } from 'framer-motion';
import type { LyricWordMode, Theme, Word as WordType } from '../../../types';
import { buildWordGraphemeTimings } from '../../../utils/lyrics/graphemeTiming';
import { resolveThemeFontStack } from '../../../utils/fontStacks';
import {
    resolveLyricWordAnimateKey,
    shouldUseKaraokeWipe,
} from '../../../utils/lyrics/lyricWordMode';
import {
    buildLyricKaraokeOutlineLayers,
    type LyricVisualEffectIntensity,
} from '../../../utils/lyricVisualEffects';
import type { ResolvedLyricEffectPack } from '../../../utils/lyricEffectPacks';
import LyricEffectPackLayers, { isLyricEffectPackNeonActive } from '../LyricEffectPackLayers';
import LyricKaraokeWipe from '../LyricKaraokeWipe';
import {
    getClassicWordActiveEndTime,
    getClassicWordDisplayDuration,
} from './classicTiming';
import type { ClassicLineRenderProfile, ClassicWordLayoutConfig } from './classicTypes';

// src/components/visualizer/classic/ClassicWord.tsx
// One classic lyric word: discrete waiting/active/passed, glow + body layers.

type ClassicWordProps = {
    word: WordType;
    config: ClassicWordLayoutConfig;
    currentTime: MotionValue<number>;
    theme: Theme;
    layoutVariants: Variants;
    bodyVariants: Variants;
    glowVariants: Variants;
    baseColor: string;
    activeColor: string;
    renderProfile: ClassicLineRenderProfile;
    isChorus?: boolean;
    fontSize: string;
    lyricWordMode: LyricWordMode;
    visualEffectIntensity: LyricVisualEffectIntensity;
    effectPack: ResolvedLyricEffectPack;
};

const ClassicWord: React.FC<ClassicWordProps> = ({
    word,
    config,
    currentTime,
    theme,
    layoutVariants,
    bodyVariants,
    glowVariants,
    baseColor,
    activeColor,
    renderProfile,
    isChorus,
    fontSize,
    lyricWordMode,
    visualEffectIntensity,
    effectPack,
}) => {
    const [status, setStatus] = useState<'waiting' | 'active' | 'passed'>('waiting');
    const rippleScale = useMemo(() => 1.5 + Math.random() * 2, []);
    const duration = getClassicWordDisplayDuration(word, renderProfile);
    const activeEndTime = getClassicWordActiveEndTime(word, renderProfile);
    const graphemeTimings = useMemo(() => buildWordGraphemeTimings(word), [word]);
    const fontPx = Number.parseFloat(String(fontSize)) || 48;
    const useWipe = shouldUseKaraokeWipe(lyricWordMode);
    const wipeFontSpec = useMemo(
        () => `700 ${fontPx}px ${resolveThemeFontStack(theme)}`,
        [fontPx, theme],
    );
    const outlineLayers = useMemo(
        () => buildLyricKaraokeOutlineLayers(activeColor, fontPx, visualEffectIntensity),
        [activeColor, fontPx, visualEffectIntensity],
    );
    const animateKey = resolveLyricWordAnimateKey(status, lyricWordMode);
    const neonActive = isLyricEffectPackNeonActive(effectPack, status);

    useMotionValueEvent(currentTime, 'change', (latest: number) => {
        let newStatus: 'waiting' | 'active' | 'passed' = 'waiting';

        if (latest >= word.startTime - renderProfile.wordLookahead && latest <= activeEndTime) {
            newStatus = 'active';
        } else if (latest > activeEndTime) {
            newStatus = 'passed';
        } else {
            newStatus = 'waiting';
        }

        setStatus(prev => (prev === newStatus ? prev : newStatus));
    });

    return (
        <motion.div
            key={config.id}
            custom={{
                config,
                activeColor,
                baseColor,
                duration,
                wordRevealMode: renderProfile.wordRevealMode,
            }}
            variants={layoutVariants}
            initial={resolveLyricWordAnimateKey('waiting', lyricWordMode)}
            animate={animateKey}
            className="font-bold inline-block origin-center relative will-change-transform whitespace-nowrap"
            style={{
                fontSize,
                marginRight: config.marginRight,
                alignSelf: config.alignSelf,
                lineHeight: 1.22,
                transformStyle: 'preserve-3d',
            }}
        >
            <span
                className="absolute inset-0 select-none pointer-events-none block"
                aria-hidden="true"
            >
                {graphemeTimings.length > 1 ? (
                    graphemeTimings.map((timing, index) => (
                        <motion.span
                            key={index}
                            variants={glowVariants}
                            custom={{
                                config,
                                activeColor,
                                baseColor,
                                duration,
                                index,
                                total: graphemeTimings.length,
                                charStartTime: timing.startTime,
                                charEndTime: timing.endTime,
                                wordStartTime: word.startTime,
                                wordRevealMode: renderProfile.wordRevealMode,
                            }}
                        >
                            {timing.char}
                        </motion.span>
                    ))
                ) : (
                    <motion.span
                        variants={glowVariants}
                        custom={{
                            config,
                            activeColor,
                            baseColor,
                            duration,
                            wordRevealMode: renderProfile.wordRevealMode,
                        }}
                    >
                        {word.text}
                    </motion.span>
                )}
            </span>

            <span className="relative z-10 block">
                <LyricEffectPackLayers
                    glyph={word.text}
                    status={status}
                    effectPack={effectPack}
                    glowColor={activeColor}
                    fontPx={fontPx}
                />
                {useWipe ? (
                    <LyricKaraokeWipe
                        text={word.text}
                        startTime={word.startTime}
                        endTime={word.endTime}
                        graphemeTimings={graphemeTimings}
                        currentTime={currentTime}
                        active={status === 'active'}
                        wordColor={activeColor}
                        baseColor={baseColor}
                        fontPx={fontPx}
                        fontSpec={wipeFontSpec}
                        enableStroke
                        intensity={visualEffectIntensity}
                    />
                ) : (
                    <>
                        {status === 'active' ? (
                            <span
                                aria-hidden
                                className="lyric-karaoke-rim pointer-events-none absolute inset-0 select-none block"
                                style={{
                                    color: outlineLayers.rimColor,
                                    transform: `scale(${outlineLayers.rimScale})`,
                                    transformOrigin: 'center center',
                                    textShadow: outlineLayers.rimTextShadow,
                                }}
                            >
                                {word.text}
                            </span>
                        ) : null}
                        <motion.span
                            variants={bodyVariants}
                            custom={{
                                config,
                                activeColor,
                                baseColor,
                                duration,
                                wordRevealMode: renderProfile.wordRevealMode,
                            }}
                            className={`relative block${neonActive ? ' lyric-effect-neon-scan' : ''}`}
                        >
                            {word.text}
                        </motion.span>
                    </>
                )}
            </span>

            <AnimatePresence>
                {isChorus && status === 'active' && (
                    <motion.span
                        key="ripple"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[150%] aspect-square rounded-full border-1 pointer-events-none z-0"
                        style={{ borderColor: activeColor, filter: 'blur(1px)' }}
                        initial={{ scale: 0.2, opacity: 0.8 }}
                        animate={{ scale: rippleScale, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ClassicWord;
