import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
} from 'react';
import type { GeometricQualityProfile } from '../geometricQuality';
import type {
    InteractiveBackgroundCompositeState,
    InteractiveBackgroundFrameInputs,
    InteractiveBackgroundPalette,
} from './types';

// src/components/visualizer/geometric/interactiveBackground/InteractiveBackgroundContext.tsx
// Registry for composable canvas effects rendered on one shared RAF loop.

export type InteractiveBackgroundEffectHandle = {
    id: string;
    order: number;
    onResize?: (
        state: InteractiveBackgroundCompositeState,
        width: number,
        height: number,
        profile: GeometricQualityProfile,
    ) => void;
    advance?: (
        state: InteractiveBackgroundCompositeState,
        inputs: InteractiveBackgroundFrameInputs,
        profile: GeometricQualityProfile,
        dt: number,
    ) => void;
    draw: (
        context: CanvasRenderingContext2D,
        state: InteractiveBackgroundCompositeState,
        inputs: InteractiveBackgroundFrameInputs,
        palette: InteractiveBackgroundPalette,
    ) => void;
};

type InteractiveBackgroundRegistry = {
    register: (handle: InteractiveBackgroundEffectHandle) => () => void;
    getHandles: () => InteractiveBackgroundEffectHandle[];
};

const InteractiveBackgroundContext = createContext<InteractiveBackgroundRegistry | null>(null);

export const InteractiveBackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const handlesRef = useRef<Map<string, InteractiveBackgroundEffectHandle>>(new Map());

    const register = useCallback((handle: InteractiveBackgroundEffectHandle) => {
        handlesRef.current.set(handle.id, handle);
        return () => {
            handlesRef.current.delete(handle.id);
        };
    }, []);

    const getHandles = useCallback(
        () => Array.from(handlesRef.current.values()).sort((left, right) => left.order - right.order),
        [],
    );

    const value = useMemo(
        () => ({ register, getHandles }),
        [getHandles, register],
    );

    return (
        <InteractiveBackgroundContext.Provider value={value}>
            {children}
        </InteractiveBackgroundContext.Provider>
    );
};

export const useInteractiveBackgroundRegistry = () => {
    const registry = useContext(InteractiveBackgroundContext);
    if (!registry) {
        throw new Error('useInteractiveBackgroundRegistry must be used within InteractiveBackgroundProvider');
    }
    return registry;
};

export const useInteractiveBackgroundEffect = (
    handle: InteractiveBackgroundEffectHandle,
    deps: React.DependencyList,
) => {
    const { register } = useInteractiveBackgroundRegistry();

    React.useEffect(() => {
        return register(handle);
    }, deps);
};
