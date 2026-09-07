import React, { useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getLineRenderEndTime } from '../../../utils/lyrics/renderHints';
import { useVisualizerRuntime } from '../runtime';
import { type VisualizerSharedProps } from '../definition';
import VisualizerSubtitleOverlay from '../VisualizerSubtitleOverlay';
import { buildPostLyricLayoutUnits, buildDisplayWordsFromLayoutUnits } from '../../../utils/lyrics/cjkSemanticLayout';
import { resolveThemeFontStack, resolveThemeFontWeight } from '../../../utils/fontStacks';
import { resolveLyricActiveWordColor, resolveLyricInkFills } from '../lyricInk';
import {
    resolveLyricContainerFit,
    resolveLyricRhythmScaleHeadroom,
    resolveLyricVerticalSafeArea,
} from '../resolveLyricContainerFit';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { resolveWaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { resolveLyricEffectPack } from '../../../utils/lyricEffectPacks';
import { resolveLyricPhrasePresentation } from '../../../utils/lyrics/lyricPhrasePresentationMath';
import { useLyricEffectPackBeatVars } from '../../../hooks/useLyricEffectPackBeatVars';
import { useLyricStageLayoutSize } from '../../../hooks/useLyricStageLayoutSize';
import ClassicWord from './ClassicWord';
import { buildClassicWordLayout } from './classicLayoutMath';
import {
    buildClassicBodyVariants,
    buildClassicLayoutVariants,
    classicGlowVariants,
    resolveClassicBreathingFloat,
} from './classicMotionVariants';
import {
    getClassicLineContainerMotion,
    resolveClassicLineRenderProfile,
    resolveClassicTuning,
} from './classicTiming';
import { FALLBACK_CLASSIC_WORD_LAYOUT } from './classicTypes';

// src/components/visualizer/classic/Visualizer.tsx
// Classic lyric stage: Folia-like DOM scatter + CSS 3D float, karaoke stays linear.

type VisualizerProps = VisualizerSharedProps;

const Visualizer: React.FC<VisualizerProps> = (props) => {
    const {
        currentTime,
        currentLineIndex,
        lines,
        theme,
        showText = true,
        lyricsFontScale = 1,
        subtitleOverlayOpacity,
        isPlayerChromeHidden = false,
        hideTranslationSubtitle = false,
        showSubtitleTranslation = true,
        classicTuning,
        beatPulse,
    } = props;
    const { t } = useTranslation();
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const lyricEffectPackId = useSettingsUiStore(state => state.lyricEffectPackId);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
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
    const activeWordRenderProfile = activeLineRenderProfile;
    const activeLineContainerMotion = getClassicLineContainerMotion(activeLineRenderProfile);
    const isChorus = Boolean(activeLine?.isChorus);
    const phrase = useMemo(() => resolveLyricPhrasePresentation({
        isChorus,
        timingClass: activeLineRenderProfile?.renderHints?.timingClass ?? null,
    }), [activeLineRenderProfile?.renderHints?.timingClass, isChorus]);
    const effectPack = useMemo(
        () => resolveLyricEffectPack(lyricEffectPackId, visualEffectIntensity),
        [lyricEffectPackId, visualEffectIntensity],
    );

    const stageRef = useRef<HTMLDivElement | null>(null);
    useLyricEffectPackBeatVars({
        hostRef: stageRef,
        packId: effectPack.id,
        intensity: visualEffectIntensity,
        beatPulse,
        isChorus,
    });
    const { stageWidth, shellHeight } = useLyricStageLayoutSize(stageRef, isPlayerChromeHidden);

    const displayWords = useMemo(() => {
        if (!activeLine) return [];
        if (resolvedClassicTuning.useLegacyLayout) {
            return activeLine.words;
        }
        const layoutUnits = buildPostLyricLayoutUnits(activeLine, { semantic: true, sticky: true });
        return buildDisplayWordsFromLayoutUnits(layoutUnits);
    }, [activeLine, resolvedClassicTuning.useLegacyLayout]);

    const rhythmHeadroom = resolveLyricRhythmScaleHeadroom(theme.lyricRhythmScaleMultiplier ?? 1);
    const glowInsetPx = theme.lyricGlowUsesAccent ? 36 : 20;
    const lyricFit = useMemo(
        () => resolveLyricContainerFit({
            containerWidth: stageWidth,
            lyricsFontScale: lyricsFontScale * phrase.fontScaleMul,
            sidePaddingRatio: isPlayerChromeHidden ? 0.07 : 0.09,
            minSidePaddingPx: isPlayerChromeHidden ? 28 : 32,
            preferredWidthRatio: isPlayerChromeHidden ? 0.095 : 0.08,
            minFontPx: isPlayerChromeHidden ? 34 : 26,
            maxFontPx: isPlayerChromeHidden ? 78 : 64,
            scaleHeadroom: rhythmHeadroom,
            glowInsetPx,
        }),
        [stageWidth, lyricsFontScale, phrase.fontScaleMul, glowInsetPx, rhythmHeadroom, isPlayerChromeHidden],
    );
    const lyricVertical = useMemo(
        () => resolveLyricVerticalSafeArea({
            containerHeight: shellHeight,
            scaleHeadroom: rhythmHeadroom,
            glowInsetPx,
            fontPx: lyricFit.fontPx,
            minPaddingPx: 52,
            preferredMaxHeightRatio: 0.7,
        }),
        [shellHeight, rhythmHeadroom, glowInsetPx, lyricFit.fontPx],
    );
    const mainFontSize = lyricFit.fontSizeCss;
    const emptyFontSize = `${Math.max(16, lyricFit.fontPx * 0.55).toFixed(2)}px`;
    const translationFontSize = `${Math.max(18, lyricFit.fontPx * 0.58).toFixed(2)}px`;
    const upcomingFontSize = `${Math.max(12, lyricFit.fontPx * 0.34).toFixed(2)}px`;
    const fontStack = resolveThemeFontStack(theme);
    const fontWeight = resolveThemeFontWeight(theme, 700);

    const { wordConfigs, lineConfig, lineFitScale } = useMemo(
        () => buildClassicWordLayout({
            activeLine,
            displayWords,
            tuning: resolvedClassicTuning,
            intensity: theme.animationIntensity,
            parkAtRest: waitingWordPresentation.parkAtRest,
            fontPx: lyricFit.fontPx,
            fontStack,
            fontWeight,
            usableWidth: lyricFit.usableWidth,
            usableHeight: lyricVertical.usableHeight,
        }),
        [
            activeLine,
            displayWords,
            resolvedClassicTuning,
            theme.animationIntensity,
            waitingWordPresentation.parkAtRest,
            lyricFit.fontPx,
            lyricFit.usableWidth,
            fontStack,
            fontWeight,
            lyricVertical.usableHeight,
        ],
    );

    const layoutVariants = useMemo(
        () => buildClassicLayoutVariants(
            resolvedClassicTuning.enableWordRotation,
            waitingWordPresentation.opacity,
        ),
        [resolvedClassicTuning.enableWordRotation, waitingWordPresentation.opacity],
    );
    const bodyVariants = useMemo(() => buildClassicBodyVariants(), []);
    const lyricContainerFloat = useMemo(
        () => resolveClassicBreathingFloat(
            resolvedClassicTuning.breathingFloatMultiplier,
            theme.animationIntensity,
        ),
        [resolvedClassicTuning.breathingFloatMultiplier, theme.animationIntensity],
    );
    const lyricInk = useMemo(() => resolveLyricInkFills(theme), [theme]);

    return (
        <>
            <div
                className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                style={{ paddingTop: lyricVertical.opticalTopBiasPx }}
            >
                <motion.div
                    ref={stageRef}
                    className="relative w-full flex items-center justify-center will-change-transform overflow-visible"
                    style={{
                        height: `${(lyricVertical.maxHeightRatio * 100).toFixed(2)}%`,
                        maxHeight: `${(lyricVertical.maxHeightRatio * 100).toFixed(2)}%`,
                        paddingLeft: lyricFit.sidePaddingPx,
                        paddingRight: lyricFit.sidePaddingPx,
                        paddingTop: lyricVertical.topPaddingPx,
                        paddingBottom: lyricVertical.bottomPaddingPx,
                        perspective: `${lineConfig.perspective}px`,
                        transformStyle: 'preserve-3d',
                    }}
                    animate={lyricContainerFloat?.animate}
                    transition={lyricContainerFloat?.transition}
                >
                    <AnimatePresence mode="popLayout">
                        {showText && activeLine && (
                            <motion.div
                                key={activeLine.startTime}
                                initial={activeLineContainerMotion.initial}
                                animate={activeLineContainerMotion.animate}
                                exit={activeLineContainerMotion.exit}
                                className="flex w-full items-center justify-center"
                                style={{
                                    perspective: `${lineConfig.perspective}px`,
                                    transformStyle: 'preserve-3d',
                                    minHeight: Math.min(220, Math.max(120, Math.round(lyricVertical.usableHeight * 0.55))),
                                    maxWidth: lyricFit.usableWidth,
                                    width: '100%',
                                }}
                            >
                                <div
                                    className={`flex flex-wrap w-full content-center ${lineConfig.justifyContent} ${lineConfig.alignItems}`}
                                    style={{
                                        transform: lineFitScale < 0.999 ? `scale(${lineFitScale})` : undefined,
                                        transformOrigin: 'center center',
                                        transformStyle: 'preserve-3d',
                                        width: '100%',
                                    }}
                                >
                                    {displayWords.map((word, idx) => {
                                        const config = wordConfigs[idx] ?? {
                                            ...FALLBACK_CLASSIC_WORD_LAYOUT,
                                            id: `fallback-${idx}`,
                                        };
                                        return (
                                            <ClassicWord
                                                key={`${word.text}-${idx}-${activeLine.startTime}`}
                                                word={word}
                                                config={config}
                                                currentTime={currentTime}
                                                theme={theme}
                                                layoutVariants={layoutVariants}
                                                bodyVariants={bodyVariants}
                                                glowVariants={classicGlowVariants}
                                                baseColor={lyricInk.body}
                                                activeColor={resolveLyricActiveWordColor(word.text, theme)}
                                                renderProfile={activeWordRenderProfile!}
                                                isChorus={activeLine.isChorus}
                                                fontSize={mainFontSize}
                                                lyricWordMode={lyricWordMode}
                                                visualEffectIntensity={visualEffectIntensity}
                                                effectPack={effectPack}
                                            />
                                        );
                                    })}
                                </div>
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
            </div>

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
        </>
    );
};

export default Visualizer;
