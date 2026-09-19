import { describe, expect, it } from 'vitest';
import { chooseCadenzaFontPx } from '../../../src/components/visualizer/cadenza/cadenzaLayoutMath';
import { resolveCadenzaPlacementPose } from '../../../src/components/visualizer/cadenza/cadenzaPlacementPose';
import type { WordPlacement } from '../../../src/components/visualizer/cadenza/cadenzaTypes';
import type { Line, Word } from '../../../src/types';

// test/unit/visualizer/cadenzaLayoutMath.test.ts
// Folia-parity cadenza hero size and CSS 3D waiting pose.

const word = (text: string, start: number, end: number): Word => ({
    text,
    startTime: start,
    endTime: end,
});

const line = (fullText: string, words: Word[]): Line => ({
    fullText,
    startTime: 8,
    endTime: 12,
    words,
});

const placement = (overrides: Partial<WordPlacement> = {}): WordPlacement => ({
    id: 'w0',
    wordIndex: 0,
    word: word('心象', 8, 10),
    text: '心象',
    color: '#fff',
    x: 12,
    y: -20,
    width: 80,
    height: 40,
    rotate: 4,
    rotateX: 10,
    z: 24,
    scale: 1.1,
    passedRotate: 8,
    passedDriftX: 6,
    passedDriftY: -3,
    entryOffsetX: -30,
    entryOffsetY: 18,
    fragmentStartInWord: 0,
    fragmentEndInWord: 2,
    wordGraphemeCount: 2,
    wordGraphemeTimings: [],
    emphasis: 1,
    isInterlude: false,
    ...overrides,
});

describe('chooseCadenzaFontPx', () => {
    it('uses Folia hero sizing, larger than the previous Lyra safety cap', () => {
        const short = chooseCadenzaFontPx(1200, line('心象', [word('心象', 8, 10)]));
        expect(short).toBeGreaterThan(64);
        expect(short).toBeLessThanOrEqual(104);
    });

    it('shrinks long dense lines without collapsing to the old 22px floor', () => {
        const words = Array.from({ length: 12 }, (_, index) => word(`词${index}`, 8 + index * 0.2, 8.2 + index * 0.2));
        const long = chooseCadenzaFontPx(900, line(words.map(item => item.text).join(''), words));
        expect(long).toBeGreaterThanOrEqual(28);
        expect(long).toBeLessThan(chooseCadenzaFontPx(900, line('短', [word('短', 8, 10)])));
    });
});

describe('resolveCadenzaPlacementPose', () => {
    const base = {
        placement: placement(),
        isInstantWordReveal: false,
        waitingOpacity: 0,
        waitingBlurPx: 0,
        passedAlpha: 0.82,
        pulse: 1,
        passedDriftProgress: 0,
        width: 1000,
        focusY: 400,
        localFloatX: 0,
        localFloatY: 0,
    };

    it('flies waiting words in on z / rotateX unless karaoke parks them', () => {
        const waiting = resolveCadenzaPlacementPose({
            ...base,
            status: 'waiting',
            parkAtRest: false,
        });
        const active = resolveCadenzaPlacementPose({
            ...base,
            status: 'active',
            parkAtRest: false,
        });
        expect(waiting.rotateX).toBeGreaterThan(active.rotateX);
        expect(waiting.z).toBeLessThan(active.z);
        expect(waiting.x).not.toBe(active.x);

        const karaoke = resolveCadenzaPlacementPose({
            ...base,
            status: 'waiting',
            parkAtRest: true,
            waitingOpacity: 0.42,
        });
        expect(karaoke.rotateX).toBe(10);
        expect(karaoke.z).toBe(24);
        expect(karaoke.x).toBe(active.x);
        expect(karaoke.bodyAlpha).toBe(0.42);
    });
});
