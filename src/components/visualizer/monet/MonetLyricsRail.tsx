import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useTransform, MotionValue } from 'framer-motion';
import type { Theme, AudioBands, Line } from '../../../types';
import type { GraphemeTiming } from '../../../utils/lyrics/graphemeTiming';
import { getLineRenderEndTime } from '../../../utils/lyrics/renderHints';
import { colorWithAlpha } from '../colorMix';
import {
    buildWordColorRangesFromMatchers,
    prepareWordColorMatchers,
    resolveTokenColorMap,
    type WordColorMatcher,
} from '../wordColoring';
import {
    resolveLyricStageInkColors,
} from '../../../utils/theme/lyricColorPresets';
import {
    buildMonetDisplayTokens,
    measureMonetGraphemeOffsets,
    measureMonetLineLayout,
    type MonetLineStatus,
    type MonetMeasuredLineLayout,
    type MonetVisibleLineEntry,
} from './monetLyricsModel';
import {
    resolveMonetLineTone,
    type MonetLineTone,
    type MonetRailPresentation,
} from './monetLineTone';
import {
    buildLyricKaraokeOutlineLayers,
    getRecommendedEffectConfig,
    type LyricVisualEffectConfig,
    type LyricVisualEffectIntensity,
} from '../../../utils/lyricVisualEffects';
import {
    getDefaultLyricFontPreset,
    getLyricFontPresetById,
    getLyricLetterSpacingPx,
} from '../../../utils/lyricFontPresets';

import { useSettingsUiStore } from '../../../stores/useSettingsUiStore';


// src/components/visualizer/monet/MonetLyricsRail.tsx
// Renders Monet lyrics on fixed transform tracks so scrolling stays smooth without layout reflow jumps.

export type { MonetRailPresentation, MonetLineTone } from './monetLineTone';

interface MonetLyricsRailProps {
    entries: MonetVisibleLineEntry[];
    lines: Line[];
    currentLineIndex: number;
    currentTime: MotionValue<number>;
    theme: Theme;
    lyricFontPx: number;
    inactiveFontPx: number;
    translationFontPx: number;
    fontStack: string;
    keywordColoringEnabled: boolean;
    emptyText: string;
    showSubtitleTranslation?: boolean;
    /** karaoke = KTV dual-color word fill with readable upcoming lines (no Monet blur stack). */
    presentation?: MonetRailPresentation;
    audioPower?: MotionValue<number>;
    audioBands?: AudioBands;
    onLyricLineSeek?: (lyricTimeSec: number) => void;
    seekDisabled?: boolean;
    /** 沉浸模式 - 启用极致的视觉效果 */
    immersiveLyrics?: boolean;
    /** 歌词字体预设 ID */
    lyricFontPresetId?: string;
    /** 视觉效果强度 */
    visualEffectIntensity?: LyricVisualEffectIntensity;
}

interface MonetRailSize {
    width: number;
    height: number;
}

interface PositionedMonetLineEntry extends MonetVisibleLineEntry {
    y: number;
    tone: MonetLineTone;
    layout: MonetMeasuredLineLayout;
    scaledHeight: number;
}

type MonetLayoutCache = Map<string, MonetMeasuredLineLayout>;

const MONET_RAIL_WIDTH_FALLBACK_PX = 680;
const MONET_RAIL_HEIGHT_FALLBACK_PX = 340;
const MONET_ACTIVE_GAP_PX = 18;
const MONET_INACTIVE_GAP_PX = 14;
const MONET_SCROLL_IDLE_RESET_MS = 1800;
const MONET_SCROLL_STEP_PX = 72;
const MONET_TOUCH_STEP_PX = 52;
const MONET_SCROLL_BEFORE = 4;
const MONET_SCROLL_AFTER = 4;
const MONET_LAYOUT_CACHE_LIMIT = 240;
const MONET_RAIL_SCROLL_EVENT_OPTIONS: AddEventListenerOptions = { passive: false };
const MONET_SCROLL_TRANSITION = {
    y: { type: 'spring', stiffness: 142, damping: 28, mass: 0.82 },
    scale: { type: 'spring', stiffness: 150, damping: 30, mass: 0.78 },
    opacity: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const clampScrollSteps = (steps: number) => Math.max(-1, Math.min(1, steps));
const getScrollDirection = (delta: number) => (delta === 0 ? 0 : delta > 0 ? 1 : -1);

const resolveLineGap = (previous: PositionedMonetLineEntry, next: PositionedMonetLineEntry): number => (
    previous.status === 'active' || next.status === 'active'
        ? MONET_ACTIVE_GAP_PX
        : MONET_INACTIVE_GAP_PX
);

const resolveRailLineStatus = (lineIndex: number, activeLineIndex: number): MonetLineStatus => {
    if (lineIndex === activeLineIndex) {
        return 'active';
    }
    if (activeLineIndex >= 0 && lineIndex < activeLineIndex) {
        return 'passed';
    }
    return 'waiting';
};

const buildScrollableRailEntries = (
    lines: Line[],
    anchorIndex: number,
    activeLineIndex: number,
): MonetVisibleLineEntry[] => {
    if (lines.length === 0) {
        return [];
    }

    const safeAnchorIndex = Math.round(clamp(anchorIndex, 0, lines.length - 1));
    const startIndex = Math.max(0, safeAnchorIndex - MONET_SCROLL_BEFORE);
    const endIndex = Math.min(lines.length - 1, safeAnchorIndex + MONET_SCROLL_AFTER);
    const nextEntries: MonetVisibleLineEntry[] = [];

    for (let index = startIndex; index <= endIndex; index += 1) {
        const line = lines[index];
        nextEntries.push({
            key: `${index}-${line.startTime}-${line.fullText}`,
            line,
            index,
            offset: index - safeAnchorIndex,
            status: resolveRailLineStatus(index, activeLineIndex),
        });
    }

    return nextEntries;
};

const trimOldestCacheEntry = <TValue,>(cache: Map<string, TValue>, limit: number) => {
    if (cache.size < limit) {
        return;
    }

    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
        cache.delete(oldestKey);
    }
};

