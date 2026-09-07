import type { Line, Theme, Word as WordType } from '../../../types';
import type { GraphemeTiming } from '../../../utils/lyrics/graphemeTiming';
import type { LineTransitionTiming } from '../../../utils/lyrics/renderHints';
import type { LayoutLine, PreparedTextWithSegments } from '@chenglou/pretext';

// src/components/visualizer/cadenza/cadenzaTypes.ts
// Cadenza layout / overlay / timing contracts.

export type { LayoutLine };

export interface SegmentMeta {
    graphemeStart: number;
    graphemeEnd: number;
    graphemeCount: number;
}

export interface WordRange {
    wordIndex: number;
    word: WordType;
    start: number;
    end: number;
    color: string;
    graphemeTimings: GraphemeTiming[];
}

export interface WordFragment {
    wordIndex: number;
    lineIndex: number;
    word: WordType;
    text: string;
    color: string;
    startX: number;
    endX: number;
    fragmentStartInWord: number;
    fragmentEndInWord: number;
    wordGraphemeCount: number;
    wordGraphemeTimings: GraphemeTiming[];
    fragmentIndexInWord: number;
    fragmentCountInWord: number;
    isPrimaryFragment: boolean;
    isSplitAcrossLines: boolean;
}

export interface WordPlacement {
    id: string;
    wordIndex: number;
    word: WordType;
    text: string;
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotate: number;
    rotateX: number;
    z: number;
    scale: number;
    passedRotate: number;
    passedDriftX: number;
    passedDriftY: number;
    entryOffsetX: number;
    entryOffsetY: number;
    fragmentStartInWord: number;
    fragmentEndInWord: number;
    wordGraphemeCount: number;
    wordGraphemeTimings: GraphemeTiming[];
    emphasis: number;
    isInterlude: boolean;
}

export interface AnimatedPlacementState {
    x: number;
    y: number;
    rotation: number;
    rotateX: number;
    z: number;
    scale: number;
    bodyAlpha: number;
    blur: number;
    activeMix: number;
    glowAlpha: number;
}

export interface OverlayWordNodes {
    outer: HTMLDivElement;
    inner: HTMLDivElement;
    body: HTMLSpanElement;
    glow: HTMLSpanElement;
    glyphSpans: HTMLSpanElement[];
    glyphSignature: string;
}

export interface PreparedState {
    prepared: PreparedTextWithSegments;
    text: string;
    font: string;
    fontPx: number;
    lineHeight: number;
    maxWidth: number;
    layout: { lines: LayoutLine[] };
    segmentMetas: SegmentMeta[];
    graphemes: string[];
    placements: WordPlacement[];
}

export interface PreparedStateCacheContext {
    showText: boolean;
    viewport: { width: number; height: number };
    theme: Theme;
    tuning: { fontScale: number; widthRatio: number };
}

export interface ResolvedLineRenderTiming {
    renderHints: NonNullable<Line['renderHints']> | null;
    lineRenderEndTime: number;
    wordRevealMode: 'normal' | 'fast' | 'instant';
    lastWordEndTime: number;
    linePassHold: number;
    transitionTiming: LineTransitionTiming;
}

export type CadenzaWordStatus = 'waiting' | 'active' | 'passed';
export type CadenzaLineView = {
    line: LayoutLine;
    lineStart: number;
    lineEnd: number;
    fragments: WordFragment[];
};
