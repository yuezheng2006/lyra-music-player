import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS,
    INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS,
    armInteractive3dParticleYieldForModeSwitch,
    clearInteractive3dParticleYieldTimer,
    extendInteractive3dParticleYield,
    shouldYieldInteractive3dParticlesForVisualizerModeSwitch,
} from '@/utils/visualizer/yieldInteractive3dParticlesForModeSwitch';

// Mode-switch GPU guard yields particle ticks; WebGL context stays mounted.

describe('yieldInteractive3dParticlesForModeSwitch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        clearInteractive3dParticleYieldTimer();
    });

    afterEach(() => {
        clearInteractive3dParticleYieldTimer();
        vi.useRealTimers();
    });

    it('only targets interactive3d background', () => {
        expect(shouldYieldInteractive3dParticlesForVisualizerModeSwitch('interactive3d')).toBe(true);
        expect(shouldYieldInteractive3dParticlesForVisualizerModeSwitch('common')).toBe(false);
        expect(shouldYieldInteractive3dParticlesForVisualizerModeSwitch('turntable')).toBe(false);
        expect(shouldYieldInteractive3dParticlesForVisualizerModeSwitch(null)).toBe(false);
    });

    it('uses a settle window long enough for deferred lyric remounts', () => {
        expect(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS).toBeGreaterThanOrEqual(800);
    });

    it('yields then resumes after the settle window', () => {
        const setYielding = vi.fn();
        expect(armInteractive3dParticleYieldForModeSwitch({
            backgroundMode: 'interactive3d',
            setYielding,
        })).toBe(true);
        expect(setYielding).toHaveBeenCalledWith(true);

        vi.advanceTimersByTime(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS - 1);
        expect(setYielding).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        expect(setYielding).toHaveBeenLastCalledWith(false);
    });

    it('resets the resume timer on rapid switches', () => {
        const setYielding = vi.fn();
        armInteractive3dParticleYieldForModeSwitch({
            backgroundMode: 'interactive3d',
            setYielding,
        });
        vi.advanceTimersByTime(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS - 50);
        armInteractive3dParticleYieldForModeSwitch({
            backgroundMode: 'interactive3d',
            setYielding,
        });
        expect(setYielding).toHaveBeenCalledTimes(2);

        vi.advanceTimersByTime(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS - 1);
        expect(setYielding).toHaveBeenCalledTimes(2);

        vi.advanceTimersByTime(1);
        expect(setYielding).toHaveBeenLastCalledWith(false);
        expect(setYielding).toHaveBeenCalledTimes(3);
    });

    it('extends yield after background menu close', () => {
        const setYielding = vi.fn();
        extendInteractive3dParticleYield({ setYielding });
        expect(setYielding).toHaveBeenCalledWith(true);

        vi.advanceTimersByTime(INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS - 1);
        expect(setYielding).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        expect(setYielding).toHaveBeenLastCalledWith(false);
    });

    it('no-ops for light backgrounds', () => {
        const setYielding = vi.fn();
        expect(armInteractive3dParticleYieldForModeSwitch({
            backgroundMode: 'common',
            setYielding,
        })).toBe(false);
        expect(setYielding).not.toHaveBeenCalled();
    });
});
