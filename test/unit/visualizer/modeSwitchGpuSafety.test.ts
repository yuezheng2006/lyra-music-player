import type { CSSProperties } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildVisualizerTheme } from '@/components/app/presentation/buildVisualizerTheme';
import { areGeometricBackgroundPropsEqual } from '@/components/visualizer/geometric/areGeometricBackgroundPropsEqual';
import type { GeometricBackgroundProps } from '@/components/visualizer/geometric/types';
import { VISUALIZER_REGISTRY, loadVisualizerRegistryEntry } from '@/components/visualizer/registry';
import { DEFAULT_THEME } from '@/components/app/root/appConstants';
import type { Theme, VisualizerMode } from '@/types';
import { resolveAppPlayerGeometricBackgroundDisabled } from '@/utils/visualizer/resolveAppPlayerGeometricBackgroundDisabled';
import {
    INTERACTIVE3D_CONFIGURE_PRIMITIVE_DEP_KEYS,
    INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS,
    assertLyricModeExcludedFromWebGlDeps,
    planVisualizerModeSwitchGpuSafety,
    resolveGeometricLayerRemountKey,
    resolveInteractive3dParticlesPaused,
    shouldHoldInteractive3dParticlesForHeavyLyricMode,
    shouldUnmountInteractive3dWebGlForLyricModeChange,
} from '@/utils/visualizer/visualizerModeSwitchGpuSafety';
import {
    INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS,
    INTERACTIVE3D_PLAY_START_YIELD_MS,
    INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS,
    armInteractive3dParticleYieldForModeSwitch,
    clearInteractive3dParticleYieldTimer,
    extendInteractive3dParticleYield,
} from '@/utils/visualizer/yieldInteractive3dParticlesForModeSwitch';

// Corner-case matrix: lyric / visual switches must never remount interactive3d WebGL.

const baseTheme = DEFAULT_THEME as Theme;
const darkAppStyle = { '--bg-color': '#111' } as CSSProperties;
const ALL_MODES = VISUALIZER_REGISTRY.map((entry) => entry.mode) as VisualizerMode[];

