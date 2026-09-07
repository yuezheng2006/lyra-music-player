import type { ClassicTuning, Line, Theme, Word as WordType } from '../../../types';
import {
    clampLyricWordOffsetX,
    clampLyricWordOffsetY,
    resolveLyricLineFitScale,
} from '../resolveLyricContainerFit';
import type { ClassicLineLayoutConfig, ClassicWordLayoutConfig } from './classicTypes';

// src/components/visualizer/classic/classicLayoutMath.ts
// Folia-parity classic scatter / perspective layout. Karaoke stays parked and linear.

const FOLIA_CHAOTIC_SPREAD = 60;
const FOLIA_NORMAL_SPREAD = 20;
const FOLIA_CHAOTIC_ROTATE = 30;
const FOLIA_NORMAL_ROTATE = 5;
const FOLIA_DEPTH_CHAOTIC = 70;
const FOLIA_DEPTH_NORMAL = 36;
const FOLIA_TILT_CHAOTIC = 28;
const FOLIA_TILT_NORMAL = 12;

const CALM_JUSTIFY = ['justify-center'] as const;
const SCATTER_JUSTIFY = [
    'justify-start',
    'justify-center',
    'justify-end',
    'justify-around',
    'justify-between',
] as const;

export type BuildClassicWordLayoutInput = {
    activeLine: Line | null;
    displayWords: WordType[];
    tuning: ClassicTuning;
    intensity: Theme['animationIntensity'];
    parkAtRest: boolean;
    fontPx: number;
    fontStack: string;
    fontWeight: number;
    usableWidth: number;
    usableHeight: number;
};

export type ClassicWordLayoutResult = {
    wordConfigs: ClassicWordLayoutConfig[];
    lineConfig: ClassicLineLayoutConfig;
    lineFitScale: number;
};

const EMPTY_LAYOUT: ClassicWordLayoutResult = {
    wordConfigs: [],
    lineConfig: { justifyContent: 'center', alignItems: 'center', perspective: 1000 },
    lineFitScale: 1,
};

let classicMeasureCanvas: HTMLCanvasElement | null = null;

/** Measures a word with the same canvas font spec used at paint time. */
export const measureClassicWordWidth = (
    text: string,
    pxSize: number,
    fontStack: string,
    fontWeight = 700,
): number => {
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
    context.font = `${fontWeight} ${pxSize}px ${fontStack}`;
    return context.measureText(text).width;
};

const seededUnit = (wordSeed: number, offset: number) => {
    const x = Math.sin(wordSeed + offset) * 10000;
    return x - Math.floor(x);
};

const parseMarginPx = (margin: string, pxFontSize: number) => {
    if (margin.endsWith('px')) return Number.parseFloat(margin) || 0;
    if (margin.endsWith('rem')) return (Number.parseFloat(margin) || 0) * pxFontSize;
    return 0;
};

