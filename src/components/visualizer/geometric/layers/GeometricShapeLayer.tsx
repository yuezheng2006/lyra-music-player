import React from 'react';
import type { MotionValue } from 'framer-motion';
import type { Theme } from '../../../../types';
import type { BackgroundShape, ScaleKey } from '../types';
import GeometricShapeItem from './GeometricShapeItem';

// src/components/visualizer/geometric/layers/GeometricShapeLayer.tsx
// DOM geometric shapes with beat-reactive scale.

interface GeometricShapeLayerProps {
    theme: Theme;
    shapes: BackgroundShape[];
    scales: Record<ScaleKey, MotionValue<number>>;
    sceneX?: MotionValue<number>;
    sceneY?: MotionValue<number>;
    sceneRotate?: MotionValue<number>;
    sceneScale?: MotionValue<number>;
}

const GeometricShapeLayer: React.FC<GeometricShapeLayerProps> = ({
    theme,
    shapes,
    scales,
}) => {
    if (shapes.length === 0) return null;

    return (
        <>
            {shapes.map((shape) => (
                <GeometricShapeItem
                    key={shape.id}
                    shape={shape}
                    theme={theme}
                    scales={scales}
                />
            ))}
        </>
    );
};

export default GeometricShapeLayer;
