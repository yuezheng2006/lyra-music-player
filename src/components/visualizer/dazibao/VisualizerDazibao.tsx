import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getLineRenderEndTime } from '../../../utils/lyrics/renderHints';
import { buildPostLyricLayoutUnits, buildDisplayWordsFromLayoutUnits } from '../../../utils/lyrics/cjkSemanticLayout';
import {
    getDefaultLyricFontPreset,
    getLyricFontPresetById,
    getLyricLetterSpacingPx,
} from '../../../utils/lyricFontPresets';
import { getRecommendedEffectConfig } from '../../../utils/lyricVisualEffects';
import { resolveWaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { type VisualizerSharedProps } from '../definition';
import { useVisualizerRuntime } from '../runtime';
import VisualizerShell from '../VisualizerShell';
import {
    resolveLyricContainerFit,
    resolveLyricLineFitScale,
    resolveLyricRhythmScaleHeadroom,
    resolveLyricVerticalSafeArea,
} from '../resolveLyricContainerFit';
import { colorWithAlpha } from '../colorMix';
import { resolveLyricInkFills } from '../lyricInk';
import DazibaoWord from './dazibaoWordStage';

// src/components/visualizer/dazibao/VisualizerDazibao.tsx
// 野火走位：仅单行英雄砸脸布局；字体/颜色/特效包各自独立。

type VisualizerDazibaoProps = VisualizerSharedProps;

const VisualizerDazibao: React.FC<VisualizerDazibaoProps> = (props) => {
    const {
        currentTime,
        currentLineIndex,
        lines,
        theme,
        audioPower,
        audioBands,
        showText = true,
        lyricsFontScale = 1,
        immersiveLyrics = false,
        hideTranslationSubtitle = false,
        showSubtitleTranslation = true,
    } = props;
    const { t } = useTranslation();
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const lyricFontPresetId = useSettingsUiStore(state => state.lyricFontPresetId);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const waitingPresentation = resolveWaitingWordPresentation(lyricWordMode);

    const { activeLine } = useVisualizerRuntime({
        currentTime,
        currentLineIndex,
        lines,
        getLineEndTime: getLineRenderEndTime,
    });

    const stageRef = useRef<HTMLDivElement | null>(null);
    const [stageWidth, setStageWidth] = useState(() => (
        typeof window === 'undefined' ? 960 : Math.max(320, window.innerWidth - 220)
    ));
    const [shellHeight, setShellHeight] = useState(() => (
        typeof window === 'undefined' ? 720 : Math.max(420, window.innerHeight)
    ));

    useLayoutEffect(() => {
        const node = stageRef.current;
        if (!node || typeof ResizeObserver === 'undefined') return undefined;
        const shell = (node.closest('[data-visualizer-shell="true"]') as HTMLElement | null) ?? node.parentElement;
        const apply = () => {
            const nextWidth = Math.max(240, Math.round(node.offsetWidth || node.getBoundingClientRect().width));
            setStageWidth(prev => (prev === nextWidth ? prev : nextWidth));
            if (shell) {
                const nextHeight = Math.max(280, Math.round(shell.clientHeight || shell.offsetHeight));
                setShellHeight(prev => (prev === nextHeight ? prev : nextHeight));
            }
        };
        apply();
        const observer = new ResizeObserver(() => apply());
        observer.observe(node);
        if (shell) observer.observe(shell);
        return () => observer.disconnect();
    }, []);

    const fontPreset = useMemo(
        () => getLyricFontPresetById(lyricFontPresetId) ?? getDefaultLyricFontPreset(),
        [lyricFontPresetId],
    );
    const fontStack = fontPreset.fontFamily;
    const visualEffectConfig = useMemo(
        () => getRecommendedEffectConfig(immersiveLyrics, true, visualEffectIntensity),
        [immersiveLyrics, visualEffectIntensity],
    );

    const isChorus = Boolean(activeLine?.isChorus);
    const rhythmHeadroom = resolveLyricRhythmScaleHeadroom(theme.lyricRhythmScaleMultiplier ?? 1);
    const glowInsetPx = theme.lyricGlowUsesAccent ? 40 : 24;
    const lyricFit = useMemo(
        () => resolveLyricContainerFit({
            containerWidth: stageWidth,
            lyricsFontScale: lyricsFontScale * (immersiveLyrics ? 1.35 : 1) * (isChorus ? 1.12 : 1),
            sidePaddingRatio: 0.06,
            minSidePaddingPx: 24,
            preferredWidthRatio: 0.11,
            minFontPx: 36,
            maxFontPx: immersiveLyrics ? 120 : 92,
            scaleHeadroom: rhythmHeadroom,
            glowInsetPx,
        }),
        [
            immersiveLyrics,
            isChorus,
            lyricsFontScale,
            stageWidth,
            glowInsetPx,
            rhythmHeadroom,
        ],
    );
    const lyricVertical = useMemo(
        () => resolveLyricVerticalSafeArea({
            containerHeight: shellHeight,
            scaleHeadroom: rhythmHeadroom,
            glowInsetPx,
            fontPx: lyricFit.fontPx,
            minPaddingPx: 56,
            preferredMaxHeightRatio: immersiveLyrics ? 0.78 : 0.7,
        }),
        [shellHeight, rhythmHeadroom, glowInsetPx, lyricFit.fontPx, immersiveLyrics],
    );
    const letterSpacingPx = getLyricLetterSpacingPx(fontPreset, lyricFit.fontPx);
    const lyricInk = resolveLyricInkFills(theme);
    const activeColor = lyricInk.sung;
    const baseColor = lyricInk.unsung;
    // Glow stays on the same body hue so dazibao doesn't introduce a second lyric color.
    const glowColor = lyricInk.body;
    const strokeColor = theme.lyricGlowUsesAccent
        ? colorWithAlpha('#000000', 0.9)
        : colorWithAlpha(lyricInk.body, 0.72);
    const hintColor = colorWithAlpha(lyricInk.meta || lyricInk.body, 0.92);

    const displayWords = useMemo(() => {
        if (!activeLine) return [];
        const layoutUnits = buildPostLyricLayoutUnits(activeLine, { semantic: true, sticky: true });
        return buildDisplayWordsFromLayoutUnits(layoutUnits);
    }, [activeLine]);

    const lineFitScale = useMemo(() => {
        if (!displayWords.length || typeof document === 'undefined') return 1;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 1;
        const weight = Math.max(fontPreset.fontWeight, 700);
        ctx.font = `${weight} ${lyricFit.fontPx}px ${fontStack}`;
        const gap = lyricFit.fontPx * 0.14;
        const contentWidth = displayWords.reduce((sum, word, index) => {
            const width = ctx.measureText(word.text).width + Math.max(0, letterSpacingPx) * Math.max(0, word.text.length - 1);
            return sum + width + (index > 0 ? gap : 0);
        }, 0);
        return resolveLyricLineFitScale(contentWidth * 1.08, lyricFit.usableWidth);
    }, [displayWords, fontPreset.fontWeight, fontStack, letterSpacingPx, lyricFit.fontPx, lyricFit.usableWidth]);

    const translationFontPx = Math.max(16, lyricFit.fontPx * 0.28);
    const showTranslation = Boolean(
        showSubtitleTranslation
        && !hideTranslationSubtitle
        && activeLine?.translation?.trim(),
    );

    return (
        <VisualizerShell
            theme={theme}
            audioPower={audioPower}
            audioBands={audioBands}
            sharedProps={props}
        >
            <div
                ref={stageRef}
                className="pointer-events-none absolute inset-0 z-10 flex h-full w-full items-center justify-center overflow-hidden"
                data-testid="yehuo-lyric-stage"
                style={{ paddingTop: lyricVertical.opticalTopBiasPx }}
            >
                {showText ? (
                    <div
                        className="relative flex w-full flex-col items-center justify-center px-4"
                        style={{
                            height: `${(lyricVertical.maxHeightRatio * 100).toFixed(2)}%`,
                            maxHeight: `${(lyricVertical.maxHeightRatio * 100).toFixed(2)}%`,
                            paddingLeft: lyricFit.sidePaddingPx,
                            paddingRight: lyricFit.sidePaddingPx,
                            paddingTop: lyricVertical.topPaddingPx,
                            paddingBottom: lyricVertical.bottomPaddingPx,
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {activeLine ? (
                                <motion.div
                                    key={`${activeLine.startTime}-${activeLine.fullText}`}
                                    className="flex max-w-full flex-col items-center"
                                    initial={{ opacity: 0, scale: 0.72, y: 28 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.06, y: -18, filter: 'blur(8px)' }}
                                    transition={{
                                        duration: 0.42,
                                        ease: [0.16, 1.25, 0.28, 1],
                                    }}
                                >
                                    <div
                                        className="flex max-w-full flex-wrap items-center justify-center gap-x-[0.14em] gap-y-[0.08em] text-center"
                                        style={{
                                            fontFamily: fontStack,
                                            fontWeight: Math.max(fontPreset.fontWeight, 700),
                                            transform: lineFitScale < 0.999 ? `scale(${lineFitScale})` : undefined,
                                            transformOrigin: 'center center',
                                        }}
                                    >
                                        {displayWords.map((word, index) => (
                                            <DazibaoWord
                                                key={`${word.text}-${index}-${activeLine.startTime}`}
                                                word={word}
                                                currentTime={currentTime}
                                                baseColor={baseColor}
                                                activeColor={activeColor}
                                                glowColor={glowColor}
                                                strokeColor={strokeColor}
                                                fontPx={lyricFit.fontPx}
                                                fontStack={fontStack}
                                                fontWeight={Math.max(fontPreset.fontWeight, 700)}
                                                letterSpacingPx={letterSpacingPx}
                                                waitingPresentation={waitingPresentation}
                                                visualEffectConfig={visualEffectConfig}
                                                isChorus={isChorus}
                                            />
                                        ))}
                                    </div>

                                    {showTranslation ? (
                                        <motion.div
                                            className="mt-4 max-w-[90%] text-center font-semibold"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 0.72, y: 0 }}
                                            transition={{ duration: 0.28, delay: 0.08 }}
                                            style={{
                                                color: hintColor,
                                                fontSize: `${translationFontPx}px`,
                                                fontFamily: fontStack,
                                                textShadow: `0 8px 24px ${colorWithAlpha('#000000', 0.55)}`,
                                            }}
                                        >
                                            {activeLine.translation}
                                        </motion.div>
                                    ) : null}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.55 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center font-semibold"
                                    style={{
                                        color: hintColor,
                                        fontSize: `${Math.max(18, lyricFit.fontPx * 0.4)}px`,
                                        fontFamily: fontStack,
                                    }}
                                >
                                    {t('ui.waitingForMusic')}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : null}
            </div>
        </VisualizerShell>
    );
};

export default VisualizerDazibao;
