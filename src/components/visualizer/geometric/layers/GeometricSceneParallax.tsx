import React from 'react';
import { motion, type MotionValue } from 'framer-motion';

// src/components/visualizer/geometric/layers/GeometricSceneParallax.tsx
// Applies atmosphere camera parallax to child geometric shapes.

interface GeometricSceneParallaxProps {
    sceneX: MotionValue<number>;
    sceneY: MotionValue<number>;
    sceneRotate: MotionValue<number>;
    sceneScale: MotionValue<number>;
    children: React.ReactNode;
}

const GeometricSceneParallax: React.FC<GeometricSceneParallaxProps> = ({
    sceneX,
    sceneY,
    sceneRotate,
    sceneScale,
    children,
}) => (
    <motion.div
        className="absolute inset-0"
        style={{
            x: sceneX,
            y: sceneY,
            rotate: sceneRotate,
            scale: sceneScale,
        }}
    >
        {children}
    </motion.div>
);

export default GeometricSceneParallax;