describe('modeSwitchGpuSafety — policy', () => {
    it('no-ops when switching to the same lyric mode', () => {
        const plan = planVisualizerModeSwitchGpuSafety({
            prevMode: 'classic',
            nextMode: 'classic',
            backgroundMode: 'interactive3d',
        });
        expect(plan.noop).toBe(true);
        expect(plan.yieldParticles).toBe(false);
        expect(plan.applyModeWithYield).toBe(false);
    });

    it('under interactive3d yields and applies mode synchronously (no startTransition race)', () => {
        for (const nextMode of ALL_MODES.filter((mode) => mode !== 'classic')) {
            const plan = planVisualizerModeSwitchGpuSafety({
                prevMode: 'classic',
                nextMode,
                backgroundMode: 'interactive3d',
            });
            expect(plan.noop, nextMode).toBe(false);
            expect(plan.yieldParticles, nextMode).toBe(true);
            expect(plan.applyModeWithYield, nextMode).toBe(true);
            expect(plan.settleMs, nextMode).toBeGreaterThanOrEqual(800);
        }
    });

    it('under light backgrounds does not yield and does not force sync apply', () => {
        for (const backgroundMode of ['common', 'turntable', 'monet', 'url', null] as const) {
            const plan = planVisualizerModeSwitchGpuSafety({
                prevMode: 'classic',
                nextMode: 'fume',
                backgroundMode,
            });
            expect(plan.yieldParticles, String(backgroundMode)).toBe(false);
            expect(plan.applyModeWithYield, String(backgroundMode)).toBe(false);
            expect(plan.noop, String(backgroundMode)).toBe(false);
        }
    });

    it('never unmounts interactive3d WebGL solely because lyric mode changed', () => {
        for (const prev of ALL_MODES) {
            for (const next of ALL_MODES) {
                expect(shouldUnmountInteractive3dWebGlForLyricModeChange(prev, next)).toBe(false);
            }
        }
    });

    it('combines yield and menu-hold into a single particle pause flag', () => {
        expect(resolveInteractive3dParticlesPaused({
            yieldInteractive3dParticles: false,
            holdInteractive3dParticleYield: false,
        })).toBe(false);
        expect(resolveInteractive3dParticlesPaused({
            yieldInteractive3dParticles: true,
            holdInteractive3dParticleYield: false,
        })).toBe(true);
        expect(resolveInteractive3dParticlesPaused({
            yieldInteractive3dParticles: false,
            holdInteractive3dParticleYield: true,
        })).toBe(true);
        expect(resolveInteractive3dParticlesPaused({
            yieldInteractive3dParticles: true,
            holdInteractive3dParticleYield: true,
        })).toBe(true);
    });

    it('holds interactive3d particles for cappella/pendolo on non-Electron', () => {
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'interactive3d',
            visualizerMode: 'cappella',
        })).toBe(true);
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'interactive3d',
            visualizerMode: 'pendolo',
        })).toBe(true);
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'interactive3d',
            visualizerMode: 'classic',
        })).toBe(false);
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'common',
            visualizerMode: 'pendolo',
        })).toBe(false);
    });

    it('on Electron holds interactive3d for any lyric mode while lyrics are visible', () => {
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'interactive3d',
            visualizerMode: 'classic',
            isElectron: true,
            lyricsVisible: true,
        })).toBe(true);
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'interactive3d',
            visualizerMode: 'monet',
            isElectron: true,
            lyricsVisible: true,
        })).toBe(true);
        expect(shouldHoldInteractive3dParticlesForHeavyLyricMode({
            backgroundMode: 'interactive3d',
            visualizerMode: 'classic',
            isElectron: true,
            lyricsVisible: false,
        })).toBe(false);
        expect(resolveInteractive3dParticlesPaused({
            yieldInteractive3dParticles: false,
            holdInteractive3dParticleYield: false,
            backgroundMode: 'interactive3d',
            visualizerMode: 'classic',
            isElectron: true,
            lyricsVisible: true,
        })).toBe(true);
    });
});

describe('modeSwitchGpuSafety — geometry remount key / seed', () => {
    it('layer remount key is seed-only (never includes visualizerMode)', () => {
        expect(resolveGeometricLayerRemountKey(42)).toBe('42');
        expect(resolveGeometricLayerRemountKey('geometry-stage')).toBe('geometry-stage');
        expect(resolveGeometricLayerRemountKey(undefined)).toBe('default');
        expect(resolveGeometricLayerRemountKey(null)).toBe('default');
    });

    it('keeps geometry seed identical across every registered lyric mode', () => {
        const seeds = ALL_MODES.map((visualizerMode) => buildVisualizerTheme({
            appStyle: darkAppStyle,
            theme: baseTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: 9001,
            visualizerMode,
            visualizerBackgroundMode: 'interactive3d',
        }).visualizerGeometrySeed);

        expect(new Set(seeds).size).toBe(1);
        expect(seeds[0]).toBe('9001');
        expect(seeds.every((seed) => !String(seed).includes('classic'))).toBe(true);
        expect(seeds.every((seed) => !String(seed).includes('fume'))).toBe(true);
    });

    it('empty-song seed stays stable across modes and never encodes mode name', () => {
        const seeds = ALL_MODES.map((visualizerMode) => buildVisualizerTheme({
            appStyle: {},
            theme: baseTheme,
            lyricsFontStyle: 'sans',
            lyricsCustomFontFamily: null,
            currentSongId: null,
            visualizerMode,
            visualizerBackgroundMode: 'interactive3d',
        }).visualizerGeometrySeed);

        expect(new Set(seeds).size).toBe(1);
        expect(seeds[0]).toBe('geometry-stage');
        for (const mode of ALL_MODES) {
            expect(String(seeds[0])).not.toContain(mode);
        }
    });

    it('settings subview alone never unmounts interactive3d geometry', () => {
        expect(resolveAppPlayerGeometricBackgroundDisabled({
            videoStageActive: false,
            backgroundMode: 'interactive3d',
            settingsSubviewOpen: true,
        })).toBe(false);
    });
});