const buildMonetLayoutCacheKey = (
    entry: MonetVisibleLineEntry,
    fontPx: number,
    translationFontPx: number,
    fontStack: string,
    maxWidthPx: number,
    showSubtitleTranslation: boolean,
) => [
    entry.index,
    entry.line.startTime,
    entry.line.endTime,
    entry.line.fullText,
    entry.line.translation ?? '',
    entry.status,
    fontPx,
    translationFontPx,
    fontStack,
    maxWidthPx,
    showSubtitleTranslation ? 1 : 0,
].join('\u0001');

const getOrMeasureMonetLineLayout = (
    cache: MonetLayoutCache,
    entry: MonetVisibleLineEntry,
    fontPx: number,
    translationFontPx: number,
    fontStack: string,
    maxWidthPx: number,
    showSubtitleTranslation: boolean,
) => {
    const cacheKey = buildMonetLayoutCacheKey(entry, fontPx, translationFontPx, fontStack, maxWidthPx, showSubtitleTranslation);
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const layout = measureMonetLineLayout({
        line: entry.line,
        status: entry.status,
        fontPx,
        translationFontPx,
        fontStack,
        maxWidthPx,
        showSubtitleTranslation,
    });
    trimOldestCacheEntry(cache, MONET_LAYOUT_CACHE_LIMIT);
    cache.set(cacheKey, layout);
    return layout;
};

