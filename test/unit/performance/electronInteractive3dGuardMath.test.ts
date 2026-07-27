import { describe, expect, it } from 'vitest';
import {
    clampGeometricTierToCeiling,
    resolveElectronQualityCeiling,
    resolveElectronSafeVisualizerBackgroundMode,
    resolveElectronSafeVisualizerMode,
    resolveGpuCrashVisualizerFallback,
    resolveGpuCrashVisualizerModeFallback,
    resolveUserSelectedVisualizerBackgroundMode,
} from '@/utils/performance/electronInteractive3dGuardMath';

// Guards Electron interactive3d from pegging / crashing the GPU helper.

describe('electronInteractive3dGuardMath', () => {
    it('caps all Electron auto quality to lite so 3D cannot thrash playback', () => {
        expect(resolveElectronQualityCeiling({
            isElectron: true,
            devicePixelRatio: 2,
        })).toBe('lite');
        expect(resolveElectronQualityCeiling({
            isElectron: true,
            devicePixelRatio: 1,
        })).toBe('lite');
        expect(resolveElectronQualityCeiling({
            isElectron: true,
            devicePixelRatio: 2,
            prefersReducedMotion: true,
        })).toBe('lite');
    });

    it('does not clamp browser / non-electron runtimes', () => {
        expect(resolveElectronQualityCeiling({
            isElectron: false,
            devicePixelRatio: 2,
        })).toBeNull();
    });

    it('clamps override tiers down to the electron ceiling', () => {
        expect(clampGeometricTierToCeiling('high', 'lite')).toBe('lite');
        expect(clampGeometricTierToCeiling('balanced', 'lite')).toBe('lite');
        expect(clampGeometricTierToCeiling('lite', 'balanced')).toBe('lite');
        expect(clampGeometricTierToCeiling('high', null)).toBe('high');
    });

    it('falls back from heavy backgrounds after a GPU crash', () => {
        expect(resolveGpuCrashVisualizerFallback('interactive3d')).toBe('common');
        expect(resolveGpuCrashVisualizerFallback('monet')).toBe('common');
        expect(resolveGpuCrashVisualizerFallback('latent')).toBe('common');
        expect(resolveGpuCrashVisualizerFallback('common')).toBeNull();
    });

    it('keeps Retina Electron off interactive3d unless the user opts in', () => {
        expect(resolveElectronSafeVisualizerBackgroundMode({
            mode: 'interactive3d',
            isElectron: true,
            devicePixelRatio: 2,
            gpuUnstable: false,
            interactive3dOptIn: false,
        })).toBe('common');

        expect(resolveElectronSafeVisualizerBackgroundMode({
            mode: 'interactive3d',
            isElectron: true,
            devicePixelRatio: 2,
            gpuUnstable: false,
            interactive3dOptIn: true,
        })).toBe('interactive3d');

        expect(resolveElectronSafeVisualizerBackgroundMode({
            mode: 'interactive3d',
            isElectron: true,
            devicePixelRatio: 2,
            gpuUnstable: true,
            interactive3dOptIn: true,
        })).toBe('common');
    });

    it('forces common for any non-common mode when GPU is marked unstable', () => {
        expect(resolveElectronSafeVisualizerBackgroundMode({
            mode: 'monet',
            isElectron: true,
            devicePixelRatio: 2,
            gpuUnstable: true,
            interactive3dOptIn: false,
        })).toBe('common');
    });

    it('allows interactive3d retry while blocking other heavy modes under gpuUnstable', () => {
        expect(resolveUserSelectedVisualizerBackgroundMode({
            requested: 'interactive3d',
            isElectron: true,
            gpuUnstable: true,
        })).toBe('interactive3d');

        expect(resolveUserSelectedVisualizerBackgroundMode({
            requested: 'latent',
            isElectron: true,
            gpuUnstable: true,
        })).toBe('common');

        expect(resolveUserSelectedVisualizerBackgroundMode({
            requested: 'interactive3d',
            isElectron: true,
            gpuUnstable: false,
        })).toBe('interactive3d');

        expect(resolveUserSelectedVisualizerBackgroundMode({
            requested: 'interactive3d',
            isElectron: false,
            gpuUnstable: true,
        })).toBe('interactive3d');
    });

    it('does not demote lyric style after a GPU crash (Monet stays available)', () => {
        expect(resolveGpuCrashVisualizerModeFallback('monet')).toBeNull();
        expect(resolveGpuCrashVisualizerModeFallback('dazibao')).toBeNull();
        expect(resolveGpuCrashVisualizerModeFallback('classic')).toBeNull();
    });

    it('keeps Monet lyric mode on Electron even when GPU is marked unstable', () => {
        expect(resolveElectronSafeVisualizerMode({
            mode: 'monet',
            isElectron: true,
            gpuUnstable: true,
        })).toBe('monet');

        expect(resolveElectronSafeVisualizerMode({
            mode: 'classic',
            isElectron: true,
            gpuUnstable: true,
        })).toBe('classic');
    });
});