describe('modeSwitchGpuSafety — WebGL dep contracts', () => {
    it('excludes lyric mode from configure and remount dep keys', () => {
        expect(assertLyricModeExcludedFromWebGlDeps(INTERACTIVE3D_CONFIGURE_PRIMITIVE_DEP_KEYS)).toBe(true);
        expect(assertLyricModeExcludedFromWebGlDeps(INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS)).toBe(true);
        expect(assertLyricModeExcludedFromWebGlDeps(['visualizerMode', 'coverUrl'])).toBe(false);
        expect(assertLyricModeExcludedFromWebGlDeps(['mode', 'enabled'])).toBe(false);
    });

    it('keeps remount deps a strict subset of configure-relevant concerns', () => {
        // Remounting WebGL is far more expensive than configure(); remount list must stay small.
        expect(INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS.length).toBeLessThanOrEqual(8);
        // Preset chips (封面/滚筒/星河) must configure-in-place — remount freezes Electron GPU.
        expect(INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS).not.toContain('visualPreset');
        expect(INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS).not.toContain('enableCoverParticles');
        expect(INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS).not.toContain('rhythmIntensity');
        expect(INTERACTIVE3D_WEBGL_REMOUNT_DEP_KEYS).not.toContain('coverUrl');
        expect(INTERACTIVE3D_CONFIGURE_PRIMITIVE_DEP_KEYS).toContain('visualPreset');
        expect(INTERACTIVE3D_CONFIGURE_PRIMITIVE_DEP_KEYS).toContain('coverUrl');
    });
});

describe('modeSwitchGpuSafety — geometric memo vs yield', () => {
    const audioPower = { get: () => 0 } as GeometricBackgroundProps['audioPower'];

    it('particlesYielded invalidates memo without requiring paused=true', () => {
        const prev: GeometricBackgroundProps = {
            theme: baseTheme,
            audioPower,
            seed: '9001',
            paused: false,
            particlesYielded: false,
            visualizerMode: 'classic',
        };
        const yielded: GeometricBackgroundProps = { ...prev, particlesYielded: true };
        expect(areGeometricBackgroundPropsEqual(prev, yielded)).toBe(false);
    });

    it('visualizerMode change re-renders containment styling but keeps the same remount key', () => {
        const prev: GeometricBackgroundProps = {
            theme: baseTheme,
            audioPower,
            seed: '9001',
            visualizerMode: 'classic',
        };
        const next: GeometricBackgroundProps = {
            ...prev,
            visualizerMode: 'monet',
        };
        expect(areGeometricBackgroundPropsEqual(prev, next)).toBe(false);
        expect(resolveGeometricLayerRemountKey(prev.seed)).toBe(
            resolveGeometricLayerRemountKey(next.seed),
        );
    });

    it('seed change is the only geometric remount signal among common mode-switch props', () => {
        const base: GeometricBackgroundProps = {
            theme: baseTheme,
            audioPower,
            seed: 'song-a',
            visualizerMode: 'classic',
            particlesYielded: false,
            paused: false,
        };
        expect(resolveGeometricLayerRemountKey(base.seed)).not.toBe(
            resolveGeometricLayerRemountKey('song-b'),
        );
        expect(resolveGeometricLayerRemountKey(base.seed)).toBe(
            resolveGeometricLayerRemountKey({ ...base, visualizerMode: 'fume' }.seed),
        );
        expect(resolveGeometricLayerRemountKey(base.seed)).toBe(
            resolveGeometricLayerRemountKey({ ...base, particlesYielded: true }.seed),
        );
    });
});

