// Only for the you who has yet to exist in this world.
// DO NOT REMOVE THE LINE ABOVE.
import React, { useMemo, useState, useEffect, useRef, useLayoutEffect, useCallback, useId } from 'react';
import { measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext';
import { useMotionValue, animate, MotionValue, useSpring, motion } from 'framer-motion';
import { DEFAULT_CLADDAGH_TUNING, type Line, type Theme } from '../../../types';
import { buildLineGraphemeTimeline } from '../../../utils/lyrics/graphemeTiming';
import { resolveThemeFontStack } from '../../../utils/fontStacks';
import { type VisualizerSharedProps } from '../definition';
import { useVisualizerRuntime } from '../runtime';
import { colorWithAlpha, mixColors } from '../colorMix';
import { LYRIC_LINE_OPACITY } from '../../../utils/theme/lyricColorPresets';
import VisualizerShell from '../VisualizerShell';
import VisualizerSubtitleOverlay from '../VisualizerSubtitleOverlay';
import { buildWordColorRanges } from '../wordColoring';
import { resolveWaitingWordPresentation } from '../../../utils/lyrics/lyricWordMode';
import { resolveLyricWordStatus } from '../../../utils/lyrics/lyricWordStatusMath';
import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';
import {
    isCladdaghEquatorPulseUnchanged,
    resolveCladdaghEquatorPulseSnapshot,
    CLADDAGH_EQUATOR_PULSE_MIN_INTERVAL_MS,
    type CladdaghEquatorPulseSnapshot,
} from '../../../utils/visualizer/claddaghEquatorPulseMath';
import {
    isCladdaghGlyphEffectivelyHidden,
    shouldWriteCladdaghGlyphDom,
    type CladdaghGlyphDomCache,
} from '../../../utils/visualizer/claddaghGlyphDomMath';
import {
    applyCladdaghFrontCenterPull,
    CLADDAGH_LINE_ORBIT_PHASE_STEP,
    projectCladdaghRingPoint,
    resolveCladdaghGlyphTiltDeg,
    resolveCladdaghLineOrbitPhase,
    resolveCladdaghOrbitDepth,
    resolveCladdaghOrbitMajorRadius,
    resolveCladdaghOrbitMinorRadius,
    resolveCladdaghOrbitRingGuide,
} from '../../../utils/visualizer/claddaghOrbitMath';

// src/components/visualizer/claddagh/VisualizerCladdagh.tsx

/**
 * Checks if a character belongs to the CJK (Chinese, Japanese, Korean) block.
 */
const isCJKChar = (char: string): boolean => {
    return /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(char);
};

/**
 * Calculates a relative visual length score of a sentence.
 * CJK characters are counted as 1.0, while other half-width characters count as 0.5.
 */
const getVisualLength = (text: string): number => {
    if (!text) return 0;
    let score = 0;
    for (let i = 0; i < text.length; i++) {
        score += isCJKChar(text[i]) ? 1.0 : 0.5;
    }
    return score;
};

/**
 * Adjusts character timeline specifically for Claddagh visualizer by smoothly
 * distributing time durations over gap/space characters.
 * If word spacing has zero or very small duration, it borrows time safely from neighboring characters.
 */
const adjustCladdaghTimeline = <T extends { startTime: number; endTime: number; }>(
    timeline: T[],
    line: Line
): T[] => {
    if (timeline.length === 0) return timeline;

    const adjusted = timeline.map(item => ({ ...item }));
    const n = adjusted.length;
    let i = 0;

    while (i < n) {
        if (adjusted[i].startTime === adjusted[i].endTime) {
            let j = i;
            while (j < n && adjusted[j].startTime === adjusted[j].endTime) {
                j++;
            }
            const gapCount = j - i;
            let gapStart = i > 0 ? adjusted[i - 1].endTime : line.startTime;
            let gapEnd = j < n ? adjusted[j].startTime : line.endTime;

            const minNeeded = gapCount * 0.06; // 60ms per character
            let duration = gapEnd - gapStart;

            if (duration < minNeeded) {
                const deficit = minNeeded - duration;
                if (i > 0 && j < n) {
                    const half = deficit / 2;
                    const prevDuration = adjusted[i - 1].endTime - adjusted[i - 1].startTime;
                    const prevSteal = Math.min(half, Math.max(0, prevDuration - 0.04));

                    const nextDuration = adjusted[j].endTime - adjusted[j].startTime;
                    const nextSteal = Math.min(deficit - prevSteal, Math.max(0, nextDuration - 0.04));

                    gapStart -= prevSteal;
                    gapEnd += nextSteal;

                    adjusted[i - 1].endTime = gapStart;
                    adjusted[j].startTime = gapEnd;
                } else if (i > 0) {
                    const prevDuration = adjusted[i - 1].endTime - adjusted[i - 1].startTime;
                    const prevSteal = Math.min(deficit, Math.max(0, prevDuration - 0.04));
                    gapStart -= prevSteal;
                    adjusted[i - 1].endTime = gapStart;
                } else if (j < n) {
                    const nextDuration = adjusted[j].endTime - adjusted[j].startTime;
                    const nextSteal = Math.min(deficit, Math.max(0, nextDuration - 0.04));
                    gapEnd += nextSteal;
                    adjusted[j].startTime = gapEnd;
                }
                duration = gapEnd - gapStart;
            }

            const gapUnit = duration > 0 ? duration / gapCount : 0;
            for (let k = i; k < j; k++) {
                const idxInGap = k - i;
                adjusted[k].startTime = gapStart + gapUnit * idxInGap;
                adjusted[k].endTime = gapStart + gapUnit * (idxInGap + 1);
            }
            i = j;
        } else {
            i++;
        }
    }

    return adjusted;
};


const CLADDAGH_MAX_ARC_SPAN = 4.25;
const CLADDAGH_LETTER_SPACING_EM = 0.04;
const CLADDAGH_BASE_TRACKING_EM = 0.18;
/** Mild back-follow — equator layout can't absorb a large chase offset. */
const CLADDAGH_BACK_FOLLOW_RATIO = 0.08;
const CLADDAGH_BACK_ORBIT_FOLLOW_RATIO = 0.1;
/** Soft line handoff: short phase step + ease-out, no big equator sweep. */
const CLADDAGH_LINE_HANDOFF_TRANSITION = {
    type: 'tween' as const,
    duration: 0.52,
    ease: [0.33, 1, 0.32, 1] as [number, number, number, number],
};
const CLADDAGH_SPACING_CACHE_LIMIT = 240;
const claddaghSpacingCache = new Map<string, number[]>();

const getFallbackGraphemeWidth = (char: string, fontPx: number): number => {
    if (/^\s+$/.test(char)) return fontPx * 0.36;
    if (isCJKChar(char)) return fontPx;
    return fontPx * 0.62;
};

/**
 * Calculates a fractional index corresponding to the current time,
 * interpolating smoothly between grapheme timestamps.
 */
const getFractionalActiveIndex = (
    timeline: Array<{ startTime: number; endTime: number; }>,
    t: number,
    renderEnd?: number
): number => {
    if (timeline.length === 0) return 0;
    if (timeline.length === 1) {
        const item = timeline[0];
        const targetEnd = typeof renderEnd === 'number' && Number.isFinite(renderEnd) ? renderEnd : item.endTime;
        const dur = Math.max(0.2, targetEnd - item.startTime);
        if (t <= item.startTime) return 0;
        return (t - item.startTime) / dur;
    }

    if (t <= timeline[0].startTime) return 0;

    const lastIdx = timeline.length - 1;
    // Allow smooth extrapolation/overshoot past the last character's start time to prevent freezing
    if (t >= timeline[lastIdx].startTime) {
        const lastItem = timeline[lastIdx];

        if (typeof renderEnd === 'number' && Number.isFinite(renderEnd) && renderEnd > lastItem.startTime) {
            const progress = clamp((t - lastItem.startTime) / (renderEnd - lastItem.startTime), 0, 1);
            return lastIdx + progress * 2.0;
        }

        const prevItem = timeline[lastIdx - 1];
        const itemDur = lastItem.endTime - lastItem.startTime;
        const gapDur = lastItem.startTime - prevItem.startTime;
        const stepDur = itemDur > 0 ? itemDur : (gapDur > 0 ? gapDur : 0.5);

        const progress = (t - lastItem.startTime) / stepDur;
        // Limit rotation allowance to 1.8 character units past the last char
        const cappedProgress = Math.min(progress, 1.8);
        return lastIdx + cappedProgress;
    }

    for (let i = 0; i < timeline.length - 1; i++) {
        const tStart = timeline[i].startTime;
        const tEnd = timeline[i + 1].startTime;
        if (t >= tStart && t < tEnd) {
            if (tEnd === tStart) return i;
            return i + (t - tStart) / (tEnd - tStart);
        }
    }
    return timeline.length - 1;
};



const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const rememberSpacingOffsets = (key: string, offsets: number[]) => {
    if (claddaghSpacingCache.size >= CLADDAGH_SPACING_CACHE_LIMIT) {
        const oldestKey = claddaghSpacingCache.keys().next().value;
        if (oldestKey) {
            claddaghSpacingCache.delete(oldestKey);
        }
    }
    claddaghSpacingCache.set(key, offsets);
    return offsets;
};

const measureCladdaghTextWidth = (text: string, fontSpec: string, fontPx: number, fallbackWidth: number): number => {
    if (!text) return 0;
    const prepared = prepareWithSegments(text, fontSpec, {
        whiteSpace: 'pre-wrap',
        letterSpacing: fontPx * CLADDAGH_LETTER_SPACING_EM,
    });
    const measuredWidth = measureNaturalWidth(prepared);
    return Number.isFinite(measuredWidth) && measuredWidth > 0 ? measuredWidth : fallbackWidth;
};

// Uses pretext's canvas-backed font measurement to place grapheme centers at their rendered advance positions.
const measureCladdaghGraphemeOffsets = (graphemes: string[], fontSpec: string, fontPx: number): number[] => {
    const text = graphemes.join('');
    const cacheKey = `${fontPx}|${fontSpec}|${CLADDAGH_BASE_TRACKING_EM}|${text}`;
    const cached = claddaghSpacingCache.get(cacheKey);
    if (cached) return cached;

    const offsets = new Array<number>(graphemes.length + 1).fill(0);
    let fallbackWidth = 0;
    for (let index = 1; index <= graphemes.length; index += 1) {
        fallbackWidth += getFallbackGraphemeWidth(graphemes[index - 1], fontPx);
        const baseTracking = Math.max(0, index - 1) * fontPx * CLADDAGH_BASE_TRACKING_EM;
        offsets[index] = Math.max(
            offsets[index - 1],
            measureCladdaghTextWidth(graphemes.slice(0, index).join(''), fontSpec, fontPx, fallbackWidth) + baseTracking
        );
    }
    return rememberSpacingOffsets(cacheKey, offsets);
};

const buildMeasuredSpacingInfo = <T extends { char: string; }>(
    items: T[],
    fontSpec: string,
    fontPx: number,
    radiusPx: number,
    spacingScale = 1
) => {
    if (items.length === 0) return [];
    const graphemes = items.map(item => item.char);
    const offsets = measureCladdaghGraphemeOffsets(graphemes, fontSpec, fontPx);
    const safeSpacingScale = Number.isFinite(spacingScale) ? Math.max(0.1, spacingScale) : 1;
    const totalWidth = (offsets[offsets.length - 1] ?? 0) * safeSpacingScale;
    const safeRadius = Math.max(radiusPx, fontPx * 2, 1);
    const totalSpan = totalWidth / safeRadius;
    const scaleFactor = totalSpan > CLADDAGH_MAX_ARC_SPAN ? CLADDAGH_MAX_ARC_SPAN / totalSpan : 1.0;

    return items.map((item, index) => {
        const centerPx = ((offsets[index] ?? 0) + (offsets[index + 1] ?? offsets[index] ?? 0)) / 2 * safeSpacingScale;
        const startAngle = centerPx / safeRadius;
        return {
            ...item,
            startAngle,
            nominalAngle: (startAngle - totalSpan / 2) * scaleFactor,
        };
    });
};

const getLineWordOffset = (
    spacingInfo: Array<{ nominalAngle: number; startTime: number; endTime: number; }>,
    latestTime: number,
    renderEnd?: number
) => {
    if (spacingInfo.length === 0) return 0;
    const fractionalIndex = getFractionalActiveIndex(spacingInfo, latestTime, renderEnd);
    const lastIdx = spacingInfo.length - 1;
    if (fractionalIndex <= lastIdx) {
        const intPart = Math.floor(fractionalIndex);
        const fracPart = fractionalIndex - intPart;
        const angleA = spacingInfo[intPart]?.nominalAngle ?? 0;
        const angleB = spacingInfo[Math.min(intPart + 1, lastIdx)]?.nominalAngle ?? 0;
        return angleA + (angleB - angleA) * fracPart;
    }

    const lastAngle = spacingInfo[lastIdx]?.nominalAngle ?? 0;
    const prevAngle = spacingInfo[Math.max(0, lastIdx - 1)]?.nominalAngle ?? 0;
    const step = lastAngle - prevAngle;
    const overshoot = fractionalIndex - lastIdx;
    return lastAngle + step * overshoot;
};

const getLinePlaybackProgress = (
    spacingInfo: Array<{ nominalAngle: number; startTime: number; endTime: number; }>,
    latestTime: number,
    renderEnd?: number
) => {
    if (spacingInfo.length === 0) return 0;
    if (spacingInfo.length === 1) {
        const item = spacingInfo[0];
        const targetEnd = typeof renderEnd === 'number' && Number.isFinite(renderEnd) ? renderEnd : item.endTime;
        const duration = Math.max(0.001, targetEnd - item.startTime);
        return clamp((latestTime - item.startTime) / duration, 0, 1);
    }

    const fractionalIndex = getFractionalActiveIndex(spacingInfo, latestTime, renderEnd);
    return clamp(fractionalIndex / Math.max(1, spacingInfo.length - 1), 0, 1);
};

interface RingLineProps {
    line: Line;
    lineIndex: number;
    centerLineIndex: number;
    currentTime: MotionValue<number>;
    lineOffset: MotionValue<number>;
    theme: Theme;
    lyricsFontScale?: number;
    Rx: number;
    Ry: number;
    audioPower: MotionValue<number>;
    containerWidth: number;
    containerHeight: number;
    activeSpacingInfo: Array<{ nominalAngle: number; startTime: number; endTime: number; }>;
    renderBaseIndex: number;
    lines: Line[];
    focusScaleRatio?: number;
    ellipseTiltDeg?: number;
    textSpacingScale?: number;
}

/**
 * Component representing a single line of lyrics projected onto a portion of the 3D ring.
 */
const RingLine: React.FC<RingLineProps> = ({
    line,
    lineIndex,
    centerLineIndex,
    currentTime,
    lineOffset,
    theme,
    lyricsFontScale = 1.0,
    Rx,
    Ry,
    audioPower,
    containerWidth,
    containerHeight,
    activeSpacingInfo,
    renderBaseIndex,
    lines,
    focusScaleRatio,
    ellipseTiltDeg,
    textSpacingScale = 1,
}) => {
    const fontStack = resolveThemeFontStack(theme);
    const baseFontSize = 72 * lyricsFontScale;
    const fontSpec = `700 ${baseFontSize}px ${fontStack}`;
    const lyricWordMode = useSettingsUiStore(state => state.lyricWordMode);
    const waitingPresentation = useMemo(
        () => resolveWaitingWordPresentation(lyricWordMode),
        [lyricWordMode],
    );

    // Solid fills only — soft text-shadow / glow washes out glyphs on dark covers.
    const baseColor = useMemo(
        () => colorWithAlpha(theme.primaryColor, LYRIC_LINE_OPACITY.waitingNear),
        [theme.primaryColor],
    );
    const highlightColor = theme.primaryColor;
    const waitingOpacity = waitingPresentation.opacity;
    const focusScale = focusScaleRatio ?? 0.62;
    const currentLineVisualLen = useMemo(
        () => (lines[centerLineIndex] ? getVisualLength(lines[centerLineIndex].fullText) : 0),
        [lines, centerLineIndex],
    );
    const targetLineVisualLen = useMemo(
        () => getVisualLength(line.fullText),
        [line.fullText],
    );

    const isRawScaleRef = useRef(false);
    const normalizePower = useCallback((power: number) => {
        if (!Number.isFinite(power)) return 0;
        if (power > 1.0) {
            isRawScaleRef.current = true;
        }
        return Math.max(0, Math.min(1, isRawScaleRef.current ? power / 255 : power));
    }, []);

    // Calculate layout positioning and angles for each character/grapheme.
    const spacingInfo = useMemo(() => {
        const timeline = adjustCladdaghTimeline(buildLineGraphemeTimeline(line), line);
        const wordColorRanges = buildWordColorRanges(line.fullText, theme.wordColors);

        let codeUnitCursor = 0;
        const data = timeline.map(t => {
            const charLength = t.char.length;
            const startOffset = codeUnitCursor;
            const endOffset = codeUnitCursor + charLength;
            codeUnitCursor = endOffset;

            // Find if this character overlaps with any wordColor range
            const matchedRange = wordColorRanges.find(
                range => startOffset < range.endOffset && range.startOffset < endOffset
            );
            const charColor = matchedRange ? matchedRange.color : null;

            return {
                ...t,
                charColor,
            };
        });

        return buildMeasuredSpacingInfo(data, fontSpec, baseFontSize, Rx, textSpacingScale);
    }, [line, theme.wordColors, fontSpec, baseFontSize, Rx, textSpacingScale]);

    const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const glyphDomCacheRef = useRef<(CladdaghGlyphDomCache | undefined)[]>([]);
    const glyphFrameRef = useRef(0);

    useLayoutEffect(() => {
        const paint = () => {
            glyphFrameRef.current = 0;
            const mvsLength = spacingInfo.length;
            if (mvsLength === 0) return;

            const latestTime = currentTime.get();
            const curLineOffset = lineOffset.get();
            const power = normalizePower(audioPower.get());
            const intensity = theme.animationIntensity || 'normal';
            let intensityMultiplier = 0.25;
            let maxScale = 1.25;

            if (intensity === 'calm') {
                intensityMultiplier = 0.08;
                maxScale = 1.08;
            } else if (intensity === 'chaotic') {
                intensityMultiplier = 0.95;
                maxScale = 1.95;
            }

            // Scale radius, bounded to avoid excessive translation
            const scaleFactor = Math.min(1 + power * intensityMultiplier, maxScale);
            const currentRx = Rx * scaleFactor;

            const linePhase = resolveCladdaghLineOrbitPhase(lineIndex);
            const lineDiffFromCenter = Math.abs(curLineOffset - linePhase)
                / Math.max(CLADDAGH_LINE_ORBIT_PHASE_STEP, 1e-6);

            let lengthFadeFactor = 1.0;
            let lengthScaleFactor = 1.0;

            if (lineIndex > centerLineIndex && currentLineVisualLen > 10) {
                const fadeStrength = clamp((currentLineVisualLen - 10) / 8, 0, 1);
                const targetStrength = clamp((targetLineVisualLen - 5) / 5, 0.4, 1);
                const combinedStrength = fadeStrength * targetStrength;

                const targetMinOpacity = 1.0 - combinedStrength;
                const targetMinScale = 1.0 - combinedStrength * 0.25;

                const transitionProgress = clamp((lineDiffFromCenter - 0.4) / 0.5, 0, 1);

                lengthFadeFactor = 1.0 - (1.0 - targetMinOpacity) * transitionProgress;
                lengthScaleFactor = 1.0 - (1.0 - targetMinScale) * transitionProgress;
            }
            const activeLine = lines[renderBaseIndex];
            const activeRenderEnd = activeLine ? (activeLine.renderHints?.renderEndTime ?? activeLine.endTime) : undefined;
            const ownRenderEnd = line.renderHints?.renderEndTime ?? line.endTime;

            const activeWordOffset = getLineWordOffset(activeSpacingInfo, latestTime, activeRenderEnd);
            const ownWordOffset = getLineWordOffset(spacingInfo, latestTime, ownRenderEnd);
            const activeLineProgress = getLinePlaybackProgress(activeSpacingInfo, latestTime, activeRenderEnd);
            const backOrbitFollow = Math.PI
                * CLADDAGH_BACK_ORBIT_FOLLOW_RATIO
                * (1 - Math.pow(1 - activeLineProgress, 1.35));
            let wordOffset = ownWordOffset;
            if (lineIndex >= centerLineIndex) {
                // Use lineDiffFromCenter as a continuous blend factor so the
                // back-follow contribution fades out smoothly during the spring
                // rotation, instead of jumping to 0 when renderBaseIndex updates.
                const backFollowFactor = lineIndex > centerLineIndex
                    ? 1
                    : clamp(lineDiffFromCenter, 0, 1);
                wordOffset += (
                    activeWordOffset * CLADDAGH_BACK_FOLLOW_RATIO
                    + backOrbitFollow
                ) * backFollowFactor;
            }

            const R_major = currentRx;
            const lineDiffNormalized = lineDiffFromCenter;
            const activeLineFactor = Math.max(0, 1 - lineDiffNormalized);
            const maxVisibleDist = currentRx * 0.52;
            const lineWindowFade = clamp(2.15 - lineDiffNormalized, 0.2, 1);
            const pastFade = lineIndex < centerLineIndex
                ? Math.max(0.14, 1 - lineDiffNormalized * 0.9)
                : 1;
            const isChorus = Boolean(line.isChorus);
            const caches = glyphDomCacheRef.current;
            if (caches.length !== mvsLength) {
                glyphDomCacheRef.current = new Array(mvsLength);
            }

            for (let i = 0; i < mvsLength; i++) {
                const el = charRefs.current[i];
                if (!el) continue;

                const item = spacingInfo[i];
                const theta = linePhase + item.nominalAngle;
                const psi = theta - curLineOffset - wordOffset;
                const deltaDist = psi * R_major;
                const thetaCurve = deltaDist / R_major;
                const localCos = Math.cos(thetaCurve);
                const D = resolveCladdaghOrbitDepth(thetaCurve);
                const spacingFactor = 0.74 + 0.26 * Math.pow(D, 1.15);

                // Collar on the ground — lyrics ride the vertical wall (文字在项圈壁上).
                const hit = projectCladdaghRingPoint(thetaCurve, R_major, spacingFactor);
                const depth = hit.depth;
                const distRatio = Math.min(1, Math.abs(deltaDist) / maxVisibleDist);
                const F = activeLineFactor * Math.pow(1 - distRatio, 1.6);

                const pulled = applyCladdaghFrontCenterPull(hit.x, hit.y, F);
                let x = pulled.x;
                let y = pulled.y;
                if (isChorus) {
                    const staggerAmount = baseFontSize * (0.05 + power * 0.1) * (1 - F);
                    y += (i % 2 === 0 ? 1 : -1) * staggerAmount;
                }

                const depthFocus = Math.max(depth, F);
                const distanceOpacity = 0.12 + 0.88 * Math.pow(depthFocus, 1.55);
                let finalOpacity = (0.28 + 0.72 * Math.pow(depthFocus, 1.35) * (0.3 + 0.7 * F))
                    * distanceOpacity
                    * lineWindowFade
                    * pastFade
                    * lengthFadeFactor;

                if (lineDiffFromCenter > 0.02) {
                    const progress = clamp((lineDiffFromCenter - 0.35) / 0.7, 0, 1);
                    const cosThreshold = 1.0 - progress;
                    if (localCos > cosThreshold) {
                        finalOpacity *= clamp(1.0 - (localCos - cosThreshold) / 0.28, 0.18, 1);
                    }
                }

                const activeColorState = resolveLyricWordStatus(
                    latestTime,
                    item.startTime,
                    item.endTime,
                );
                if (activeColorState === 'waiting') {
                    finalOpacity *= waitingOpacity;
                }

                const targetColor = activeColorState === 'active' || activeColorState === 'passed'
                    ? (item.charColor || highlightColor)
                    : baseColor;

                const nextCache: CladdaghGlyphDomCache = {
                    x,
                    y,
                    rot: 0,
                    scale: 0,
                    opacity: finalOpacity,
                    color: targetColor,
                };

                if (isCladdaghGlyphEffectivelyHidden(finalOpacity)) {
                    if (shouldWriteCladdaghGlyphDom(caches[i], nextCache)) {
                        el.style.opacity = '0';
                        caches[i] = nextCache;
                    }
                    continue;
                }

                const scale = (0.24 + 0.76 * Math.pow(depth, 1.4))
                    * (1.0 + focusScale * F)
                    * hit.perspectiveScale
                    * lengthScaleFactor;
                const tiltAngle = resolveCladdaghGlyphTiltDeg(hit.tangentAngleDeg, depth, F);
                nextCache.rot = tiltAngle;
                nextCache.scale = scale;

                if (!shouldWriteCladdaghGlyphDom(caches[i], nextCache)) {
                    continue;
                }

                el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0px) rotate(${tiltAngle.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
                el.style.opacity = finalOpacity.toFixed(3);
                if (caches[i]?.color !== targetColor) {
                    el.style.color = targetColor;
                }
                caches[i] = nextCache;
            }
        };

        // Coalesce motion-value storms into one paint per animation frame.
        const schedule = () => {
            if (glyphFrameRef.current) return;
            glyphFrameRef.current = requestAnimationFrame(paint);
        };

        const unsubscribeTime = currentTime.on('change', schedule);
        const unsubscribeOffset = lineOffset.on('change', schedule);
        paint();

        return () => {
            unsubscribeTime();
            unsubscribeOffset();
            if (glyphFrameRef.current) {
                cancelAnimationFrame(glyphFrameRef.current);
                glyphFrameRef.current = 0;
            }
        };
    }, [
        spacingInfo,
        lineIndex,
        centerLineIndex,
        lineOffset,
        Rx,
        audioPower,
        currentTime,
        activeSpacingInfo,
        renderBaseIndex,
        highlightColor,
        baseColor,
        focusScale,
        lines,
        line,
        waitingOpacity,
        currentLineVisualLen,
        targetLineVisualLen,
        baseFontSize,
        normalizePower,
        theme.animationIntensity,
    ]);

    return (
        <div className="absolute inset-0 pointer-events-none w-full h-full">
            {spacingInfo.map((item, idx) => (
                <span
                    key={idx}
                    ref={el => { charRefs.current[idx] = el; }}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        opacity: 0,
                        transform: 'translate3d(-50%, -50%, 0px) scale(0.2)',
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity',
                        filter: 'none',
                        textShadow: 'none',
                        fontFamily: fontStack,
                        fontSize: `${baseFontSize}px`,
                        fontWeight: 700,
                        letterSpacing: `${CLADDAGH_LETTER_SPACING_EM}em`,
                        whiteSpace: 'nowrap',
                        color: baseColor,
                    }}
                >
                    {item.char}
                </span>
            ))}
        </div>
    );
};

