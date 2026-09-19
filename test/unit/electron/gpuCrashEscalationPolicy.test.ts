import { describe, expect, it } from 'vitest';
import {
    GPU_CRASH_REPEAT_WINDOW_MS,
    resolveDeEscalatedLevel,
    resolveGpuEscalationSwitches,
    resolveMaxEscalationLevel,
    resolveNextEscalationLevel,
} from '../../../electron/gpuCrashEscalationPolicy.cjs';

// Regression for the 2026-08-03 freeze loop: GPU helper died (exit 512) on the
// default Graphite backend once per listening session, but the old ladder only
// escalated on repeat-within-15min crashes — so every fresh session replayed
// crash → freeze → relaunch on the same crashy backend forever.

describe('gpuCrashEscalationPolicy — ladder switches', () => {
    it('level 0 keeps Chromium defaults (no switches)', () => {
        expect(resolveGpuEscalationSwitches(0, 'arm64')).toEqual([]);
        expect(resolveGpuEscalationSwitches(0, 'x64')).toEqual([]);
    });

    it('level 1 disables Skia Graphite but stays hardware-accelerated (no SwiftShader)', () => {
        for (const arch of ['arm64', 'x64'] as const) {
            const flat = resolveGpuEscalationSwitches(1, arch).map((s: string[]) => s[0]);
            expect(flat).toContain('disable-skia-graphite');
            expect(flat).not.toContain('use-angle');
            expect(flat).not.toContain('enable-unsafe-swiftshader');
        }
    });

    it('arm64 level 2 falls back to SwiftShader (legacy GL ANGLE broken on Apple Silicon)', () => {
        const switches = resolveGpuEscalationSwitches(2, 'arm64');
        expect(switches).toContainEqual(['use-angle', 'swiftshader']);
        expect(switches).toContainEqual(['enable-unsafe-swiftshader']);
    });

    it('x64 level 2 tries legacy GL before SwiftShader at level 3', () => {
        expect(resolveGpuEscalationSwitches(2, 'x64')).toContainEqual(['use-angle', 'gl']);
        expect(resolveGpuEscalationSwitches(2, 'x64').map((s: string[]) => s[0]))
            .not.toContain('enable-unsafe-swiftshader');
        expect(resolveGpuEscalationSwitches(3, 'x64')).toContainEqual(['use-angle', 'swiftshader']);
    });

    it('max level matches the arch ladder depth', () => {
        expect(resolveMaxEscalationLevel('arm64')).toBe(2);
        expect(resolveMaxEscalationLevel('x64')).toBe(3);
    });
});

describe('gpuCrashEscalationPolicy — escalation decisions', () => {
    const now = 1_785_689_267_899;

    it('FIRST crash escalates 0 -> 1 even outside the repeat window', () => {
        expect(resolveNextEscalationLevel({
            currentLevel: 0,
            lastRelaunchAt: 0,
            now,
            arch: 'arm64',
        })).toBe(1);
        // Crash a whole day after the previous relaunch still moves off Graphite.
        expect(resolveNextEscalationLevel({
            currentLevel: 0,
            lastRelaunchAt: now - 24 * 60 * 60 * 1000,
            now,
            arch: 'arm64',
        })).toBe(1);
    });

    it('beyond level 1, escalation still requires a repeat crash within the window', () => {
        expect(resolveNextEscalationLevel({
            currentLevel: 1,
            lastRelaunchAt: now - GPU_CRASH_REPEAT_WINDOW_MS - 1,
            now,
            arch: 'arm64',
        })).toBe(1);
        expect(resolveNextEscalationLevel({
            currentLevel: 1,
            lastRelaunchAt: now - 60_000,
            now,
            arch: 'arm64',
        })).toBe(2);
    });

    it('escalation clamps at the arch max level', () => {
        expect(resolveNextEscalationLevel({
            currentLevel: 2,
            lastRelaunchAt: now - 1_000,
            now,
            arch: 'arm64',
        })).toBe(2);
        expect(resolveNextEscalationLevel({
            currentLevel: 3,
            lastRelaunchAt: now - 1_000,
            now,
            arch: 'x64',
        })).toBe(3);
    });
});

describe('gpuCrashEscalationPolicy — de-escalation', () => {
    it('never steps back down to the crashed Graphite backend (floor = 1)', () => {
        expect(resolveDeEscalatedLevel(2)).toBe(1);
        expect(resolveDeEscalatedLevel(1)).toBe(1);
        expect(resolveDeEscalatedLevel(3)).toBe(2);
    });

    it('a machine that never crashed stays on defaults', () => {
        expect(resolveDeEscalatedLevel(0)).toBe(0);
    });
});
