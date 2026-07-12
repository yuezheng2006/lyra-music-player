import React, { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionValue, Variants, useMotionValueEvent } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CLASSIC_TUNING, Line, Theme, Word as WordType, AudioBands, type ClassicTuning } from '../../../types';
import { getLineRenderEndTime, getLineRenderHints } from '../../../utils/lyrics/renderHints';
import { useVisualizerRuntime } from '../runtime';
import { type VisualizerSharedProps } from '../definition';
import VisualizerShell from '../VisualizerShell';
import VisualizerSubtitleOverlay from '../VisualizerSubtitleOverlay';
import { buildPostLyricLayoutUnits, buildDisplayWordsFromLayoutUnits } from '../../../utils/lyrics/cjkSemanticLayout';
import { buildWordGraphemeTimings } from '../../../utils/lyrics/graphemeTiming';
import { resolveThemeFontStack } from '../../../utils/fontStacks';
import { resolveWordColor } from '../wordColoring';
import {
    clampLyricWordOffsetX,
    resolveLyricContainerFit,
} from '../resolveLyricContainerFit';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { resolveWaitingWordPresentation, resolveLyricWordAnimateKey } from '../../../utils/lyrics/lyricWordMode';
import { buildLyricStageStroke } from '../../../utils/lyricVisualEffects';

// This mode is the most straightforward lyric pipeline in the folder.
// First we ask runtime which line is active right now, then read renderHints from that line,
// then build a loose per-word layout so every word can animate on its own without depending on parent rerenders.
// Nothing too fancy here, it is basically the "baseline" visualizer that the other modes keep borrowing timing ideas from.
//
// For a single lyric line, words mostly go through 3 states:
// waiting -> word is not live yet, keep it in a lighter pre-entry pose.
// active -> word is currently singing, drive the main glow/body/ripple here.
// passed -> word already played, keep a bit of afterglow and drift so the line does not die too abruptly.
type VisualizerProps = VisualizerSharedProps;

interface WordLayoutConfig {
    id: string;
    x: number;
    y: number;
    rotate: number;
    scale: number;
    marginRight: string;
    alignSelf: string;
    passedRotate: number;
}

interface LineLayoutConfig {
    justifyContent: string;
    alignItems: string;
    perspective: number;
}

interface ClassicLineRenderProfile {
    renderHints: NonNullable<Line['renderHints']> | null;
    lineRenderEndTime: number;
    lineTransitionMode: 'normal' | 'fast' | 'none';
    wordRevealMode: 'normal' | 'fast' | 'instant';
    wordLookahead: number;
}

const clampClassicBreathingFloatMultiplier = (value: number) => Math.min(2, Math.max(0, value));
const clampClassicWordSpacing = (value: number) => Math.min(2, Math.max(0, value));

const resolveClassicTuning = (tuning?: ClassicTuning): ClassicTuning => ({
    enableWordRotation: tuning?.enableWordRotation ?? DEFAULT_CLASSIC_TUNING.enableWordRotation,
    breathingFloatMultiplier: clampClassicBreathingFloatMultiplier(
        tuning?.breathingFloatMultiplier ?? DEFAULT_CLASSIC_TUNING.breathingFloatMultiplier,
    ),
    useLegacyLayout: tuning?.useLegacyLayout ?? DEFAULT_CLASSIC_TUNING.useLegacyLayout,
    wordSpacing: clampClassicWordSpacing(tuning?.wordSpacing ?? DEFAULT_CLASSIC_TUNING.wordSpacing ?? 0.7),
});

// Helper to determine if text contains CJK characters
const isCJK = (text: string) => /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(text);

