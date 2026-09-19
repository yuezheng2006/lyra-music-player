import { create } from 'zustand';
import { getStoredBoolean, setStoredBoolean } from './settingsUi/settingsPersistenceCore';

// src/stores/useMotionSettingsStore.ts
// Explicit reduce-motion surfaces. System preference alone must not strip animations
// (Windows "animation effects" off → Chromium prefers-reduced-motion; Folia #370).

/** Independently reducible motion surfaces users can name. */
export type MotionSurfaceId =
    | 'visualizerStage'
    | 'transitionOverlay'
    | 'monetBackground'
    | 'uiMicroMotion'
    | 'settingsScroll';

export const MOTION_SURFACE_IDS = [
    'visualizerStage',
    'transitionOverlay',
    'monetBackground',
    'uiMicroMotion',
    'settingsScroll',
] as const satisfies readonly MotionSurfaceId[];

export const SYSTEM_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const FOLLOW_SYSTEM_KEY = 'reduce_motion_follow_system';
const VISUALIZER_STAGE_KEY = 'reduce_motion_visualizerStage';
const TRANSITION_OVERLAY_KEY = 'reduce_motion_transitionOverlay';
const MONET_BACKGROUND_KEY = 'reduce_motion_monetBackground';
const UI_MICRO_MOTION_KEY = 'reduce_motion_uiMicroMotion';
const SETTINGS_SCROLL_KEY = 'reduce_motion_settingsScroll';

const SURFACE_STORAGE_KEYS: Record<MotionSurfaceId, string> = {
    visualizerStage: VISUALIZER_STAGE_KEY,
    transitionOverlay: TRANSITION_OVERLAY_KEY,
    monetBackground: MONET_BACKGROUND_KEY,
    uiMicroMotion: UI_MICRO_MOTION_KEY,
    settingsScroll: SETTINGS_SCROLL_KEY,
};

const readSystemPreference = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(SYSTEM_REDUCED_MOTION_QUERY).matches
);

const readStoredSurfaces = (): Record<MotionSurfaceId, boolean> => (
    Object.fromEntries(
        MOTION_SURFACE_IDS.map(surface => [surface, getStoredBoolean(SURFACE_STORAGE_KEYS[surface], false)]),
    ) as Record<MotionSurfaceId, boolean>
);

export type MotionSettingsState = {
    reducedMotionSurfaces: Record<MotionSurfaceId, boolean>;
    /** When true, OS preference also reduces every surface. Default false. */
    followSystemReducedMotion: boolean;
    systemPrefersReducedMotion: boolean;

    handleToggleReducedMotionSurface: (surface: MotionSurfaceId, enabled: boolean) => void;
    handleToggleFollowSystemReducedMotion: (enabled: boolean) => void;
    setSystemPrefersReducedMotion: (matches: boolean) => void;
};

export const useMotionSettingsStore = create<MotionSettingsState>(set => ({
    reducedMotionSurfaces: readStoredSurfaces(),
    followSystemReducedMotion: getStoredBoolean(FOLLOW_SYSTEM_KEY, false),
    systemPrefersReducedMotion: readSystemPreference(),

    handleToggleReducedMotionSurface: (surface, enabled) => {
        set(state => ({ reducedMotionSurfaces: { ...state.reducedMotionSurfaces, [surface]: enabled } }));
        setStoredBoolean(SURFACE_STORAGE_KEYS[surface], enabled);
    },
    handleToggleFollowSystemReducedMotion: (enabled) => {
        set({ followSystemReducedMotion: enabled });
        setStoredBoolean(FOLLOW_SYSTEM_KEY, enabled);
    },
    setSystemPrefersReducedMotion: (matches) => set({ systemPrefersReducedMotion: matches }),
}));

/** Pure resolve for hooks, CSS sync, and imperative call sites. */
export const resolveReducedMotion = (
    state: Pick<MotionSettingsState, 'reducedMotionSurfaces' | 'followSystemReducedMotion' | 'systemPrefersReducedMotion'>,
    surface: MotionSurfaceId,
): boolean => (
    state.reducedMotionSurfaces[surface]
    || (state.followSystemReducedMotion && state.systemPrefersReducedMotion)
);

export const selectReducedSurfaceList = (
    state: Pick<MotionSettingsState, 'reducedMotionSurfaces' | 'followSystemReducedMotion' | 'systemPrefersReducedMotion'>,
): string => MOTION_SURFACE_IDS.filter(surface => resolveReducedMotion(state, surface)).join(' ');

const syncMotionSurfaceAttribute = (state: MotionSettingsState): void => {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const reducedSurfaces = selectReducedSurfaceList(state);
    if (reducedSurfaces) {
        document.documentElement.setAttribute('data-reduce-motion', reducedSurfaces);
    } else {
        document.documentElement.removeAttribute('data-reduce-motion');
    }
};

export const readReducedMotion = (surface: MotionSurfaceId): boolean => (
    resolveReducedMotion(useMotionSettingsStore.getState(), surface)
);

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const query = window.matchMedia(SYSTEM_REDUCED_MOTION_QUERY);
    query.addEventListener('change', event => {
        useMotionSettingsStore.getState().setSystemPrefersReducedMotion(event.matches);
    });
}

syncMotionSurfaceAttribute(useMotionSettingsStore.getState());
useMotionSettingsStore.subscribe(syncMotionSurfaceAttribute);
