import type { Line } from '../../../types';

// src/components/visualizer/classic/classicTypes.ts
// Shared classic lyric layout / render-profile contracts.

export interface ClassicWordLayoutConfig {
    id: string;
    x: number;
    y: number;
    rotate: number;
    /** CSS 3D tilt — perspective on the line container turns this into float depth. */
    rotateX: number;
    z: number;
    scale: number;
    marginRight: string;
    alignSelf: string;
    passedRotate: number;
}

export interface ClassicLineLayoutConfig {
    justifyContent: string;
    alignItems: string;
    perspective: number;
}

export interface ClassicLineRenderProfile {
    renderHints: NonNullable<Line['renderHints']> | null;
    lineRenderEndTime: number;
    lineTransitionMode: 'normal' | 'fast' | 'none';
    wordRevealMode: 'normal' | 'fast' | 'instant';
    wordLookahead: number;
}

export const FALLBACK_CLASSIC_WORD_LAYOUT: ClassicWordLayoutConfig = {
    id: 'fallback',
    x: 0,
    y: 0,
    rotate: 0,
    rotateX: 0,
    z: 0,
    scale: 1,
    marginRight: '0.5rem',
    alignSelf: 'auto',
    passedRotate: 0,
};
