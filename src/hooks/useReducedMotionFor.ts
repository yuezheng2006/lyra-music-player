import {
    resolveReducedMotion,
    useMotionSettingsStore,
    type MotionSurfaceId,
} from '../stores/useMotionSettingsStore';

// src/hooks/useReducedMotionFor.ts
// Only entry for components deciding whether a motion surface should calm down.

/** Subscribe to one surface's reduced-motion state. */
export const useReducedMotionFor = (surface: MotionSurfaceId): boolean => (
    useMotionSettingsStore(state => resolveReducedMotion(state, surface))
);

export default useReducedMotionFor;
