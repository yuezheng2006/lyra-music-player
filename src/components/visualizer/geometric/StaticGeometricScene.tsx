import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getShapeBaseStyle } from './shapeHelpers';
import type { GeometricSceneProps } from './types';
import VignetteOverlay from './VignetteOverlay';

// src/components/visualizer/geometric/StaticGeometricScene.tsx
// Paused/static rendering path for geometric background shapes.

const StaticGeometricScene: React.FC<GeometricSceneProps> = ({
    theme,
    shapes,
    particles,
    hideShapes,
    disableVignette,
}) => (
    <div className="absolute inset-0">
        {!hideShapes && (
            <>
                {shapes.map((shape) => {
                    if (shape.type === 'icon' && shape.iconName) {
                        const IconComponent = LucideIcons[shape.iconName as keyof typeof LucideIcons] as LucideIcons.LucideIcon | undefined;

                        if (IconComponent) {
                            return (
                                <div
                                    key={shape.id}
                                    className="absolute flex items-center justify-center"
                                    style={{
                                        left: `${shape.initialX}%`,
                                        top: `${shape.initialY}%`,
                                        width: shape.size,
                                        height: shape.size,
                                        color: theme.secondaryColor,
                                        opacity: shape.opacity,
                                        transform: `rotate(${shape.initialRotation}deg)`,
                                    }}
                                >
                                    <IconComponent size={shape.size} strokeWidth={1} absoluteStrokeWidth />
                                </div>
                            );
                        }
                    }

                    return (
                        <div
                            key={shape.id}
                            className="absolute"
                            style={{
                                ...getShapeBaseStyle(shape, theme),
                                transform: `rotate(${shape.initialRotation}deg)`,
                            }}
                        />
                    );
                })}

                {particles.map((particle) => (
                    <div
                        key={`p-${particle.id}`}
                        className="absolute rounded-full"
                        style={{
                            backgroundColor: theme.accentColor,
                            width: particle.size,
                            height: particle.size,
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            opacity: particle.opacity,
                        }}
                    />
                ))}
            </>
        )}

        <VignetteOverlay disabled={disableVignette} />
    </div>
);

export default StaticGeometricScene;
