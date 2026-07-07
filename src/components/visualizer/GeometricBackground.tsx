import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { areGeometricBackgroundPropsEqual } from './geometric/areGeometricBackgroundPropsEqual';
import GeometricLayer from './geometric/GeometricLayer';
import type { GeometricBackgroundProps } from './geometric/types';

// src/components/visualizer/GeometricBackground.tsx
// Entry wrapper for the modular geometric background implementation.

const GeometricBackground: React.FC<GeometricBackgroundProps> = React.memo((props) => {
    const layerKey = String(props.seed ?? 'default');

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Do NOT use initial={false} on AnimatePresence here.
                initial={false} propagates via context to ALL nested motion components,
                causing keyframe animations with repeat:Infinity to never be dispatched
                on mount. Removing it allows the container to fade in (0.6s) and all
                child keyframe animations to start normally on every mount. */}
            <AnimatePresence mode="sync">
                <GeometricLayer key={layerKey} {...props} />
            </AnimatePresence>
        </div>
    );
}, areGeometricBackgroundPropsEqual);

export default GeometricBackground;
export type { GeometricBackgroundProps } from './geometric/types';
