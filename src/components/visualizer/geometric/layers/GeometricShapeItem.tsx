import React from 'react';
import { motion, type MotionValue } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import type { Theme } from '../../../../types';
import { getShapeBaseStyle, getShapeScaleKey } from '../shapeHelpers';
import type { BackgroundShape, ScaleKey } from '../types';

// src/components/visualizer/geometric/layers/GeometricShapeItem.tsx
// Single audio-reactive geometric shape used by the DOM shape layer.

interface GeometricShapeItemProps {
    shape: BackgroundShape;
    theme: Theme;
    scales: Record<ScaleKey, MotionValue<number>>;
}

const GeometricShapeItem: React.FC<GeometricShapeItemProps> = ({ shape, theme, scales }) => {
    const depthScale = 0.72 + shape.depth * 0.36;

    if (shape.type === 'icon' && shape.iconName) {
        const IconComponent = LucideIcons[shape.iconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon | undefined;
        if (!IconComponent) return null;

        return (
            <motion.div
                className="absolute flex items-center justify-center"
                style={{
                    left: `${shape.initialX}%`,
                    top: `${shape.initialY}%`,
                    width: shape.size * depthScale,
                    height: shape.size * depthScale,
                    color: theme.secondaryColor,
                    scale: scales.vocal,
                }}
                animate={{
                    y: shape.reverse ? [-30, 30, -30] : [30, -30, 30],
                    x: shape.reverse ? [15, -15, 15] : [-15, 15, -15],
                    rotate: [shape.initialRotation, shape.initialRotation + 360],
                    opacity: [0, shape.opacity * 3, 0],
                }}
                transition={{
                    duration: shape.duration,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: shape.delay,
                    opacity: {
                        duration: shape.duration * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: shape.delay,
                    },
                }}
            >
                <IconComponent size={shape.size * depthScale} strokeWidth={1} absoluteStrokeWidth />
            </motion.div>
        );
    }

    return (
        <motion.div
            className="absolute"
            style={{
                ...getShapeBaseStyle(shape, theme),
                scale: scales[getShapeScaleKey(shape)],
                width: shape.size * depthScale,
                height: shape.size * depthScale,
            }}
            animate={{
                y: shape.reverse ? [-30, 30, -30] : [30, -30, 30],
                x: shape.reverse ? [15, -15, 15] : [-15, 15, -15],
                rotate: [shape.initialRotation, shape.initialRotation + 360],
            }}
            transition={{
                duration: shape.duration,
                repeat: Infinity,
                ease: 'linear',
                delay: shape.delay,
            }}
        />
    );
};

export default GeometricShapeItem;