describe('modeSwitchGpuSafety — yield timing corner cases', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        clearInteractive3dParticleYieldTimer();
    });

    afterEach(() => {
        clearInteractive3dParticleYieldTimer();
        vi.useRealTimers();
    });

    it('settle window outlasts a typical startTransition deferral (800ms+)', () => {
        expect(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS).toBeGreaterThanOrEqual(800);
        expect(INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS).toBeGreaterThanOrEqual(400);
        expect(INTERACTIVE3D_PLAY_START_YIELD_MS).toBeGreaterThanOrEqual(1500);
    });

    it('rapid consecutive switches keep GPU yielded until the last settle completes', () => {
        const setYielding = vi.fn();
        const modes: VisualizerMode[] = ['classic', 'fume', 'partita', 'monet', 'pendolo'];
        let lastSettleMs = INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS;
        for (const mode of modes) {
            const plan = planVisualizerModeSwitchGpuSafety({
                prevMode: 'tilt',
                nextMode: mode === 'classic' ? 'fume' : mode,
                backgroundMode: 'interactive3d',
            });
            expect(plan.applyModeWithYield).toBe(true);
            lastSettleMs = plan.settleMs;
            armInteractive3dParticleYieldForModeSwitch({
                backgroundMode: 'interactive3d',
                setYielding,
                yieldMs: plan.settleMs,
            });
            vi.advanceTimersByTime(120);
        }

        // Still yielded mid-burst.
        expect(setYielding).not.toHaveBeenCalledWith(false);

        // Last switch may be a heavy lyric remount (pendolo/cappella) with a longer settle.
        vi.advanceTimersByTime(lastSettleMs);
        expect(setYielding).toHaveBeenLastCalledWith(false);
    });

    it('gives cappella and pendolo a longer interactive3d settle window', () => {
        for (const nextMode of ['cappella', 'pendolo'] as const) {
            const plan = planVisualizerModeSwitchGpuSafety({
                prevMode: 'classic',
                nextMode,
                backgroundMode: 'interactive3d',
            });
            expect(plan.settleMs).toBeGreaterThanOrEqual(1400);
        }
    });

    it('menu-close extend re-arms yield after hold drops (close overlapping remount)', () => {
        const setYielding = vi.fn();
        armInteractive3dParticleYieldForModeSwitch({
            backgroundMode: 'interactive3d',
            setYielding,
        });
        vi.advanceTimersByTime(INTERACTIVE3D_VISUALIZER_MODE_SWITCH_YIELD_MS);
        expect(setYielding).toHaveBeenLastCalledWith(false);

        extendInteractive3dParticleYield({ setYielding });
        expect(setYielding).toHaveBeenLastCalledWith(true);
        vi.advanceTimersByTime(INTERACTIVE3D_BACKGROUND_MENU_CLOSE_YIELD_MS - 1);
        expect(setYielding.mock.calls.filter((call) => call[0] === false).length).toBe(1);
        vi.advanceTimersByTime(1);
        expect(setYielding).toHaveBeenLastCalledWith(false);
    });

    it('pair-wise mode switches under interactive3d always request sync yield apply', () => {
        const sample = ALL_MODES.slice(0, 5);
        for (const prev of sample) {
            for (const next of sample) {
                if (prev === next) continue;
                const plan = planVisualizerModeSwitchGpuSafety({
                    prevMode: prev,
                    nextMode: next,
                    backgroundMode: 'interactive3d',
                });
                expect(plan.applyModeWithYield).toBe(true);
                expect(plan.yieldParticles).toBe(true);
            }
        }
    });
});

describe('modeSwitchGpuSafety — registry readiness', () => {
    it('every registered lyric mode lazy-loads a render function (prefetch contract)', async () => {
        const entries = await Promise.all(
            ALL_MODES.map((mode) => loadVisualizerRegistryEntry(mode)),
        );
        for (const entry of entries) {
            expect(typeof entry.render).toBe('function');
            expect(ALL_MODES).toContain(entry.mode);
        }
    });

    it('cached mode loads are sync-stable across repeated requests', async () => {
        const first = await loadVisualizerRegistryEntry('partita');
        const second = await loadVisualizerRegistryEntry('partita');
        expect(second).toBe(first);
    });
});
