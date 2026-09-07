import type { Variants } from 'framer-motion';
import type { Theme } from '../../../types';
import { LYRIC_MOTION_BLUR_PX, lyricBlurFilter } from '../../../utils/lyrics/lyricMotionClarity';
import { LYRIC_LINE_OPACITY } from '../../../utils/theme/lyricColorPresets';
import type { ClassicWordLayoutConfig } from './classicTypes';

// src/components/visualizer/classic/classicMotionVariants.ts
// Classic word motion: Folia glow + CSS 3D float. Waiting stays unblurred for GPU cost.

type ClassicLayoutVariantCustom = {
    config: ClassicWordLayoutConfig;
};

type ClassicGlowVariantCustom = {
    activeColor: string;
    duration?: number;
    index?: number;
    total?: number;
    charStartTime?: number;
    charEndTime?: number;
    wordStartTime?: number;
    wordRevealMode?: 'normal' | 'fast' | 'instant';
};

export const buildClassicLayoutVariants = (
    enableWordRotation: boolean,
    waitingKaraokeOpacity = 0.42,
): Variants => ({
    'waiting-default': ({ config }: ClassicLayoutVariantCustom) => ({
        opacity: 0,
        scale: 0.5,
        x: config.x + (Math.sin(config.y) * 100),
        y: config.y + (Math.cos(config.x) * 50),
        rotate: enableWordRotation ? config.rotate + 20 : 0,
        rotateX: config.rotateX + 16,
        z: config.z - 72,
        transition: { duration: 0.4 },
    }),
    'waiting-karaoke': ({ config }: ClassicLayoutVariantCustom) => ({
        opacity: waitingKaraokeOpacity,
        scale: config.scale || 1,
        x: config.x,
        y: config.y,
        rotate: config.rotate,
        rotateX: 0,
        z: 0,
        transition: { duration: 0.25 },
    }),
    active: ({ config }: ClassicLayoutVariantCustom) => ({
        opacity: 1,
        scale: Number.isNaN(config.scale) ? 1.5 : config.scale * 1.4,
        x: config.x,
        y: config.y,
        rotate: config.rotate,
        rotateX: config.rotateX,
        z: config.z,
        transition: {
            type: 'spring' as const,
            stiffness: 200,
            damping: 20,
            opacity: { duration: 0.1 },
        },
    }),
    passed: ({ config }: ClassicLayoutVariantCustom) => ({
        opacity: LYRIC_LINE_OPACITY.passedNear,
        scale: config.scale || 1,
        x: config.x,
        y: config.y,
        rotate: config.rotate + config.passedRotate,
        rotateX: config.rotateX * 0.35,
        z: config.z * 0.4,
        transition: {
            duration: 0.5,
            rotate: {
                duration: 5,
                ease: 'linear',
            },
        },
    }),
});

export const buildClassicBodyVariants = (): Variants => ({
    'waiting-default': ({ baseColor }: { baseColor: string }) => ({
        color: baseColor,
        filter: lyricBlurFilter(LYRIC_MOTION_BLUR_PX.waiting),
        transition: { duration: 0.28 },
    }),
    'waiting-karaoke': ({ baseColor }: { baseColor: string }) => ({
        color: baseColor,
        filter: 'none',
        transition: { duration: 0.25 },
    }),
    active: ({
        activeColor,
        duration,
        wordRevealMode,
    }: { activeColor: string; duration?: number; wordRevealMode?: string }) => ({
        color: activeColor,
        filter: 'none',
        transition: {
            color: { duration: duration || 0.2, ease: 'linear' },
            filter: {
                type: 'tween',
                duration: wordRevealMode === 'instant' ? 0.08 : wordRevealMode === 'fast' ? 0.12 : 0.2,
            },
        },
        transitionEnd: { filter: 'none' },
    }),
    passed: ({
        baseColor,
        wordRevealMode,
    }: { baseColor: string; wordRevealMode?: string }) => ({
        color: baseColor,
        filter: 'none',
        transition: {
            color: {
                duration: wordRevealMode === 'instant' ? 0.12 : wordRevealMode === 'fast' ? 0.24 : 0.8,
                ease: 'easeInOut',
            },
            filter: { duration: wordRevealMode === 'instant' ? 0.08 : wordRevealMode === 'fast' ? 0.12 : 0.2 },
        },
        transitionEnd: { filter: 'none' },
    }),
});