/** Deterministic Folia-like line geometry; karaoke / calm collapse to a readable row. */
export const buildClassicWordLayout = (input: BuildClassicWordLayoutInput): ClassicWordLayoutResult => {
    const { activeLine, displayWords, tuning } = input;
    if (!activeLine) return EMPTY_LAYOUT;

    const seed = activeLine.startTime;
    const karaokeLineRest = input.parkAtRest;
    const isChaotic = !karaokeLineRest && input.intensity === 'chaotic';
    const isCalm = karaokeLineRest || input.intensity === 'calm';
    const justifyOptions = isCalm ? CALM_JUSTIFY : SCATTER_JUSTIFY;
    const isInterlude = activeLine.fullText === '......';

    const lineConfig: ClassicLineLayoutConfig = {
        justifyContent: isInterlude ? 'justify-center' : justifyOptions[Math.floor(seed % justifyOptions.length)],
        // Vertical align stays centered so LyricRhythmStage scale cannot pack glyphs into chrome.
        alignItems: 'items-center',
        perspective: isChaotic ? 500 + (seed % 500) : 1000,
    };

    const pxFontSize = input.fontPx;
    const wordWidths = displayWords.map(word => (
        measureClassicWordWidth(word.text, pxFontSize, input.fontStack, input.fontWeight)
    ));
    const baseSpread = isChaotic ? FOLIA_CHAOTIC_SPREAD : isCalm ? 0 : FOLIA_NORMAL_SPREAD;
    const baseRotate = isChaotic ? FOLIA_CHAOTIC_ROTATE : isCalm ? 0 : FOLIA_NORMAL_ROTATE;
    const depthAmp = isChaotic ? FOLIA_DEPTH_CHAOTIC : isCalm ? 0 : FOLIA_DEPTH_NORMAL;
    const tiltAmp = isChaotic ? FOLIA_TILT_CHAOTIC : isCalm ? 0 : FOLIA_TILT_NORMAL;

    const wordConfigs: ClassicWordLayoutConfig[] = displayWords.map((word, i) => {
        const wordSeed = seed + i;
        const random = (offset: number) => seededUnit(wordSeed, offset);

        if (isInterlude) {
            return {
                id: `${word.text}-${i}-${seed}`,
                x: 0,
                y: (random(2) - 0.5) * 15,
                rotate: 0,
                rotateX: 0,
                z: 0,
                scale: 1.5,
                marginRight: '3rem',
                alignSelf: 'center',
                passedRotate: 0,
            };
        }

        const wordConfigScale = isChaotic ? 0.8 + random(4) * 0.6 : 1.1 + random(4) * 0.2;
        const activeScale = wordConfigScale * 1.35;
        const xVal = clampLyricWordOffsetX(
            (random(1) - 0.5) * baseSpread * 2,
            wordWidths[i] ?? pxFontSize,
            input.usableWidth,
            activeScale,
        );
        const yVal = clampLyricWordOffsetY(
            (random(2) - 0.5) * baseSpread * 2,
            pxFontSize,
            input.usableHeight,
            activeScale,
        );

        let marginRight = isChaotic ? `${random(5) * 1.5}rem` : '0.8rem';

        if (!tuning.useLegacyLayout) {
            const w_i = wordWidths[i] ?? 0;
            const s_i = wordConfigScale * 1.4;
            let w_next = 0;
            let s_next = 1.0;
            let x_next = 0;

            if (i + 1 < displayWords.length) {
                const nextSeed = seed + (i + 1);
                const nextRandom = (offset: number) => seededUnit(nextSeed, offset);
                const nextConfigScale = isChaotic ? 0.8 + nextRandom(4) * 0.6 : 1.1 + nextRandom(4) * 0.2;
                s_next = nextConfigScale * 1.4;
                x_next = clampLyricWordOffsetX(
                    (nextRandom(1) - 0.5) * baseSpread * 2,
                    wordWidths[i + 1] ?? pxFontSize,
                    input.usableWidth,
                    nextConfigScale * 1.35,
                );
                w_next = wordWidths[i + 1] ?? 0;
            }

            const spacingMultiplier = tuning.wordSpacing ?? 0.7;
            const gap = 0.05 * pxFontSize;
            const halfOverflow_i = w_i * (s_i - 1) / 2;
            const halfOverflow_next = w_next * (s_next - 1) / 2;
            const calculatedMargin = (halfOverflow_i + halfOverflow_next + (xVal - x_next) + gap) * spacingMultiplier;
            const minMargin = (isChaotic ? 0.08 * pxFontSize : 0.12 * pxFontSize) * spacingMultiplier;
            marginRight = `${Math.max(minMargin, calculatedMargin).toFixed(1)}px`;
        }

        return {
            id: `${word.text}-${i}-${seed}`,
            x: xVal,
            y: yVal,
            rotate: tuning.enableWordRotation ? (random(3) - 0.5) * baseRotate * 2 : 0,
            rotateX: tuning.enableWordRotation ? (random(9) - 0.5) * tiltAmp : 0,
            z: (random(10) - 0.5) * depthAmp,
            scale: wordConfigScale,
            marginRight,
            alignSelf: isChaotic && random(6) > 0.7 ? (random(7) > 0.5 ? 'flex-start' : 'flex-end') : 'auto',
            passedRotate: tuning.enableWordRotation ? (random(8) - 0.5) * 45 : 0,
        };
    });

    const contentWidth = wordConfigs.reduce((sum, config, index) => {
        const width = wordWidths[index] ?? pxFontSize;
        const activeScale = Math.max(1, (config.scale || 1) * 1.15);
        return sum + width * activeScale + parseMarginPx(config.marginRight, pxFontSize);
    }, 0);

    return {
        wordConfigs,
        lineConfig,
        lineFitScale: resolveLyricLineFitScale(contentWidth, input.usableWidth),
    };
};
