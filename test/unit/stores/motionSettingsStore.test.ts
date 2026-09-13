import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    MOTION_SURFACE_IDS,
    readReducedMotion,
    resolveReducedMotion,
    useMotionSettingsStore,
} from '@/stores/useMotionSettingsStore';

// test/unit/stores/motionSettingsStore.test.ts
// System preference alone must not calm any surface until follow-system is on.

const fullMotion = {
    reducedMotionSurfaces: Object.fromEntries(
        MOTION_SURFACE_IDS.map(surface => [surface, false]),
    ) as Record<(typeof MOTION_SURFACE_IDS)[number], boolean>,
    followSystemReducedMotion: false,
    systemPrefersReducedMotion: false,
};

describe('motion settings store', () => {
    let values: Map<string, string>;

    beforeEach(() => {
        values = new Map();
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        };
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('window', { localStorage: storage });
        useMotionSettingsStore.setState({ ...fullMotion });
    });

    afterEach(() => {
        useMotionSettingsStore.setState({ ...fullMotion });
        vi.unstubAllGlobals();
    });

    it('defaults every surface to full motion when nothing is stored', async () => {
        vi.resetModules();
        const fresh = await import('@/stores/useMotionSettingsStore');
        const state = fresh.useMotionSettingsStore.getState();

        expect(state.followSystemReducedMotion).toBe(false);
        MOTION_SURFACE_IDS.forEach(surface => {
            expect(fresh.resolveReducedMotion(state, surface)).toBe(false);
        });
    });

    it('restores the stored choices on load', async () => {
        values.set('reduce_motion_visualizerStage', 'true');
        values.set('reduce_motion_follow_system', 'true');
        vi.resetModules();
        const fresh = await import('@/stores/useMotionSettingsStore');
        const state = fresh.useMotionSettingsStore.getState();

        expect(state.reducedMotionSurfaces.visualizerStage).toBe(true);
        expect(state.reducedMotionSurfaces.monetBackground).toBe(false);
        expect(state.followSystemReducedMotion).toBe(true);
    });

    it('ignores the system preference until follow-system is enabled', () => {
        useMotionSettingsStore.setState({ systemPrefersReducedMotion: true });
        expect(readReducedMotion('visualizerStage')).toBe(false);

        useMotionSettingsStore.getState().handleToggleFollowSystemReducedMotion(true);
        expect(readReducedMotion('visualizerStage')).toBe(true);
    });

    it('reduces only the surface that was switched off', () => {
        useMotionSettingsStore.getState().handleToggleReducedMotionSurface('visualizerStage', true);

        expect(readReducedMotion('visualizerStage')).toBe(true);
        expect(readReducedMotion('monetBackground')).toBe(false);
        expect(readReducedMotion('settingsScroll')).toBe(false);
    });

    it('persists each surface under its own key', () => {
        useMotionSettingsStore.getState().handleToggleReducedMotionSurface('transitionOverlay', true);
        expect(localStorage.getItem('reduce_motion_transitionOverlay')).toBe('true');

        useMotionSettingsStore.getState().handleToggleReducedMotionSurface('transitionOverlay', false);
        expect(localStorage.getItem('reduce_motion_transitionOverlay')).toBe('false');
    });

    it('keeps a surface reduced when follow-system is turned back off', () => {
        useMotionSettingsStore.getState().handleToggleReducedMotionSurface('visualizerStage', true);
        useMotionSettingsStore.setState({ followSystemReducedMotion: true, systemPrefersReducedMotion: true });
        expect(readReducedMotion('visualizerStage')).toBe(true);

        useMotionSettingsStore.getState().handleToggleFollowSystemReducedMotion(false);
        expect(readReducedMotion('visualizerStage')).toBe(true);
        expect(readReducedMotion('uiMicroMotion')).toBe(false);
    });

    describe('html data-reduce-motion attribute', () => {
        let attributes: Map<string, string>;

        beforeEach(() => {
            attributes = new Map();
            vi.stubGlobal('document', {
                documentElement: {
                    setAttribute: (name: string, value: string) => attributes.set(name, value),
                    removeAttribute: (name: string) => attributes.delete(name),
                },
            });
        });

        it('lists every reduced surface as space-separated words for ~= selectors', () => {
            useMotionSettingsStore.getState().handleToggleReducedMotionSurface('visualizerStage', true);
            useMotionSettingsStore.getState().handleToggleReducedMotionSurface('uiMicroMotion', true);
            expect(attributes.get('data-reduce-motion')).toBe('visualizerStage uiMicroMotion');

            useMotionSettingsStore.getState().handleToggleReducedMotionSurface('visualizerStage', false);
            expect(attributes.get('data-reduce-motion')).toBe('uiMicroMotion');

            useMotionSettingsStore.getState().handleToggleReducedMotionSurface('uiMicroMotion', false);
            expect(attributes.has('data-reduce-motion')).toBe(false);
        });

        it('exposes resolveReducedMotion as a pure helper', () => {
            const state = {
                ...fullMotion,
                reducedMotionSurfaces: { ...fullMotion.reducedMotionSurfaces, monetBackground: true },
            };
            expect(resolveReducedMotion(state, 'monetBackground')).toBe(true);
            expect(resolveReducedMotion(state, 'uiMicroMotion')).toBe(false);
        });
    });
});