const useMonetRailSize = (ref: React.RefObject<HTMLDivElement | null>): MonetRailSize => {
    const [size, setSize] = useState<MonetRailSize>({ width: 0, height: 0 });

    useEffect(() => {
        const node = ref.current;
        if (!node) {
            return;
        }

        const updateSize = () => {
            const nextWidth = Math.round(node.clientWidth);
            const nextHeight = Math.round(node.clientHeight);
            setSize(current => (
                current.width === nextWidth && current.height === nextHeight
                    ? current
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(updateSize);
        observer.observe(node);
        return () => observer.disconnect();
    }, [ref]);

    return size;
};

const buildPositionedEntries = (
    entries: MonetVisibleLineEntry[],
    railSize: MonetRailSize,
    theme: Theme,
    lyricFontPx: number,
    inactiveFontPx: number,
    translationFontPx: number,
    fontStack: string,
    glowBufferPx: number,
    showSubtitleTranslation: boolean,
    layoutCache: MonetLayoutCache,
    presentation: MonetRailPresentation = 'monet',
    immersiveLyrics: boolean = false,
): PositionedMonetLineEntry[] => {
    const railWidth = railSize.width || MONET_RAIL_WIDTH_FALLBACK_PX;
    const railHeight = railSize.height || MONET_RAIL_HEIGHT_FALLBACK_PX;
    const inactiveScale = clamp(inactiveFontPx / Math.max(lyricFontPx, 1), 0.72, 0.92);
    const contentWidthPx = Math.max(railWidth - glowBufferPx * 2, 0);

    const measuredEntries: PositionedMonetLineEntry[] = entries.map(entry => {
        const tone = resolveMonetLineTone(entry, theme, inactiveScale, presentation, immersiveLyrics);
        const layout = getOrMeasureMonetLineLayout(
            layoutCache,
            entry,
            lyricFontPx,
            translationFontPx,
            fontStack,
            contentWidthPx - 8,
            showSubtitleTranslation,
        );

        return {
            ...entry,
            y: 0,
            tone,
            layout,
            scaledHeight: layout.visualHeightPx * tone.scale,
        };
    });

    if (measuredEntries.length === 0) {
        return [];
    }

    const anchorIndex = Math.max(0, measuredEntries.findIndex(entry => entry.offset === 0));
    // Karaoke keeps the active line higher so more upcoming rows stay in view like a KTV screen.
    const focusCenterY = railHeight * (presentation === 'karaoke' ? 0.36 : 0.46);
    measuredEntries[anchorIndex].y = focusCenterY - measuredEntries[anchorIndex].scaledHeight / 2;

    for (let index = anchorIndex + 1; index < measuredEntries.length; index += 1) {
        const previous = measuredEntries[index - 1];
        const current = measuredEntries[index];
        current.y = previous.y + previous.scaledHeight + resolveLineGap(previous, current);
    }

    for (let index = anchorIndex - 1; index >= 0; index -= 1) {
        const current = measuredEntries[index];
        const next = measuredEntries[index + 1];
        current.y = next.y - current.scaledHeight - resolveLineGap(current, next);
    }

    return measuredEntries;
};

const getLineMask = (isClipped: boolean, fadePx: number) => (
    isClipped
        ? `linear-gradient(180deg, black 0%, black calc(100% - ${fadePx}px), transparent 100%)`
        : undefined
);

const MonetTimedTokenSpan: React.FC<{
    entry: PositionedMonetLineEntry;
    currentTime: MotionValue<number>;
    accentColor: string;
    settleColor: string;
    fontPx: number;
    fontStack: string;
    wordColorMatchers: WordColorMatcher[];
    isChorus?: boolean;
    chorusAccentColor?: string;
    audioPower?: MotionValue<number>;
    renderStaticPassed?: boolean;
    enableGlow?: boolean;
    immersiveLyrics?: boolean;
    visualEffectConfig?: LyricVisualEffectConfig;
}> = ({ entry, currentTime, accentColor: _accentColor, settleColor, fontPx, fontStack, wordColorMatchers, isChorus: _isChorus, chorusAccentColor: _chorusAccentColor, audioPower, renderStaticPassed = false, enableGlow = true, immersiveLyrics = false, visualEffectConfig }) => {
    const lineRenderEndTime = useMemo(() => getLineRenderEndTime(entry.line), [entry.line]);
    const tokens = useMemo(() => buildMonetDisplayTokens(entry.line), [entry.line]);
    const wordColorRanges = useMemo(
        () => buildWordColorRangesFromMatchers(entry.line.fullText, wordColorMatchers),
        [entry.line.fullText, wordColorMatchers],
    );
    const tokenColors = useMemo(
        () => resolveTokenColorMap(tokens, wordColorRanges),
        [tokens, wordColorRanges],
    );
    const fontSpec = useMemo(
        () => `${entry.tone.fontWeight} ${fontPx}px ${fontStack}`,
        [entry.tone.fontWeight, fontPx, fontStack],
    );

    return (
        <span className="block w-full min-w-0 max-w-full whitespace-pre-wrap break-words">
            {tokens.map(token => (
                renderStaticPassed ? (
                    <span
                        key={token.key}
                        style={{
                            // Passed rows stay on body ink; keyword colors still win when set.
                            color: token.timed
                                ? tokenColors.get(token.key) ?? entry.tone.baseColor
                                : entry.tone.baseColor,
                        }}
                    >
                        {token.text}
                    </span>
                ) : token.timed && token.startTime !== null && token.endTime !== null ? (
                    <MonetWordSweep
                        key={token.key}
                        text={token.text}
                        startTime={token.startTime}
                        endTime={token.endTime}
                        graphemeTimings={token.graphemeTimings}
                        lineRenderEndTime={lineRenderEndTime}
                        currentTime={currentTime}
                        lineStatus={entry.status}
                        wordColor={tokenColors.get(token.key) ?? settleColor}
                        baseColor={entry.tone.baseColor}
                        fontPx={fontPx}
                        fontSpec={fontSpec}
                        enableGlow={enableGlow}
                        audioPower={audioPower}
                        immersiveLyrics={immersiveLyrics}
                        visualEffectConfig={visualEffectConfig}
                    />
                ) : (
                    <span key={token.key} style={{ color: entry.tone.baseColor }}>
                        {token.text}
                    </span>
                )
            ))}
        </span>
    );
};

const MonetWordSweep: React.FC<{
    text: string;
    startTime: number;
    endTime: number;
    graphemeTimings: GraphemeTiming[];
    lineRenderEndTime: number;
    currentTime: MotionValue<number>;
    lineStatus: MonetLineStatus;
    wordColor: string;
    baseColor: string;
    fontPx: number;
    fontSpec: string;
    enableGlow?: boolean;
    audioPower?: MotionValue<number>;
    immersiveLyrics?: boolean;
    visualEffectConfig?: LyricVisualEffectConfig;
}> = ({
    text,
    startTime,
    endTime,
    graphemeTimings,
    lineRenderEndTime: _lineRenderEndTime,
    currentTime,
    lineStatus,
    wordColor,
    baseColor,
    fontPx,
    fontSpec,
    enableGlow: _enableGlow = true,
    audioPower: _audioPower,
    immersiveLyrics: _immersiveLyrics = false,
    visualEffectConfig,
}) => {
        const isLineActive = lineStatus === 'active';
        const strokeEnabled = isLineActive && visualEffectConfig?.enableStroke !== false;
        const intensity = visualEffectConfig?.intensity ?? 'strong';
        // 色字白边: scaled solid rim + drop-shadow on wipe fill (calligraphy-safe).
        const outlineLayers = useMemo(
            () => buildLyricKaraokeOutlineLayers(wordColor, fontPx, intensity),
            [fontPx, intensity, wordColor],
        );
        const graphemeOffsets = useMemo(
            () => measureMonetGraphemeOffsets(text, fontPx, fontSpec),
            [text, fontPx, fontSpec],
        );

        const fillWidth = useTransform(currentTime, latest => {
            const fullWidth = graphemeOffsets[graphemeOffsets.length - 1] ?? 0;
            if (!isLineActive || latest <= startTime) return 0;
            if (latest >= endTime) return fullWidth;

            const timingCount = Math.min(graphemeTimings.length, graphemeOffsets.length - 1);
            if (timingCount > 0) {
                for (let index = 0; index < timingCount; index += 1) {
                    const timing = graphemeTimings[index];
                    const timingStart = Math.max(startTime, timing.startTime);
                    const timingEnd = Math.max(timingStart, timing.endTime);
                    const startWidth = graphemeOffsets[index] ?? 0;
                    const endWidth = graphemeOffsets[index + 1] ?? startWidth;

                    if (latest < timingStart) {
                        return startWidth;
                    }

                    if (latest <= timingEnd) {
                        const duration = Math.max(0.001, timingEnd - timingStart);
                        const progress = (latest - timingStart) / duration;
                        return startWidth + (endWidth - startWidth) * progress;
                    }
                }

                return graphemeOffsets[timingCount] ?? fullWidth;
            }

            const progress = (latest - startTime) / Math.max(0.001, endTime - startTime);
            if (progress <= 0) return 0;
            if (progress >= 1) return fullWidth;
            const graphemeCount = graphemeOffsets.length - 1;
            const floatIndex = progress * graphemeCount;
            const wholeIndex = Math.floor(floatIndex);
            const fractional = floatIndex - wholeIndex;
            const startWidth = graphemeOffsets[Math.min(wholeIndex, graphemeOffsets.length - 1)] ?? 0;
            const endWidth = graphemeOffsets[Math.min(wholeIndex + 1, graphemeOffsets.length - 1)] ?? startWidth;
            return startWidth + (endWidth - startWidth) * fractional;
        });

        const maskImage = useTransform(fillWidth, latest => {
            // Hard wipe edge — soft feather reads as blur on CJK strokes.
            const edgeSoftness = Math.max(Math.min(fontPx * 0.12, 4), 1.5);
            const solidEnd = Math.max(latest - edgeSoftness, 0);
            return `linear-gradient(90deg, #000 0px, #000 ${solidEnd}px, transparent ${latest}px, transparent 100%)`;
        });

        // One hue only: wipe reveals full body (or keyword color) over the dimmer underlay.
        const fillColor = wordColor;

        // Underlay always stays on dimmed body ink.
        const resolvedBaseColor = baseColor;

        return (
            <span className="relative inline-block whitespace-pre-wrap break-words">
                {strokeEnabled ? (
                    <motion.span
                        aria-hidden
                        className="lyric-karaoke-rim pointer-events-none absolute inset-0 select-none whitespace-pre-wrap break-words"
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
                <motion.span
                    className="relative"
                    style={{
                        color: resolvedBaseColor,
                    }}
                >
                    {text}
                </motion.span>
                {isLineActive ? (
                    <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 block whitespace-pre-wrap break-words"
                        style={{
                            WebkitMaskImage: maskImage,
                            maskImage,
                            WebkitMaskSize: '100% 100%',
                            maskSize: '100% 100%',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            color: fillColor,
                            // drop-shadow follows glyph alpha through calligraphy; Monet fill has no filter:none fight.
                            filter: strokeEnabled ? outlineLayers.fillFilter : undefined,
                        }}
                    >
                        {text}
                    </motion.span>
                ) : null}
            </span>
        );
};

const MonetRailLine: React.FC<{
    entry: PositionedMonetLineEntry;
    currentTime: MotionValue<number>;
    theme: Theme;
    lyricFontPx: number;
    translationFontPx: number;
    fontStack: string;
    glowBufferPx: number;
    vGlowBufferPx: number;
    wordColorMatchers: WordColorMatcher[];
    showSubtitleTranslation: boolean;
    presentation?: MonetRailPresentation;
    audioPower?: MotionValue<number>;
    onLineSeek?: (line: Line) => void;
    canSeek?: boolean;
    disableEntryMotion?: boolean;
    renderStaticPassed?: boolean;
    immersiveLyrics?: boolean;
    visualEffectConfig?: LyricVisualEffectConfig;
    letterSpacingPx?: number;
}> = ({ entry, currentTime, theme, lyricFontPx, translationFontPx, fontStack, glowBufferPx, vGlowBufferPx, wordColorMatchers, showSubtitleTranslation, presentation = 'monet', audioPower, onLineSeek, canSeek = false, disableEntryMotion = false, renderStaticPassed = false, immersiveLyrics = false, visualEffectConfig, letterSpacingPx = 0 }) => {
    const { activeColor, hintColor, titleColor } = resolveLyricStageInkColors(theme);
    const isKaraoke = presentation === 'karaoke';
    // Wipe + body share one hue; progress is opacity reveal, not a second fill color.
    const sungColor = activeColor;
    const settleColor = entry.status === 'active' ? titleColor : entry.tone.baseColor;
    const initialOffset = entry.offset >= 0 ? 34 : -34;
    const exitOffset = entry.status === 'passed' || entry.offset < 0 ? -38 : 38;
    const textMask = getLineMask(entry.layout.isTextClipped, Math.max(lyricFontPx * 0.55, 12));
    const translationMask = getLineMask(entry.layout.isTranslationClipped, Math.max(translationFontPx * 0.65, 10));
    const suppressMotion = disableEntryMotion || isKaraoke;
    const handleSeek = (event: React.MouseEvent | React.KeyboardEvent) => {
        if (!canSeek) {
            return;
        }

        event.stopPropagation();
        onLineSeek?.(entry.line);
    };

    return (
        <motion.div
            role={canSeek ? 'button' : undefined}
            tabIndex={canSeek ? 0 : undefined}
            onClick={canSeek ? handleSeek : undefined}
            onKeyDown={canSeek ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSeek(event);
                }
            } : undefined}
            className={`absolute top-0 min-w-0 will-change-transform ${canSeek ? 'cursor-pointer' : ''}`}
            initial={suppressMotion ? false : {
                opacity: 0,
                y: entry.y + initialOffset,
                scale: entry.tone.scale * 0.98,
            }}
            animate={{
                opacity: entry.tone.opacity,
                y: entry.y,
                scale: entry.tone.scale,
            }}
            exit={suppressMotion ? undefined : {
                opacity: 0,
                y: entry.y + exitOffset,
                scale: entry.tone.scale * 0.98,
                transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
            }}
            transition={MONET_SCROLL_TRANSITION}
            style={{
                left: `${glowBufferPx}px`,
                right: `${glowBufferPx}px`,
                height: entry.layout.visualHeightPx,
                transformOrigin: 'left top',
                zIndex: entry.tone.zIndex,
            }}
        >
            {entry.line.isChorus && !isKaraoke && (
                <motion.div
                    className="absolute inset-0 pointer-events-none -z-10 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: entry.status === 'active' ? 1 : 0,
                        scale: entry.status === 'active' ? 1.02 : 0.96,
                    }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                        background: `radial-gradient(circle at 50% 45%, ${colorWithAlpha(activeColor, 0.14)} 0%, ${colorWithAlpha(activeColor, 0.04)} 55%, transparent 82%)`,
                        filter: 'blur(6px)',
                    }}
                />
            )}
            <div
                className={`min-w-0 ${entry.status === 'active' ? 'overflow-visible lyric-active-line' : 'overflow-hidden'}`}
                data-lyric-outline={entry.status === 'active' ? '1' : undefined}
                style={{
                    marginLeft: `-${glowBufferPx}px`,
                    marginRight: `-${glowBufferPx}px`,
                    paddingLeft: `${glowBufferPx}px`,
                    paddingRight: `${glowBufferPx}px`,
                    marginTop: `-${vGlowBufferPx}px`,
                    marginBottom: `-${vGlowBufferPx}px`,
                    paddingTop: `${entry.layout.textPaddingTopPx + vGlowBufferPx}px`,
                    paddingBottom: `${entry.layout.textPaddingBottomPx + vGlowBufferPx}px`,
                    height: `${entry.layout.textHeightPx + vGlowBufferPx * 2}px`,
                    boxSizing: 'border-box',
                    fontFamily: fontStack,
                    fontSize: lyricFontPx,
                    fontWeight: entry.tone.fontWeight,
                    lineHeight: `${entry.layout.lineHeightPx}px`,
                    letterSpacing: `${letterSpacingPx}px`,
                    WebkitMaskImage: textMask,
                    maskImage: textMask,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                }}
            >
                <MonetTimedTokenSpan
                    entry={entry}
                    currentTime={currentTime}
                    accentColor={colorWithAlpha(sungColor, isKaraoke ? 1 : 0.98)}
                    settleColor={settleColor}
                    fontPx={lyricFontPx}
                    fontStack={fontStack}
                    wordColorMatchers={wordColorMatchers}
                    isChorus={entry.line.isChorus}
                    chorusAccentColor={sungColor}
                    audioPower={audioPower}
                    renderStaticPassed={renderStaticPassed}
                    enableGlow={false}
                    immersiveLyrics={immersiveLyrics}
                    visualEffectConfig={visualEffectConfig}
                />
            </div>
            {showSubtitleTranslation && entry.status === 'active' && entry.line.translation ? (
                <motion.div
                    className="min-w-0 overflow-hidden whitespace-pre-wrap break-words"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    style={{
                        marginLeft: `-${glowBufferPx}px`,
                        marginRight: `-${glowBufferPx}px`,
                        paddingLeft: `${glowBufferPx}px`,
                        paddingRight: `${glowBufferPx}px`,
                        height: entry.layout.translationHeightPx,
                        paddingTop: entry.layout.translationPaddingTopPx,
                        paddingBottom: entry.layout.translationPaddingBottomPx,
                        boxSizing: 'border-box',
                        color: colorWithAlpha(hintColor, isKaraoke ? 0.72 : 0.78),
                        fontFamily: fontStack,
                        fontSize: translationFontPx,
                        fontWeight: 500,
                        lineHeight: `${entry.layout.translationLineHeightPx}px`,
                        letterSpacing: 0,
                        WebkitMaskImage: translationMask,
                        maskImage: translationMask,
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                    }}
                >
                    {entry.line.translation}
                </motion.div>
            ) : null}
        </motion.div>
    );
};