const glowPulse = (activeColor: string, inner: number, outer: number) => (
    `0 0 ${inner}px ${activeColor}, 0 0 ${outer}px ${activeColor}`
);

/** Folia-style isolated text-shadow glow. Waiting/passed stay inert so particles stay readable. */
export const classicGlowVariants: Variants = {
    'waiting-default': {
        color: 'transparent',
        textShadow: 'none',
    },
    'waiting-karaoke': {
        color: 'transparent',
        textShadow: 'none',
    },
    active: ({
        activeColor,
        duration,
        index,
        total,
        charStartTime,
        charEndTime,
        wordStartTime,
        wordRevealMode,
    }: ClassicGlowVariantCustom) => {
        if (wordRevealMode === 'instant') {
            return {
                color: 'transparent',
                textShadow: ['none', glowPulse(activeColor, 14, 24), 'none'],
                transition: {
                    duration: Math.min(duration || 0.08, 0.12),
                    times: [0, 0.35, 1],
                    ease: 'easeOut',
                },
            };
        }

        if (wordRevealMode === 'fast') {
            return {
                color: 'transparent',
                textShadow: ['none', glowPulse(activeColor, 18, 32), 'none'],
                transition: {
                    duration: Math.min(Math.max(duration || 0.12, 0.12), 0.2),
                    times: [0, 0.4, 1],
                    ease: 'easeInOut',
                },
            };
        }

        if (total !== undefined && total > 1) {
            const singleDuration = (duration || 0.1) / total;
            const hasCharTiming = typeof charStartTime === 'number'
                && typeof charEndTime === 'number'
                && typeof wordStartTime === 'number';
            const charDuration = hasCharTiming
                ? Math.max((charEndTime as number) - (charStartTime as number), 0.001)
                : singleDuration;
            const charDelay = hasCharTiming
                ? Math.max(0, (charStartTime as number) - (wordStartTime as number))
                : singleDuration * (index ?? 0);
            return {
                color: 'transparent',
                textShadow: ['none', glowPulse(activeColor, 20, 40), 'none'],
                transition: {
                    duration: charDuration * 6,
                    times: [0, 0.3, 1],
                    delay: charDelay,
                    ease: 'easeInOut',
                },
            };
        }

        return {
            color: 'transparent',
            textShadow: [
                'none',
                glowPulse(activeColor, 20, 40),
                glowPulse(activeColor, 20, 40),
            ],
            transition: {
                duration: duration || 0.1,
                times: [0, 0.9, 1],
                ease: 'easeInOut',
            },
        };
    },
    passed: ({ wordRevealMode }: ClassicGlowVariantCustom) => ({
        color: 'transparent',
        textShadow: 'none',
        transition: {
            duration: wordRevealMode === 'instant' ? 0.12 : wordRevealMode === 'fast' ? 0.22 : 0.9,
            ease: 'easeOut',
        },
    }),
};

export const resolveClassicBreathingFloat = (
    multiplier: number,
    intensity: Theme['animationIntensity'],
) => {
    if (multiplier <= 0) return null;

    const configByIntensity = {
        calm: { distance: 10, duration: 8.5 },
        normal: { distance: 14, duration: 7 },
        chaotic: { distance: 18, duration: 5.8 },
    } as const;
    const { distance, duration } = configByIntensity[intensity];
    const scaledDistance = distance * multiplier;

    return {
        animate: {
            y: [0, -scaledDistance, 0, scaledDistance * 0.45, 0],
            rotateX: [0, 2.4 * multiplier, 0, -1.4 * multiplier, 0],
        },
        transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
        },
    };
};
