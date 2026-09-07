import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CADENZA_TUNING, type Line } from '../../../types';
import { getLineRenderEndTime } from '../../../utils/lyrics/renderHints';
import { colorWithAlpha, mixColors } from '../colorMix';
import { prepareActiveAndUpcoming, useVisualizerRuntime } from '../runtime';
import { type VisualizerSharedProps } from '../definition';
import VisualizerSubtitleOverlay from '../VisualizerSubtitleOverlay';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import { resolveWaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { resolveCadenzaGlowIntensity } from '../../../utils/visualizer/cadenzaGlowMath';
import { ACTIVE_PULSE_FREQUENCY, clamp, isCJK, mix, splitGraphemes } from './cadenzaMath';
import { buildPreparedState } from './cadenzaLayoutMath';
import {
    clearOverlayWordNodes,
    createOverlayWordNodes,
    syncOverlayGlyphSpans,
} from './cadenzaOverlayNodes';
import {
    buildCadenzaOverlayTransform,
    buildDomTextShadow,
    resolveCadenzaPlacementPose,
} from './cadenzaPlacementPose';
import {
    getClassicBodyMix,
    getClassicCharGlow,
    getClassicGlowEnvelope,
    getClassicLineEnvelope,
    getClassicPassedDrift,
    getWordProgress,
    getWordStatus,
    resolveLineRenderTiming,
} from './cadenzaTiming';
import type {
    AnimatedPlacementState,
    OverlayWordNodes,
    PreparedState,
    PreparedStateCacheContext,
} from './cadenzaTypes';

// src/components/visualizer/cadenza/VisualizerCadenza.tsx
// Cadenza stage: Folia-sized hero type + CSS 3D float, RAF overlay (no extra engine).

type VisualizerProps = VisualizerSharedProps;

const VisualizerCadenza: React.FC<VisualizerProps> = (props) => {
    const {
        currentTime,
        currentLineIndex,
        lines,
        theme,
        audioPower,
        showText = true,
        cadenzaTuning = DEFAULT_CADENZA_TUNING,
        lyricsFontScale = 1,
        subtitleOverlayOpacity,
        isPlayerChromeHidden = false,
        hideTranslationSubtitle = false,
        showSubtitleTranslation = true,
    } = props;
    const { t } = useTranslation();
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const visualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const waitingWordPresentation = resolveWaitingWordPresentation(lyricWordMode);
    const effectiveGlowIntensity = resolveCadenzaGlowIntensity(
        cadenzaTuning.glowIntensity,
        visualEffectIntensity,
    );
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const lineLayerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const overlayNodesRef = useRef<Map<string, OverlayWordNodes>>(new Map());
    const textCanvasRef = useRef<HTMLCanvasElement>(null);
    const animatedPlacementRef = useRef<Map<string, AnimatedPlacementState>>(new Map());
    const preparedStateCacheRef = useRef<Map<string, PreparedState>>(new Map());
    const preparedStateCacheContextKeyRef = useRef<string>('');
    const lastFrameTimeRef = useRef<number | null>(null);

    const {
        activeLine,
        recentCompletedLine,
        upcomingLine,
        nextLines,
    } = useVisualizerRuntime({
        currentTime,
        currentLineIndex,
        lines,
        getLineEndTime: getLineRenderEndTime,
    });
    const tuning = cadenzaTuning;
    const emptyFontSize = `clamp(${(1.5 * lyricsFontScale).toFixed(3)}rem, ${(3.5 * lyricsFontScale).toFixed(3)}vw, ${(2.25 * lyricsFontScale).toFixed(3)}rem)`;
    const translationFontSize = `clamp(${(1.35 * lyricsFontScale).toFixed(3)}rem, ${(3.1 * lyricsFontScale).toFixed(3)}vw, ${(1.55 * lyricsFontScale).toFixed(3)}rem)`;
    const upcomingFontSize = `clamp(${(0.875 * lyricsFontScale).toFixed(3)}rem, ${(2 * lyricsFontScale).toFixed(3)}vw, ${(1 * lyricsFontScale).toFixed(3)}rem)`;

    const preparedStateContext = useMemo<PreparedStateCacheContext>(() => ({
        showText,
        viewport,
        theme,
        tuning: {
            fontScale: tuning.fontScale,
            widthRatio: tuning.widthRatio,
        },
    }), [showText, theme, tuning.fontScale, tuning.widthRatio, viewport]);

    const preparedStateContextKey = useMemo(() => {
        const wordColorSignature = (theme.wordColors ?? [])
            .map(entry => `${typeof entry?.word === 'string' ? entry.word : ''}:${typeof entry?.color === 'string' ? entry.color : ''}`)
            .join('||');

        // Prepared line state caches per-word highlight colors derived from the active theme.
        // Include accentColor so daylight/default resets invalidate already-seen lyric lines immediately.
        return [
            showText ? '1' : '0',
            viewport.width,
            viewport.height,
            theme.fontStyle,
            theme.fontFamily ?? '',
            String(theme.fontWeight ?? 'auto'),
            theme.animationIntensity,
            theme.accentColor,
            tuning.fontScale,
            tuning.widthRatio,
            wordColorSignature,
        ].join('|');
    }, [
        theme.accentColor,
        showText,
        theme.animationIntensity,
        theme.fontFamily,
        theme.fontWeight,
        theme.fontStyle,
        theme.wordColors,
        tuning.fontScale,
        tuning.widthRatio,
        viewport.height,
        viewport.width,
    ]);

    if (preparedStateCacheContextKeyRef.current !== preparedStateContextKey) {
        preparedStateCacheRef.current.clear();
        preparedStateCacheContextKeyRef.current = preparedStateContextKey;
    }

    const getPreparedStateCacheKey = (line: Line) => [
        line.startTime,
        line.endTime,
        line.fullText,
        line.words.length,
    ].join('|');

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;
            setViewport({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const preparedState = useMemo<PreparedState | null>(() => {
        const getOrPrepareState = (line: Line | null) => {
            if (!line) {
                return null;
            }

            const cacheKey = getPreparedStateCacheKey(line);
            const cached = preparedStateCacheRef.current.get(cacheKey);
            if (cached) {
                return cached;
            }

            const nextState = buildPreparedState(line, preparedStateContext);
            if (nextState) {
                preparedStateCacheRef.current.set(cacheKey, nextState);
            }
            return nextState;
        };

        if (!showText || viewport.width <= 0 || viewport.height <= 0) {
            getOrPrepareState(upcomingLine);
            return null;
        }

        return prepareActiveAndUpcoming({
            activeLine,
            upcomingLine,
            prepareLine: getOrPrepareState,
        });
    }, [activeLine, preparedStateContext, upcomingLine, showText, viewport.height, viewport.width]);

    useEffect(() => {
        const textCanvas = textCanvasRef.current;
        const lineLayer = lineLayerRef.current;
        const overlay = overlayRef.current;
        if (!textCanvas || !lineLayer || !overlay || viewport.width <= 0 || viewport.height <= 0) return;

        let frameId = 0;
        const textContext = textCanvas.getContext('2d');
        if (!textContext) return;

        const draw = () => {
            const now = performance.now();
            const dt = lastFrameTimeRef.current === null
                ? 1 / 60
                : clamp((now - lastFrameTimeRef.current) / 1000, 1 / 240, 0.05);
            lastFrameTimeRef.current = now;
            const width = Math.max(Math.floor(viewport.width), 1);
            const height = Math.max(Math.floor(viewport.height), 1);
            const dpr = window.devicePixelRatio || 1;

            if (textCanvas.width !== Math.floor(width * dpr) || textCanvas.height !== Math.floor(height * dpr)) {
                textCanvas.width = Math.floor(width * dpr);
                textCanvas.height = Math.floor(height * dpr);
                textCanvas.style.width = `${width}px`;
                textCanvas.style.height = `${height}px`;
            }

            textContext.setTransform(dpr, 0, 0, dpr, 0, 0);
            textContext.clearRect(0, 0, width, height);

            if (!showText || !preparedState || !activeLine) {
                lineLayer.style.opacity = '0';
                lineLayer.style.filter = 'none';
                lineLayer.style.transform = 'scale(1)';
                lineLayer.style.transformStyle = 'preserve-3d';
                lineLayer.style.perspective = '1000px';
                clearOverlayWordNodes(overlayNodesRef.current);
                frameId = window.requestAnimationFrame(draw);
                return;
            }

            const time = currentTime.get();
            const lineTiming = resolveLineRenderTiming(activeLine);
            const lineEnvelope = getClassicLineEnvelope(time, activeLine, lineTiming);
            const wordRevealMode = lineTiming.wordRevealMode;
            const isInstantWordReveal = wordRevealMode === 'instant';
            const lineSeed = Math.abs(Math.sin(activeLine.startTime * 997.1));
            const linePerspective = theme.animationIntensity === 'chaotic' ? 500 + Math.round(lineSeed * 500) : 1000;
            const energy = clamp(audioPower.get() / 255, 0, 1);
            const motionEnergy = energy * tuning.motionAmount;
            const verticalLift = Math.sin(time * 2.3) * (3 + motionEnergy * 8);
            const focusY = height * 0.42 + verticalLift;

            lineLayer.style.opacity = lineEnvelope.opacity.toString();
            lineLayer.style.filter = lineEnvelope.blur > 0.05 ? `blur(${lineEnvelope.blur.toFixed(2)}px)` : 'none';
            lineLayer.style.transform = `scale(${lineEnvelope.scale})`;
            lineLayer.style.transformStyle = 'preserve-3d';
            lineLayer.style.perspective = `${linePerspective}px`;

            textContext.font = preparedState.font;
            textContext.textBaseline = 'alphabetic';
            textContext.lineJoin = 'round';
            textContext.lineCap = 'round';

            const placements = [...preparedState.placements].sort((a, b) => {
                const order = { waiting: 0, passed: 1, active: 2 } as const;
                return order[getWordStatus(time, lineTiming, a.word)] - order[getWordStatus(time, lineTiming, b.word)];
            });
            const placementIds = new Set(placements.map(placement => placement.id));
            const overlayNodes = overlayNodesRef.current;
            const usedOverlayIds = new Set<string>();

            placements.forEach((placement, placementIndex) => {
                const status = getWordStatus(time, lineTiming, placement.word);
                const progress = getWordProgress(time, wordRevealMode, placement.word);
                const passedAlpha = isInstantWordReveal
                    ? 0
                    : theme.animationIntensity === 'chaotic'
                        ? 0.9
                        : 0.82;
                const pulse = status === 'active'
                    && !isInstantWordReveal
                    ? 1 + Math.sin(time * ACTIVE_PULSE_FREQUENCY + placement.word.startTime * 5) * 0.04 * tuning.motionAmount
                    : 1;
                const passedDriftProgress = isInstantWordReveal ? 0 : getClassicPassedDrift(time, placement.word);
                const localFloatX = Math.sin(time * 1.2 + placementIndex * 0.6) * motionEnergy * 4;
                const localFloatY = Math.cos(time * 1.5 + placementIndex * 0.4) * motionEnergy * 2.5;
                const pose = resolveCadenzaPlacementPose({
                    placement,
                    status,
                    parkAtRest: waitingWordPresentation.parkAtRest,
                    waitingOpacity: waitingWordPresentation.opacity,
                    waitingBlurPx: waitingWordPresentation.blurPx,
                    isInstantWordReveal,
                    passedAlpha,
                    pulse,
                    passedDriftProgress,
                    width,
                    focusY,
                    localFloatX,
                    localFloatY,
                });
                const targetActiveMix = getClassicBodyMix(time, lineTiming, placement.word);
                const targetGlowAlpha = getClassicGlowEnvelope(time, lineTiming, placement.word);
                const transformTransitionAmount = 1 - Math.exp(-11 * dt);
                const visualTransitionAmount = 1 - Math.exp(-14 * dt);
                const stateMap = animatedPlacementRef.current;
                const existingState = stateMap.get(placement.id);
                const shouldInitializeAsActive = isInstantWordReveal && time >= placement.word.startTime;
                const animatedState = existingState ?? {
                    x: width / 2 + placement.x + placement.entryOffsetX,
                    y: focusY + placement.y + placement.entryOffsetY,
                    rotation: shouldInitializeAsActive ? pose.rotation : pose.rotation + 16,
                    rotateX: shouldInitializeAsActive ? pose.rotateX : pose.rotateX + 12,
                    z: shouldInitializeAsActive ? pose.z : pose.z - 48,
                    scale: shouldInitializeAsActive ? pose.scale : Math.max(placement.scale * 0.5, 0.5),
                    bodyAlpha: shouldInitializeAsActive ? pose.bodyAlpha : 0,
                    blur: shouldInitializeAsActive ? pose.blur : 10,
                    activeMix: shouldInitializeAsActive ? targetActiveMix : 0,
                    glowAlpha: shouldInitializeAsActive ? targetGlowAlpha : 0,
                };

                animatedState.x = mix(animatedState.x, pose.x, transformTransitionAmount);
                animatedState.y = mix(animatedState.y, pose.y, transformTransitionAmount);
                animatedState.rotation = mix(animatedState.rotation, pose.rotation, transformTransitionAmount);
                animatedState.rotateX = mix(
                    Number.isFinite(animatedState.rotateX) ? animatedState.rotateX : pose.rotateX,
                    pose.rotateX,
                    transformTransitionAmount,
                );
                animatedState.z = mix(
                    Number.isFinite(animatedState.z) ? animatedState.z : pose.z,
                    pose.z,
                    transformTransitionAmount,
                );
                animatedState.scale = mix(animatedState.scale, pose.scale, transformTransitionAmount);
                animatedState.bodyAlpha = mix(animatedState.bodyAlpha, pose.bodyAlpha, visualTransitionAmount);
                animatedState.blur = mix(animatedState.blur, pose.blur, visualTransitionAmount);
                animatedState.activeMix = mix(animatedState.activeMix, targetActiveMix, visualTransitionAmount);
                animatedState.glowAlpha = mix(animatedState.glowAlpha, targetGlowAlpha, 1 - Math.exp(-16 * dt));
                stateMap.set(placement.id, animatedState);

                if (animatedState.bodyAlpha < 0.015 && animatedState.glowAlpha < 0.015) {
                    return;
                }

                const drawX = animatedState.x;
                const drawBaselineY = animatedState.y;
                const visualWidth = placement.width * animatedState.scale;
                const visualHeight = placement.height * animatedState.scale;
                const highlightHeight = visualHeight * (status === 'active' ? 1.08 : 1);
                const scaledLeft = drawX - (visualWidth - placement.width) / 2;
                if (status === 'active' && !placement.isInterlude) {
                    if (activeLine.isChorus) {
                        const rippleRadius = Math.max(visualWidth, highlightHeight) * (0.55 + progress * 0.45);
                        textContext.strokeStyle = colorWithAlpha(placement.color, 0.45 * (1 - progress) * animatedState.bodyAlpha);
                        textContext.lineWidth = 1.2;
                        textContext.beginPath();
                        textContext.arc(
                            scaledLeft + visualWidth / 2,
                            drawBaselineY - visualHeight * 0.42,
                            rippleRadius,
                            0,
                            Math.PI * 2,
                        );
                        textContext.stroke();
                    }
                }

                const textX = -placement.width / 2;
                const textY = placement.height * 0.42;
                const textColor = mixColors(theme.primaryColor, placement.color, animatedState.activeMix);

                const overlayAnchorX = drawX + placement.width / 2;
                const overlayAnchorY = drawBaselineY - placement.height * 0.42;
                const overlayOffsetX = textX;
                const textMetrics = textContext.measureText(placement.text);
                const measuredAscent = textMetrics.actualBoundingBoxAscent || preparedState.fontPx * 0.78;
                const overlayOffsetY = textY - measuredAscent;
                const glyphs = splitGraphemes(placement.text);
                const shouldSplitGlow = wordRevealMode === 'normal' && !isCJK(placement.text) && glyphs.length > 1;
                const blurScale = 1 + energy * 0.22;
                usedOverlayIds.add(placement.id);
                let overlayWord = overlayNodes.get(placement.id);
                if (!overlayWord) {
                    overlayWord = createOverlayWordNodes();
                    overlayNodes.set(placement.id, overlayWord);
                    overlay.appendChild(overlayWord.outer);
                }

                overlayWord.outer.style.transform = buildCadenzaOverlayTransform(animatedState, overlayAnchorX, overlayAnchorY);
                overlayWord.outer.style.transformOrigin = '0 0';
                overlayWord.outer.style.transformStyle = 'preserve-3d';
                overlayWord.inner.style.font = preparedState.font;
                overlayWord.inner.style.transform = `translate3d(${overlayOffsetX}px, ${overlayOffsetY}px, 0)`;
                overlayWord.body.textContent = placement.text;
                overlayWord.body.style.color = textColor;
                overlayWord.body.style.opacity = animatedState.bodyAlpha.toString();
                overlayWord.body.style.filter = animatedState.blur > 0.05 ? `blur(${animatedState.blur.toFixed(2)}px)` : 'none';

                const glowTexts = shouldSplitGlow ? glyphs : [placement.text];
                syncOverlayGlyphSpans(overlayWord, glowTexts);

                if (shouldSplitGlow) {
                    overlayWord.glyphSpans.forEach((glyphSpan, glyphIndex) => {
                        const absoluteIndex = placement.fragmentStartInWord + glyphIndex;
                        const intensity = getClassicCharGlow(
                            time,
                            placement.word,
                            absoluteIndex,
                            Math.max(placement.wordGraphemeCount, glyphs.length),
                            placement.wordGraphemeTimings,
                        ) * clamp(animatedState.glowAlpha, 0, 1) * Math.max(effectiveGlowIntensity, 0);

                        glyphSpan.style.textShadow = buildDomTextShadow(placement.color, intensity, blurScale);
                    });
                } else if (overlayWord.glyphSpans[0]) {
                    const intensity = getClassicGlowEnvelope(time, lineTiming, placement.word)
                        * clamp(animatedState.glowAlpha, 0, 1)
                        * Math.max(effectiveGlowIntensity, 0);
                    overlayWord.glyphSpans[0].style.textShadow = buildDomTextShadow(placement.color, intensity, blurScale);
                }

            });

            animatedPlacementRef.current.forEach((_value, key) => {
                if (!placementIds.has(key)) {
                    animatedPlacementRef.current.delete(key);
                }
            });

            overlayNodes.forEach((nodes, key) => {
                if (!usedOverlayIds.has(key)) {
                    nodes.outer.remove();
                    overlayNodes.delete(key);
                }
            });

            frameId = window.requestAnimationFrame(draw);
        };

        draw();
        return () => {
            window.cancelAnimationFrame(frameId);
            lastFrameTimeRef.current = null;
            clearOverlayWordNodes(overlayNodesRef.current);
        };
    }, [
        audioPower,
        currentTime,
        activeLine,
        preparedState,
        showText,
        theme,
        effectiveGlowIntensity,
        tuning.motionAmount,
        viewport.height,
        viewport.width,
        waitingWordPresentation.blurPx,
        waitingWordPresentation.opacity,
        waitingWordPresentation.parkAtRest,
    ]);

    return (
        <div ref={containerRef} className="absolute inset-0">
            <div
                ref={lineLayerRef}
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    opacity: 0,
                    filter: 'none',
                    transform: 'scale(1)',
                    transformOrigin: '50% 42%',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                }}
            >
                <div ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none select-none" />
                <canvas ref={textCanvasRef} className="absolute inset-0 w-full h-full" />
            </div>

            <div className="relative z-10 w-full h-[70vh] flex items-center justify-center p-8 pointer-events-none">
                <AnimatePresence mode="wait">
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
        </div>
    );
};

export default VisualizerCadenza;