const MonetLyricsRail: React.FC<MonetLyricsRailProps> = ({
    entries,
    lines,
    currentLineIndex,
    currentTime,
    theme,
    lyricFontPx,
    inactiveFontPx,
    translationFontPx,
    fontStack,
    keywordColoringEnabled,
    emptyText,
    showSubtitleTranslation = true,
    presentation = 'monet',
    audioPower,
    audioBands,
    onLyricLineSeek,
    seekDisabled = false,
    immersiveLyrics = false,
    lyricFontPresetId: lyricFontPresetIdProp,
    visualEffectIntensity: visualEffectIntensityProp,
}) => {
    const railRef = useRef<HTMLDivElement | null>(null);
    const layoutCacheRef = useRef<MonetLayoutCache>(new Map());
    const manualScrollResetRef = useRef<number | null>(null);
    const wheelAccumulatorRef = useRef(0);
    const wheelDirectionRef = useRef(0);
    const touchLastYRef = useRef<number | null>(null);
    const touchAccumulatorRef = useRef(0);
    const touchDirectionRef = useRef(0);
    const [manualScrollAnchorIndex, setManualScrollAnchorIndex] = useState<number | null>(null);
    const railSize = useMonetRailSize(railRef);
    const isKaraoke = presentation === 'karaoke';
    const storeLyricFontPresetId = useSettingsUiStore(state => state.lyricFontPresetId);
    const storeVisualEffectIntensity = useSettingsUiStore(state => state.visualEffectIntensity);
    const lyricFontPresetId = lyricFontPresetIdProp ?? storeLyricFontPresetId;
    const visualEffectIntensity = visualEffectIntensityProp ?? storeVisualEffectIntensity;
    const glowBufferPx = Math.round(lyricFontPx * (isKaraoke ? 0.35 : 0.45));
    const vGlowBufferPx = Math.round(lyricFontPx * (isKaraoke ? 0.28 : 0.4));
    const canSeek = Boolean(onLyricLineSeek) && !seekDisabled;

    // 获取当前行的字体预设
    const currentFontPreset = useMemo(() => (
        getLyricFontPresetById(lyricFontPresetId) ?? getDefaultLyricFontPreset()
    ), [lyricFontPresetId]);

    const resolvedFontStack = currentFontPreset.fontFamily || fontStack;
    const letterSpacingPx = getLyricLetterSpacingPx(currentFontPreset, lyricFontPx);

    const visualEffectConfig = useMemo<LyricVisualEffectConfig>(() => ({
        ...getRecommendedEffectConfig(
            immersiveLyrics,
            currentFontPreset.dramatic ?? false,
            visualEffectIntensity,
        ),
        // Soft glow / 3D muddy CJK on particle backdrops; keep a fine stroke for edge contrast.
        enableIntenseGlow: false,
        enable3D: false,
    }), [immersiveLyrics, currentFontPreset, visualEffectIntensity]);

    const visibleEntries = useMemo(
        () => manualScrollAnchorIndex === null
            ? entries
            : buildScrollableRailEntries(lines, manualScrollAnchorIndex, currentLineIndex),
        [currentLineIndex, entries, lines, manualScrollAnchorIndex],
    );
    const isManualScrolling = manualScrollAnchorIndex !== null;

    const positionedEntries = useMemo(
        () => buildPositionedEntries(
            visibleEntries,
            railSize,
            theme,
            lyricFontPx,
            inactiveFontPx,
            translationFontPx,
            resolvedFontStack,
            glowBufferPx,
            showSubtitleTranslation,
            layoutCacheRef.current,
            presentation,
            immersiveLyrics,
        ),
        [visibleEntries, railSize, theme, lyricFontPx, inactiveFontPx, translationFontPx, resolvedFontStack, glowBufferPx, showSubtitleTranslation, presentation, immersiveLyrics],
    );
    const wordColorMatchers = useMemo(
        () => prepareWordColorMatchers(theme.wordColors, keywordColoringEnabled),
        [keywordColoringEnabled, theme.wordColors],
    );
    const getFallbackAnchorIndex = useCallback(() => {
        if (manualScrollAnchorIndex !== null) {
            return manualScrollAnchorIndex;
        }
        if (currentLineIndex >= 0) {
            return currentLineIndex;
        }
        return entries.find(entry => entry.offset === 0)?.index ?? 0;
    }, [currentLineIndex, entries, manualScrollAnchorIndex]);

    const scheduleManualScrollReset = useCallback(() => {
        if (manualScrollResetRef.current !== null) {
            window.clearTimeout(manualScrollResetRef.current);
        }
        manualScrollResetRef.current = window.setTimeout(() => {
            setManualScrollAnchorIndex(null);
            wheelAccumulatorRef.current = 0;
            wheelDirectionRef.current = 0;
            touchAccumulatorRef.current = 0;
            touchDirectionRef.current = 0;
            manualScrollResetRef.current = null;
        }, MONET_SCROLL_IDLE_RESET_MS);
    }, []);

    const moveManualScrollAnchor = useCallback((steps: number) => {
        if (lines.length === 0) {
            return;
        }

        setManualScrollAnchorIndex(current => {
            const baseIndex = current ?? getFallbackAnchorIndex();
            return Math.round(clamp(baseIndex + steps, 0, lines.length - 1));
        });
        scheduleManualScrollReset();
    }, [getFallbackAnchorIndex, lines.length, scheduleManualScrollReset]);

    const handleRailWheel = useCallback((event: WheelEvent) => {
        if (lines.length === 0) {
            return;
        }

        if (event.cancelable) {
            event.preventDefault();
        }
        event.stopPropagation();
        const direction = getScrollDirection(event.deltaY);
        if (direction !== 0 && wheelDirectionRef.current !== 0 && direction !== wheelDirectionRef.current) {
            wheelAccumulatorRef.current = 0;
        }
        wheelDirectionRef.current = direction || wheelDirectionRef.current;
        wheelAccumulatorRef.current += event.deltaY;
        const steps = clampScrollSteps(Math.trunc(wheelAccumulatorRef.current / MONET_SCROLL_STEP_PX));
        if (steps !== 0) {
            wheelAccumulatorRef.current = 0;
            moveManualScrollAnchor(steps);
        } else {
            scheduleManualScrollReset();
        }
    }, [lines.length, moveManualScrollAnchor, scheduleManualScrollReset]);

    const handleRailTouchStart = useCallback((event: TouchEvent) => {
        if (lines.length === 0) {
            return;
        }

        event.stopPropagation();
        touchLastYRef.current = event.touches[0]?.clientY ?? null;
        touchAccumulatorRef.current = 0;
        touchDirectionRef.current = 0;
        setManualScrollAnchorIndex(getFallbackAnchorIndex());
        scheduleManualScrollReset();
    }, [getFallbackAnchorIndex, lines.length, scheduleManualScrollReset]);

    const handleRailTouchMove = useCallback((event: TouchEvent) => {
        if (lines.length === 0 || touchLastYRef.current === null) {
            return;
        }

        event.stopPropagation();
        const nextY = event.touches[0]?.clientY;
        if (typeof nextY !== 'number') {
            return;
        }

        const deltaY = touchLastYRef.current - nextY;
        touchLastYRef.current = nextY;
        const direction = getScrollDirection(deltaY);
        if (direction !== 0 && touchDirectionRef.current !== 0 && direction !== touchDirectionRef.current) {
            touchAccumulatorRef.current = 0;
        }
        touchDirectionRef.current = direction || touchDirectionRef.current;
        touchAccumulatorRef.current += deltaY;
        const steps = clampScrollSteps(Math.trunc(touchAccumulatorRef.current / MONET_TOUCH_STEP_PX));
        if (steps !== 0) {
            touchAccumulatorRef.current = 0;
            moveManualScrollAnchor(steps);
        } else {
            scheduleManualScrollReset();
        }
    }, [lines.length, moveManualScrollAnchor, scheduleManualScrollReset]);

    const handleRailTouchEnd = useCallback(() => {
        touchLastYRef.current = null;
        touchDirectionRef.current = 0;
        touchAccumulatorRef.current = 0;
        scheduleManualScrollReset();
    }, [scheduleManualScrollReset]);

    useEffect(() => {
        const rail = railRef.current;
        if (!rail) {
            return undefined;
        }

        rail.addEventListener('wheel', handleRailWheel, MONET_RAIL_SCROLL_EVENT_OPTIONS);
        rail.addEventListener('touchstart', handleRailTouchStart, MONET_RAIL_SCROLL_EVENT_OPTIONS);
        rail.addEventListener('touchmove', handleRailTouchMove, MONET_RAIL_SCROLL_EVENT_OPTIONS);
        rail.addEventListener('touchend', handleRailTouchEnd, MONET_RAIL_SCROLL_EVENT_OPTIONS);
        rail.addEventListener('touchcancel', handleRailTouchEnd, MONET_RAIL_SCROLL_EVENT_OPTIONS);

        return () => {
            rail.removeEventListener('wheel', handleRailWheel, MONET_RAIL_SCROLL_EVENT_OPTIONS);
            rail.removeEventListener('touchstart', handleRailTouchStart, MONET_RAIL_SCROLL_EVENT_OPTIONS);
            rail.removeEventListener('touchmove', handleRailTouchMove, MONET_RAIL_SCROLL_EVENT_OPTIONS);
            rail.removeEventListener('touchend', handleRailTouchEnd, MONET_RAIL_SCROLL_EVENT_OPTIONS);
            rail.removeEventListener('touchcancel', handleRailTouchEnd, MONET_RAIL_SCROLL_EVENT_OPTIONS);
        };
    }, [handleRailTouchEnd, handleRailTouchMove, handleRailTouchStart, handleRailWheel]);

    const handleLineSeek = useCallback((line: Line) => {
        if (!canSeek) {
            return;
        }

        onLyricLineSeek?.(line.startTime);
        setManualScrollAnchorIndex(null);
    }, [canSeek, onLyricLineSeek]);

    useEffect(() => {
        return () => {
            if (manualScrollResetRef.current !== null) {
                window.clearTimeout(manualScrollResetRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={railRef}
            className="relative h-[clamp(220px,46%,420px)] w-full max-w-full select-none overflow-hidden"
            style={{
                marginLeft: `-${glowBufferPx}px`,
                marginRight: `-${glowBufferPx}px`,
                paddingLeft: `${glowBufferPx}px`,
                paddingRight: `${glowBufferPx}px`,
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitMaskImage: isKaraoke
                    ? 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)'
                    : 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
                maskImage: isKaraoke
                    ? 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)'
                    : 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
            }}
        >
            {positionedEntries.length > 0 ? (
                <AnimatePresence initial={false}>
                    {positionedEntries.map(entry => (
                        <MonetRailLine
                            key={entry.key}
                            entry={entry}
                            currentTime={currentTime}
                            theme={theme}
                            lyricFontPx={lyricFontPx}
                            translationFontPx={translationFontPx}
                            fontStack={resolvedFontStack}
                            glowBufferPx={glowBufferPx}
                            vGlowBufferPx={vGlowBufferPx}
                            wordColorMatchers={wordColorMatchers}
                            showSubtitleTranslation={showSubtitleTranslation}
                            presentation={presentation}
                            audioPower={audioPower}
                            onLineSeek={handleLineSeek}
                            canSeek={canSeek}
                            disableEntryMotion={isManualScrolling || isKaraoke}
                            renderStaticPassed={isManualScrolling && entry.index !== currentLineIndex}
                            immersiveLyrics={immersiveLyrics}
                            visualEffectConfig={visualEffectConfig}
                            letterSpacingPx={letterSpacingPx}
                        />
                    ))}
                </AnimatePresence>
            ) : emptyText ? (
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 font-semibold"
                    style={{
                        color: resolveLyricStageInkColors(theme).hintColor,
                        fontSize: `${Math.max(lyricFontPx * 0.85, 18)}px`,
                        letterSpacing: 0,
                        opacity: 0.72,
                    }}
                >
                    {emptyText}
                </div>
            ) : null}
        </div>
    );
};

export default MonetLyricsRail;
