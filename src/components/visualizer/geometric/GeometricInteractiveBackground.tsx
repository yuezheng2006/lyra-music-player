import React from 'react';
import GeometricBackground from '../GeometricBackground';
import type { GeometricBackgroundProps } from './types';

// src/components/visualizer/geometric/GeometricInteractiveBackground.tsx
// 3D interactive background stage used by VisualizerShell.

type GeometricInteractiveBackgroundProps = GeometricBackgroundProps;

const GeometricInteractiveBackground: React.FC<GeometricInteractiveBackgroundProps> = (props) => (
    <div
        className="absolute inset-0 overflow-hidden"
        style={{
            perspective: '1400px',
            perspectiveOrigin: '50% 44%',
        }}
    >
        <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
        >
            <GeometricBackground {...props} hideShapes={false} />
        </div>
    </div>
);

export default GeometricInteractiveBackground;