const resolveClassicLineRenderProfile = (line: Line | null | undefined): ClassicLineRenderProfile | null => {
    if (!line) {
        return null;
    }

    // Render hints come from the lyric pipeline, not from the visualizer itself.
    // This function is just repackaging them into something easier to consume frame-by-frame.
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

const getClassicWordActiveEndTime = (word: WordType, renderProfile: ClassicLineRenderProfile) => {
    if (renderProfile.wordRevealMode === 'instant') {
        return renderProfile.lineRenderEndTime;
    }

    if (renderProfile.wordRevealMode === 'fast') {
        return Math.min(renderProfile.lineRenderEndTime, Math.max(word.endTime, word.startTime + 0.12));
    }

    return word.endTime;
};

const getClassicWordDisplayDuration = (word: WordType, renderProfile: ClassicLineRenderProfile) => {
    const activeEndTime = getClassicWordActiveEndTime(word, renderProfile);
    const minDuration = renderProfile.wordRevealMode === 'instant'
        ? 0.08
        : renderProfile.wordRevealMode === 'fast'
            ? 0.12
            : 0.1;

    return Math.max(activeEndTime - word.startTime, minDuration);
};

const getClassicLineContainerMotion = (renderProfile: ClassicLineRenderProfile | null) => {
    if (renderProfile?.lineTransitionMode === 'none') {
        return {
            initial: { opacity: 1, scale: 1, filter: 'blur(0px)' },
            animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
            exit: { opacity: 0, scale: 1.02, filter: 'blur(6px)', transition: { duration: 0.12, ease: 'easeOut' as const } },
        };
    }

    if (renderProfile?.lineTransitionMode === 'fast') {
        return {
            initial: { opacity: 0.35, scale: 0.96, filter: 'blur(4px)' },
            animate: {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transition: { duration: 0.16, ease: 'easeOut' as const },
                transitionEnd: { filter: 'none' },
            },
            exit: {
                opacity: 0,
                scale: 1.04,
                filter: 'blur(10px)',
                transition: { duration: 0.16, ease: 'easeInOut' as const },
            },
        };
    }

    return {
        initial: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
        exit: { opacity: 0, scale: 1.1, filter: 'blur(20px)', transition: { duration: 0.3 } },
    };
};

let classicMeasureCanvas: HTMLCanvasElement | null = null;

/**
 * Measures the width of a given word text using a 2D canvas context.
 */
const measureWordWidth = (text: string, pxSize: number, fontStack: string): number => {
    if (typeof document === 'undefined') {
        return text.length * pxSize * 0.65;
    }
    if (!classicMeasureCanvas) {
        classicMeasureCanvas = document.createElement('canvas');
    }
    const context = classicMeasureCanvas.getContext('2d');
    if (!context) {
        return text.length * pxSize * 0.65;
    }
    context.font = `700 ${pxSize}px ${fontStack}`;
    return context.measureText(text).width;
};

const Word: React.FC<{
    word: WordType;
    config: WordLayoutConfig;
    currentTime: MotionValue<number>;
    theme: Theme;
    isChaotic: boolean;
    layoutVariants: Variants;
    bodyVariants: Variants;
    glowVariants: Variants;
    baseColor: string;
    activeColor: string;
    renderProfile: ClassicLineRenderProfile;
    isChorus?: boolean;
    fontSize: string;
    lyricWordMode: 'default' | 'karaoke';
}> = ({ word, config, currentTime, theme, isChaotic, layoutVariants, bodyVariants, glowVariants, baseColor, activeColor, renderProfile, isChorus, fontSize, lyricWordMode }) => {
    const [status, setStatus] = useState<"waiting" | "active" | "passed">("waiting");
    const rippleScale = useMemo(() => 1.5 + Math.random() * 2, []);
    const duration = getClassicWordDisplayDuration(word, renderProfile);
    const activeEndTime = getClassicWordActiveEndTime(word, renderProfile);
    const graphemeTimings = useMemo(() => buildWordGraphemeTimings(word), [word]);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const stageStroke = buildLyricStageStroke(visualEffectIntensity);
    const animateKey = resolveLyricWordAnimateKey(status, lyricWordMode);

    useMotionValueEvent(currentTime, "change", (latest: number) => {
        let newStatus: "waiting" | "active" | "passed" = "waiting";

        if (latest >= word.startTime - renderProfile.wordLookahead && latest <= activeEndTime) {
            newStatus = "active";
        } else if (latest > activeEndTime) {
            newStatus = "passed";
        } else {
            newStatus = "waiting";
        }

        if (newStatus !== status) {
            setStatus(newStatus);
        }
    });

    return (
        <motion.div
            key={`${config.id}`}
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
            // Add `whitespace-nowrap` to prevent unexpected line breaks
            className="font-bold inline-block origin-center relative will-change-transform whitespace-nowrap"
            style={{
                fontSize,
                marginRight: config.marginRight,
                alignSelf: config.alignSelf,
                lineHeight: 1.22,
            }}
        >
            {/* Glow Layer - Handles Text Shadow - Absolute Position */}
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
                        custom={{ config, activeColor, baseColor, duration, wordRevealMode: renderProfile.wordRevealMode }}
                    >
                        {word.text}
                    </motion.span>
                )}
            </span>

            {/* Body Layer — color + stroke; no soft glow soup */}
            <motion.span
                variants={bodyVariants}
                custom={{
                    config,
                    activeColor,
                    baseColor,
                    duration,
                    wordRevealMode: renderProfile.wordRevealMode,
                }}
                className="relative z-10 block"
                style={stageStroke}
            >
                {word.text}
            </motion.span>

            {/* Chorus Ripple Effect */}
            <AnimatePresence>
                {isChorus && status === 'active' && (
                    <motion.span
                        key="ripple"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[150%] aspect-square rounded-full border-1 pointer-events-none z-0"
                        style={{ borderColor: activeColor, filter: "blur(1px)" }}
                        initial={{ scale: 0.2, opacity: 0.8 }}
                        animate={{ scale: rippleScale, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const Visualizer: React.FC<VisualizerProps> = (props) => {
    const {
        currentTime,
        currentLineIndex,
        lines,
        theme,
        audioPower,
        audioBands,
        showText = true,
        lyricsFontScale = 1,
        subtitleOverlayOpacity,
        isPlayerChromeHidden = false,
        hideTranslationSubtitle = false,
        showSubtitleTranslation = true,
        classicTuning,
        mineradioStageActive = false,
    } = props;
    const { t } = useTranslation();
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const waitingWordPresentation = resolveWaitingWordPresentation(lyricWordMode);

    const resolvedClassicTuning = useMemo(() => resolveClassicTuning(classicTuning), [classicTuning]);
    const {
        activeLine,
        recentCompletedLine,
        nextLines,
    } = useVisualizerRuntime({
        currentTime,
        currentLineIndex,
        lines,
        getLineEndTime: getLineRenderEndTime,
    });
    const activeLineRenderProfile = activeLine ? resolveClassicLineRenderProfile(activeLine) : null;
    const activeWordRenderProfile = activeLineRenderProfile ?? (activeLine ? resolveClassicLineRenderProfile(activeLine) : null);
    const activeLineContainerMotion = getClassicLineContainerMotion(activeLineRenderProfile);

    const stageRef = useRef<HTMLDivElement | null>(null);
    const [stageWidth, setStageWidth] = useState(() => (
        typeof window === 'undefined' ? 960 : Math.max(320, window.innerWidth - 220)
    ));

    // Measure the real lyric stage (excludes sidebar / DevTools), never window.innerWidth / vw.
    useLayoutEffect(() => {
        const node = stageRef.current;
        if (!node || typeof ResizeObserver === 'undefined') return undefined;
        const apply = (width: number) => {
            const next = Math.max(240, Math.round(width));
            setStageWidth(prev => (prev === next ? prev : next));
        };
        apply(node.getBoundingClientRect().width);
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            apply(entry.contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const displayWords = useMemo(() => {
        if (!activeLine) return [];
        if (resolvedClassicTuning.useLegacyLayout) {
            return activeLine.words;
        }
        const layoutUnits = buildPostLyricLayoutUnits(activeLine, { semantic: true, sticky: true });
        return buildDisplayWordsFromLayoutUnits(layoutUnits);
    }, [activeLine, resolvedClassicTuning.useLegacyLayout]);

    const lyricFit = useMemo(
        () => resolveLyricContainerFit({
            containerWidth: stageWidth,
            lyricsFontScale,
            sidePaddingRatio: 0.09,
            minSidePaddingPx: 32,
            preferredWidthRatio: 0.068,
            minFontPx: 22,
            maxFontPx: 52,
        }),
        [stageWidth, lyricsFontScale],
    );
    const mainFontSize = lyricFit.fontSizeCss;
    const emptyFontSize = `${Math.max(16, lyricFit.fontPx * 0.55).toFixed(2)}px`;
    const translationFontSize = `${Math.max(14, lyricFit.fontPx * 0.42).toFixed(2)}px`;
    const upcomingFontSize = `${Math.max(12, lyricFit.fontPx * 0.34).toFixed(2)}px`;

    // Generate a stable random layout configuration for the current line.
    // Use the line start time as seed so the same lyric does not reshuffle every rerender.
    const { wordConfigs, lineConfig } = useMemo(() => {
        if (!activeLine) return { wordConfigs: [], lineConfig: { justifyContent: 'center', alignItems: 'center', perspective: 1000 } };

        const seed = activeLine.startTime;
        const intensity = theme.animationIntensity;

        // Intensity mostly controls how wild the random spread is allowed to become.
        // K歌：当前行必须整行可读、逐字点亮，强制收成平静线性排版。
        const karaokeLineRest = waitingWordPresentation.parkAtRest;
        const isChaotic = !karaokeLineRest && intensity === 'chaotic';
        const isCalm = karaokeLineRest || intensity === 'calm';

        // Keep lines centered in the measured stage so left/right chrome never clips text.
        const justifyOptions = ['justify-center'];
        const alignOptions = isCalm
            ? ['items-center']
            : ['items-start', 'items-center', 'items-end'];

        const isInterlude = activeLine.fullText === "......";

        const lineConfig: LineLayoutConfig = {
            justifyContent: isInterlude ? 'justify-center' : justifyOptions[Math.floor(seed % justifyOptions.length)], // deterministic random
            alignItems: alignOptions[Math.floor((seed * 2) % alignOptions.length)],
            perspective: isChaotic ? 500 + (seed % 500) : 1000,
        };

        // Word layouts stay deterministic for a given line.
        // That is important because time should change the animation state, not the base geometry.
        const fontStack = resolveThemeFontStack(theme);
        const pxFontSize = lyricFit.fontPx;
        const wordWidths = displayWords.map(w => measureWordWidth(w.text, pxFontSize, fontStack));

        const baseSpread = isChaotic ? 36 : isCalm ? 0 : 14;
        const baseRotate = isChaotic ? 30 : isCalm ? 0 : 5;

        const wordConfigs: WordLayoutConfig[] = displayWords.map((w, i) => {
            const wordSeed = seed + i;

            // Tiny deterministic RNG so every word gets its own reproducible offsets.
            const random = (offset: number) => {
                const x = Math.sin(wordSeed + offset) * 10000;
                return x - Math.floor(x);
            };

            if (isInterlude) {
                return {
                    id: `${w.text}-${i}-${seed}`,
                    x: 0,
                    y: (random(2) - 0.5) * 15, // Slight vertical randomness
                    rotate: 0,
                    scale: 1.5,
                    marginRight: '3rem',
                    alignSelf: 'center',
                    passedRotate: 0
                };
            }

            const wordConfigScale = isChaotic ? 0.8 + random(4) * 0.6 : 1.1 + random(4) * 0.2;
            const rawX = (random(1) - 0.5) * baseSpread * 2;
            const xVal = clampLyricWordOffsetX(
                rawX,
                wordWidths[i] ?? pxFontSize,
                lyricFit.usableWidth,
                wordConfigScale * 1.35,
            );
            const yVal = (random(2) - 0.5) * baseSpread * 2;

            let marginRight = isChaotic ? `${random(5) * 1.5}rem` : '0.8rem';

            if (!resolvedClassicTuning.useLegacyLayout) {
                // Calculate precise margin right to avoid visual overlap during scaling and translation
                const w_i = wordWidths[i] ?? 0;
                const s_i = wordConfigScale * 1.4; // active scale max multiplier

                let w_next = 0;
                let s_next = 1.0;
                let x_next = 0;

                if (i + 1 < displayWords.length) {
                    const nextSeed = seed + (i + 1);
                    const nextRandom = (offset: number) => {
                        const x = Math.sin(nextSeed + offset) * 10000;
                        return x - Math.floor(x);
                    };
                    const nextConfigScale = isChaotic ? 0.8 + nextRandom(4) * 0.6 : 1.1 + nextRandom(4) * 0.2;
                    s_next = nextConfigScale * 1.4;
                    x_next = (nextRandom(1) - 0.5) * baseSpread * 2;
                    w_next = wordWidths[i + 1] ?? 0;
                }

                const spacingMultiplier = resolvedClassicTuning.wordSpacing ?? 0.7;
                const gap = 0.05 * pxFontSize;
                const halfOverflow_i = w_i * (s_i - 1) / 2;
                const halfOverflow_next = w_next * (s_next - 1) / 2;
                const xOffsetDiff = xVal - x_next;

                const calculatedMargin = (halfOverflow_i + halfOverflow_next + xOffsetDiff + gap) * spacingMultiplier;
                const minMargin = (isChaotic ? 0.08 * pxFontSize : 0.12 * pxFontSize) * spacingMultiplier;
                const finalMargin = Math.max(minMargin, calculatedMargin);
                marginRight = `${finalMargin.toFixed(1)}px`;
            }

            return {
                id: `${w.text}-${i}-${seed}`,
                x: xVal,
                y: yVal,
                rotate: resolvedClassicTuning.enableWordRotation ? (random(3) - 0.5) * baseRotate * 2 : 0,
                scale: wordConfigScale,
                marginRight,
                alignSelf: isChaotic && random(6) > 0.7 ? (random(7) > 0.5 ? 'flex-start' : 'flex-end') : 'auto',
                passedRotate: resolvedClassicTuning.enableWordRotation ? (random(8) - 0.5) * 45 : 0
            };
        });

        return { wordConfigs, lineConfig };
    }, [activeLine, displayWords, resolvedClassicTuning.enableWordRotation, resolvedClassicTuning.useLegacyLayout, resolvedClassicTuning.wordSpacing, theme, lyricFit, waitingWordPresentation.parkAtRest]);

    // Container motion is the "body" of each word.
    // waiting/active/passed all reuse the same layout config but interpret it differently.
    // waiting-* keys must differ by lyricWordMode so default↔karaoke toggles re-animate.
    const layoutVariants: Variants = {
        'waiting-default': ({ config }: any) => ({
            opacity: 0,
            scale: 0.5,
            x: config.x + (Math.sin(config.y) * 100),
            y: config.y + (Math.cos(config.x) * 50),
            rotate: resolvedClassicTuning.enableWordRotation ? config.rotate + 20 : 0,
            transition: { duration: 0.4 }
        }),
        'waiting-karaoke': ({ config }: any) => ({
            opacity: waitingWordPresentation.opacity,
            scale: config.scale || 1,
            x: config.x,
            y: config.y,
            rotate: config.rotate,
            transition: { duration: 0.25 }
        }),
        active: ({ config }: any) => ({
            opacity: 1,
            scale: isNaN(config.scale) ? 1.5 : config.scale * 1.4,
            x: config.x,
            y: config.y,
            rotate: config.rotate,
            transition: {
                type: "spring" as const,
                stiffness: 200,
                damping: 20,
                opacity: { duration: 0.1 }
            }
        }),
        passed: ({ config, baseColor }: any) => ({
            opacity: theme.animationIntensity === 'chaotic' ? 0.9 : 0.82,
            scale: config.scale || 1,
            x: config.x,
            y: config.y,
            rotate: config.rotate + config.passedRotate,
            transition: {
                duration: 0.5,
                rotate: {
                    duration: 5,
                    ease: "linear"
                }
            }
        })
    };

    // Body layer is where color transition and blur cleanup happen.
    // Glow is separated so we can overdrive highlight without making the actual glyph unreadable.
    const bodyVariants: Variants = {
        'waiting-default': ({ baseColor }: any) => ({
            color: baseColor,
            filter: 'blur(10px)',
            transition: { duration: 0.4 }
        }),
        'waiting-karaoke': ({ baseColor }: any) => ({
            color: baseColor,
            filter: 'none',
            transition: { duration: 0.25 }
        }),
        active: ({ activeColor, duration, wordRevealMode }: any) => ({
            color: activeColor,
            filter: "none",
            transition: {
                color: { duration: duration || 0.2, ease: "linear" },
                filter: { type: "tween", duration: wordRevealMode === 'instant' ? 0.08 : wordRevealMode === 'fast' ? 0.12 : 0.2 }
            },
            transitionEnd: {
                filter: "none"
            }
        }),
        passed: ({ baseColor, wordRevealMode }: any) => ({
            color: baseColor,
            filter: "blur(0px)",
            transition: {
                color: { duration: wordRevealMode === 'instant' ? 0.12 : wordRevealMode === 'fast' ? 0.24 : 0.8, ease: "easeInOut" },
                filter: { duration: wordRevealMode === 'instant' ? 0.12 : wordRevealMode === 'fast' ? 0.2 : 0.5 }
            },
            transitionEnd: {
                filter: "none"
            }
        })
    };

    // Soft multi-layer glow muddy against particle stages — keep glow layer inert.
    const glowVariants: Variants = {
        'waiting-default': {
            color: "transparent",
            textShadow: "none",
        },
        'waiting-karaoke': {
            color: "transparent",
            textShadow: "none",
        },
        active: {
            color: "transparent",
            textShadow: "none",
        },
        passed: {
            color: "transparent",
            textShadow: "none",
        },
    };

    const lyricContainerFloat = useMemo(() => {
        const multiplier = resolvedClassicTuning.breathingFloatMultiplier;
        if (multiplier <= 0) {
            return null;
        }

        // Small whole-line breathing motion so the screen never feels fully static between word events.
        const configByIntensity = {
            calm: { distance: 10, duration: 8.5 },
            normal: { distance: 14, duration: 7 },
            chaotic: { distance: 18, duration: 5.8 }
        } as const;

        const { distance, duration } = configByIntensity[theme.animationIntensity];
        const scaledDistance = distance * multiplier;

        return {
            animate: {
                y: [0, -scaledDistance, 0, scaledDistance * 0.45, 0],
            },
            transition: {
                duration,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        };
    }, [resolvedClassicTuning.breathingFloatMultiplier, theme.animationIntensity]);

    return (
        <VisualizerShell
            theme={theme}
            audioPower={audioPower}
            audioBands={audioBands}
            sharedProps={props}
        >
            {/* Main Container */}
            <motion.div
                ref={stageRef}
                className="relative z-10 w-full h-[70vh] flex items-center justify-center pointer-events-none will-change-transform overflow-hidden"
                style={{
                    paddingLeft: lyricFit.sidePaddingPx,
                    paddingRight: lyricFit.sidePaddingPx,
                    paddingTop: 32,
                    paddingBottom: 32,
                }}
                animate={lyricContainerFloat?.animate}
                transition={lyricContainerFloat?.transition}
            >
                <AnimatePresence mode='popLayout'>
                    {showText && activeLine && (
                        <motion.div
                            key={activeLine.startTime}
                            initial={activeLineContainerMotion.initial}
                            animate={activeLineContainerMotion.animate}
                            exit={activeLineContainerMotion.exit}
                            className={`flex flex-wrap w-full content-center ${lineConfig.justifyContent} ${lineConfig.alignItems}`}
                            style={{
                                perspective: `${lineConfig.perspective}px`,
                                minHeight: '300px',
                                maxWidth: lyricFit.usableWidth,
                                width: '100%',
                            }}
                        >
                            {displayWords.map((word, idx) => {
                                const config = wordConfigs[idx] || { id: `fallback-${idx}`, x: 0, y: 0, rotate: 0, scale: 1, marginRight: '0.5rem', alignSelf: 'auto', passedRotate: 0 };

                                const activeColor = resolveWordColor(word.text, theme.wordColors, theme.accentColor);

                                return (
                                    <Word
                                        key={`${word.text}-${idx}-${activeLine.startTime}`}
                                        word={word}
                                        config={config}
                                        currentTime={currentTime}
                                        theme={theme}
                                        isChaotic={theme.animationIntensity === 'chaotic'}
                                        layoutVariants={layoutVariants}
                                        bodyVariants={bodyVariants}
                                        glowVariants={glowVariants}
                                        baseColor={theme.primaryColor}
                                        activeColor={activeColor}
                                        renderProfile={activeWordRenderProfile!}
                                        isChorus={activeLine.isChorus}
                                        fontSize={mainFontSize}
                                        lyricWordMode={lyricWordMode}
                                    />
                                );
                            })}
                        </motion.div>
                    )}

                    {showText && !activeLine && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-2xl opacity-50 absolute"
                            style={{
                                color: theme.secondaryColor,
                                fontSize: emptyFontSize,
                            }}
                        >
                            {t('ui.waitingForMusic')}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <VisualizerSubtitleOverlay
                showText={showText}
                activeLine={activeLine}
                recentCompletedLine={recentCompletedLine}
                nextLines={nextLines}
                theme={theme}
                translationFontSize={translationFontSize}
                upcomingFontSize={upcomingFontSize}
                subtitleOverlayOpacity={subtitleOverlayOpacity}
                isPlayerChromeHidden={isPlayerChromeHidden}
                hideTranslationSubtitle={hideTranslationSubtitle}
                showSubtitleTranslation={showSubtitleTranslation}
            />
        </VisualizerShell>
    );
};

export default Visualizer;
