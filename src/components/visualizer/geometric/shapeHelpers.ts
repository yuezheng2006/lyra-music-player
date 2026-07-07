import type { Theme } from '../../../types';
import type { BackgroundShape, ScaleKey, ShapeType } from './types';

// src/components/visualizer/geometric/shapeHelpers.ts
// Pure helpers for geometric shape layout and styling.

export const getShapeScaleKey = (shape: BackgroundShape): ScaleKey => {
    switch (shape.type) {
        case 'circle':
            return 'bass';
        case 'square':
            return 'lowMid';
        case 'triangle':
            return 'mid';
        case 'cross':
            return 'treble';
        case 'icon':
            return 'vocal';
        default:
            return 'default';
    }
};

export const getShapeClipPath = (shapeType: ShapeType) => {
    if (shapeType === 'triangle') {
        return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    }

    if (shapeType === 'cross') {
        return 'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)';
    }

    return 'none';
};

export const getShapeBaseStyle = (shape: BackgroundShape, theme: Theme) => {
    const isCircleOrSquare = shape.type === 'circle' || shape.type === 'square';
    const useStroke = isCircleOrSquare && !shape.filled;

    return {
        left: `${shape.initialX}%`,
        top: `${shape.initialY}%`,
        width: shape.size,
        height: shape.size,
        border: useStroke ? `1px solid ${theme.secondaryColor}` : 'none',
        backgroundColor: !useStroke ? theme.secondaryColor : 'transparent',
        borderRadius: shape.type === 'circle' ? '50%' : '0%',
        opacity: shape.opacity,
        clipPath: getShapeClipPath(shape.type),
    };
};