const VisualizerCladdagh: React.FC<VisualizerSharedProps> = (props) => {
    const {
        currentTime,
        currentLineIndex,
        lines,
        theme,
        showText = true,
        lyricsFontScale = 1.0,
        subtitleOverlayOpacity,
        hideTranslationSubtitle,
        showSubtitleTranslation,
        audioPower,
        audioBands,
        claddaghTuning = DEFAULT_CLADDAGH_TUNING,
        paused = false,
    } = props;

    // Parallel front view — ring guide stays axis-aligned with the viewport.
    const centerNormalTiltDeg = 0;

    const isRawScaleRef = useRef(false);
    const normalizePower = useCallback((power: number) => {
        if (!Number.isFinite(power)) return 0;
        if (power > 1.0) {
            isRawScaleRef.current = true;
        }
        return Math.max(0, Math.min(1, isRawScaleRef.current ? power / 255 : power));
    }, []);

    const { activeLine, upcomingLine, recentCompletedLine, nextLines } = useVisualizerRuntime({
        currentTime,
        currentLineIndex,
        lines,
    });

    const isChorus = activeLine?.isChorus ?? false;

    const smoothedBass = useSpring(audioBands.bass, {
        stiffness: 150,
        damping: 25,
    });
    const smoothedVocal = useSpring(audioBands.vocal, {
        stiffness: 120,
        damping: 24,
    });
    const fontStack = resolveThemeFontStack(theme);
    const baseFontSize = 72 * lyricsFontScale;
    const fontSpec = `700 ${baseFontSize}px ${fontStack}`;

    const containerRef = useRef<HTMLDivElement>(null);
    const orbitRingGroupRef = useRef<SVGGElement>(null);
    const orbitRingTrackRef = useRef<SVGPathElement>(null);
    const orbitRingRimTopRef = useRef<SVGPathElement>(null);
    const orbitRingRimBottomRef = useRef<SVGPathElement>(null);
    const orbitRingFrontArcRef = useRef<SVGPathElement>(null);
    const equatorSvgId = useId().replace(/:/g, '');
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Initialize dimensions on mount to avoid zero size on first render
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setDimensions({ width: rect.width, height: rect.height });
            }
        }
        // Track container dimensions responsively using ResizeObserver
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });
        if (container) observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // 3D foreshortened oval — horizontal axes, sized to the stage.
    const Rx = resolveCladdaghOrbitMajorRadius(
        dimensions.width,
        dimensions.height,
        claddaghTuning.radiusScale,
    );
    const Ry = resolveCladdaghOrbitMinorRadius(Rx);
    const orbitRingGuide = resolveCladdaghOrbitRingGuide(
        dimensions.width,
        dimensions.height,
        Rx,
        0,
    );
    const focusSpacingScale = (1 + claddaghTuning.focusScaleRatio) / (1 + DEFAULT_CLADDAGH_TUNING.focusScaleRatio);
    const activeTextSpacingScale = focusSpacingScale;

    // Pulse the equatorial collar with audio — throttled + dirty-checked (~25fps).
    useEffect(() => {
        const groupEl = orbitRingGroupRef.current;
        const trackEl = orbitRingTrackRef.current;
        const rimTopEl = orbitRingRimTopRef.current;
        const rimBottomEl = orbitRingRimBottomRef.current;
        const frontArcEl = orbitRingFrontArcRef.current;
        if (!groupEl || !trackEl) return;

        let frameId = 0;
        let shimmerPhase = 0;
        let lastPulseAt = 0;
        let lastSnapshot: CladdaghEquatorPulseSnapshot | null = null;
        let lastMixed = '';
        let lastBright = '';
        const originX = orbitRingGuide.cx;
        const originY = orbitRingGuide.cy;
        groupEl.style.transformOrigin = `${originX}px ${originY}px`;

        const applyPulse = (force: boolean) => {
            const now = performance.now();
            if (!force && now - lastPulseAt < CLADDAGH_EQUATOR_PULSE_MIN_INTERVAL_MS) {
                return;
            }
            lastPulseAt = now;

            const bassPower = paused ? 0 : normalizePower(smoothedBass.get());
            const vocalPower = paused ? 0 : normalizePower(smoothedVocal.get());
            shimmerPhase += paused ? 0 : (0.9 + vocalPower * 2.4) * (CLADDAGH_EQUATOR_PULSE_MIN_INTERVAL_MS / 16.67);
            const snapshot = resolveCladdaghEquatorPulseSnapshot(bassPower, vocalPower, shimmerPhase);
            if (!force && isCladdaghEquatorPulseUnchanged(lastSnapshot, snapshot)) {
                return;
            }
            lastSnapshot = snapshot;

            const fromColor = theme.primaryColor || '#ffffff';
            let toColor = theme.accentColor || '#ffffff';
            if (toColor === fromColor && theme.secondaryColor) {
                toColor = theme.secondaryColor;
            }
            if (toColor === fromColor) {
                toColor = '#ffffff';
            }

            const colorRatio = snapshot.colorRatioQ;
            const mixed = mixColors(fromColor, toColor, colorRatio, 0.28 + 0.55 * colorRatio);
            const bright = mixColors(mixed, '#ffffff', 0.35 + 0.4 * colorRatio, 0.55);
            const colorChanged = mixed !== lastMixed || bright !== lastBright;
            lastMixed = mixed;
            lastBright = bright;

            if (colorChanged) {
                const rimOpacity = (0.012 + 0.018 * colorRatio).toFixed(3);
                const rimWidth = (0.35 + colorRatio * 0.1).toFixed(2);
                if (rimTopEl) {
                    rimTopEl.setAttribute('stroke', bright);
                    rimTopEl.setAttribute('stroke-opacity', rimOpacity);
                    rimTopEl.setAttribute('stroke-width', rimWidth);
                }
                if (rimBottomEl) {
                    rimBottomEl.setAttribute('stroke', mixed);
                    rimBottomEl.setAttribute('stroke-opacity', (0.008 + 0.012 * colorRatio).toFixed(3));
                    rimBottomEl.setAttribute('stroke-width', rimWidth);
                }
                trackEl.setAttribute('stroke', bright);
                trackEl.setAttribute('stroke-opacity', (0.015 + 0.025 * colorRatio).toFixed(3));
                trackEl.setAttribute('stroke-width', (0.4 + colorRatio * 0.1).toFixed(2));
            }
            if (frontArcEl) {
                if (colorChanged) {
                    frontArcEl.setAttribute('stroke', bright);
                    frontArcEl.setAttribute('stroke-opacity', (0.025 + 0.045 * colorRatio).toFixed(3));
                    frontArcEl.setAttribute('stroke-width', (0.45 + colorRatio * 0.15).toFixed(2));
                    frontArcEl.setAttribute('stroke-dasharray', `${snapshot.dashA} ${snapshot.dashB}`);
                }
                frontArcEl.setAttribute('stroke-dashoffset', (-snapshot.shimmerQ).toFixed(1));
            }
            groupEl.style.transform = `rotate(${centerNormalTiltDeg}deg) scale(${snapshot.breathQ})`;
        };

        const tick = () => {
            applyPulse(false);
            // Paused: stop the loop after one settle paint.
            if (!paused) {
                frameId = requestAnimationFrame(tick);
            }
        };

        applyPulse(true);
        if (!paused) {
            frameId = requestAnimationFrame(tick);
        }

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [
        smoothedBass,
        smoothedVocal,
        theme.primaryColor,
        theme.accentColor,
        theme.secondaryColor,
        centerNormalTiltDeg,
        paused,
        orbitRingGuide.cx,
        orbitRingGuide.cy,
        normalizePower,
    ]);

    // Determine the focus line index
    const focusIndex = currentLineIndex !== -1
        ? currentLineIndex
        : (recentCompletedLine
            ? lines.indexOf(recentCompletedLine)
            : -1);
    const centerLineIndex = Math.max(-1, focusIndex);
    const [renderBaseIndex, setRenderBaseIndex] = useState(centerLineIndex);

    const activeSpacingInfo = useMemo(() => {
        const line = lines[renderBaseIndex];
        if (!line) return [];
        const timeline = adjustCladdaghTimeline(buildLineGraphemeTimeline(line), line);
        return buildMeasuredSpacingInfo(timeline, fontSpec, baseFontSize, Rx, activeTextSpacingScale);
    }, [lines, renderBaseIndex, fontSpec, baseFontSize, Rx, activeTextSpacingScale]);

    // Increasing phase keeps line handoff moving in the same orbit direction as word progression.
    const lineOffset = useMotionValue(resolveCladdaghLineOrbitPhase(centerLineIndex));
    const lastIndexRef = useRef(centerLineIndex);

    useEffect(() => {
        const prev = lastIndexRef.current;
        const curr = centerLineIndex;
        lastIndexRef.current = curr;
        const targetPhase = resolveCladdaghLineOrbitPhase(curr);

        if (Math.abs(curr - prev) > 1) {
            lineOffset.set(targetPhase);
            setRenderBaseIndex(curr);
        } else {
            // Update renderBaseIndex immediately so activeSpacingInfo tracks
            // the new active line from the start. This prevents the wordOffset
            // discontinuity that occurred when onComplete switched it later.
            setRenderBaseIndex(curr);
            const controls = animate(lineOffset, targetPhase, CLADDAGH_LINE_HANDOFF_TRANSITION);
            return () => controls.stop();
        }
    }, [centerLineIndex, lineOffset]);

    // Keep the transition pair + one preceding line rendered so the outgoing
    // line remains visible during the spring rotation.
    const lineIndicesToRender = useMemo(() => {
        const indices = [];
        if (lines.length === 0) return [];
        for (let i = renderBaseIndex - 1; i <= renderBaseIndex + 2; i++) {
            if (i >= 0 && i < lines.length) {
                indices.push(i);
            }
        }
        if (indices.length === 0) {
            indices.push(Math.max(0, Math.min(centerLineIndex, lines.length - 1)));
        }
        return indices;
    }, [centerLineIndex, lines.length, renderBaseIndex]);

    return (
        <VisualizerShell
            theme={theme}
            audioPower={audioPower}
            audioBands={audioBands}
            sharedProps={props}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.04, filter: 'blur(4px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                ref={containerRef as any}
                className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden select-none"
            >
                {/* Collar / 项圈: layered equator — glow, wall, twin rims, front energy. */}
                <svg
                    className="absolute inset-0 pointer-events-none z-[1]"
                    width={dimensions.width}
                    height={dimensions.height}
                    viewBox={`0 0 ${Math.max(dimensions.width, 1)} ${Math.max(dimensions.height, 1)}`}
                    aria-hidden
                >
                    <defs>
                        <linearGradient
                            id={`claddagh-eq-fade-${equatorSvgId}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                            <stop offset="14%" stopColor="#fff" stopOpacity="0.55" />
                            <stop offset="50%" stopColor="#fff" stopOpacity="1" />
                            <stop offset="86%" stopColor="#fff" stopOpacity="0.55" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                        </linearGradient>
                        <mask id={`claddagh-eq-mask-${equatorSvgId}`}>
                            <rect
                                width="100%"
                                height="100%"
                                fill={`url(#claddagh-eq-fade-${equatorSvgId})`}
                            />
                        </mask>
                    </defs>
                    <g
                        ref={orbitRingGroupRef}
                        mask={`url(#claddagh-eq-mask-${equatorSvgId})`}
                        style={{
                            transformOrigin: `${orbitRingGuide.cx}px ${orbitRingGuide.cy}px`,
                            willChange: 'stroke, stroke-opacity, fill-opacity, transform',
                        }}
                    >
                        <path
                            ref={orbitRingRimBottomRef}
                            d={orbitRingGuide.rimBottomPath}
                            fill="none"
                            stroke={theme.primaryColor}
                            strokeOpacity={0.008}
                            strokeWidth={0.35}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="0.7 18"
                        />
                        <path
                            ref={orbitRingRimTopRef}
                            d={orbitRingGuide.rimTopPath}
                            fill="none"
                            stroke={theme.primaryColor}
                            strokeOpacity={0.012}
                            strokeWidth={0.35}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="0.7 18"
                        />
                        <path
                            ref={orbitRingTrackRef}
                            d={orbitRingGuide.trackPath}
                            fill="none"
                            stroke={theme.primaryColor}
                            strokeOpacity={0.015}
                            strokeWidth={0.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="0.8 15"
                        />
                        <path
                            ref={orbitRingFrontArcRef}
                            d={orbitRingGuide.frontArcPath}
                            fill="none"
                            stroke={theme.accentColor || theme.primaryColor}
                            strokeOpacity={0.025}
                            strokeWidth={0.45}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="1 18"
                        />
                    </g>
                </svg>

                <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }}>
                    {showText && Rx > 0 && Ry > 0 && lineIndicesToRender.map(idx => (
                        <RingLine
                            key={idx}
                            line={lines[idx]}
                            lineIndex={idx}
                            centerLineIndex={centerLineIndex}
                            currentTime={currentTime}
                            lineOffset={lineOffset}
                            theme={theme}
                            lyricsFontScale={lyricsFontScale}
                            Rx={Rx}
                            Ry={Ry}
                            audioPower={smoothedBass}
                            containerWidth={dimensions.width}
                            containerHeight={dimensions.height}
                            activeSpacingInfo={activeSpacingInfo}
                            renderBaseIndex={renderBaseIndex}
                            lines={lines}
                            focusScaleRatio={claddaghTuning.focusScaleRatio}
                            ellipseTiltDeg={claddaghTuning.ellipseTiltDeg}
                            textSpacingScale={activeTextSpacingScale}
                        />
                    ))}
                </div>
            </motion.div>

            {showText && (
                <VisualizerSubtitleOverlay
                    showText={showText}
                    activeLine={activeLine}
                    recentCompletedLine={recentCompletedLine}
                    nextLines={nextLines}
                    theme={theme}
                    translationFontSize="clamp(1.35rem, 2.8vw, 1.7rem)"
                    upcomingFontSize="clamp(0.95rem, 1.8vw, 1.2rem)"
                    subtitleOverlayOpacity={subtitleOverlayOpacity}
                    hideTranslationSubtitle={hideTranslationSubtitle}
                    showSubtitleTranslation={showSubtitleTranslation}
                />
            )}
        </VisualizerShell>
    );
};

export default VisualizerCladdagh;
