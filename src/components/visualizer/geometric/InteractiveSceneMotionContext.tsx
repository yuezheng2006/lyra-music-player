import React, { createContext, useContext } from 'react';
import type { MotionValue } from 'framer-motion';
import type { InteractiveSceneTransforms } from './useInteractiveSceneTransforms';

// src/components/visualizer/geometric/InteractiveSceneMotionContext.tsx
// Shares one pointer + camera rig between the 3D background and lyric stage.

export type InteractiveSceneMotionValue = {
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    transforms: InteractiveSceneTransforms;
};

const InteractiveSceneMotionContext = createContext<InteractiveSceneMotionValue | null>(null);

export const InteractiveSceneMotionProvider: React.FC<{
    value: InteractiveSceneMotionValue;
    children: React.ReactNode;
}> = ({ value, children }) => (
    <InteractiveSceneMotionContext.Provider value={value}>
        {children}
    </InteractiveSceneMotionContext.Provider>
);

export const useInteractiveSceneMotion = () => useContext(InteractiveSceneMotionContext);
