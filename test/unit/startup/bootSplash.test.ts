import { describe, expect, it } from 'vitest';
import {
    BOOT_SPLASH_MIN_DWELL_MS,
    resolveBootSplashDismissDelayMs,
} from '@/utils/bootSplash';

// test/unit/startup/bootSplash.test.ts

describe('bootSplash dwell', () => {
    it('waits the full min dwell when splash was just shown', () => {
        expect(resolveBootSplashDismissDelayMs(1000, 1000)).toBe(BOOT_SPLASH_MIN_DWELL_MS);
    });

    it('shortens delay after the splash has already been visible', () => {
        expect(resolveBootSplashDismissDelayMs(1000, 1000 + 200)).toBe(BOOT_SPLASH_MIN_DWELL_MS - 200);
    });

    it('dismisses immediately once min dwell has elapsed', () => {
        expect(resolveBootSplashDismissDelayMs(1000, 1000 + BOOT_SPLASH_MIN_DWELL_MS + 40)).toBe(0);
    });

    it('falls back to min dwell when shownAt is missing', () => {
        expect(resolveBootSplashDismissDelayMs(0, 5000)).toBe(BOOT_SPLASH_MIN_DWELL_MS);
    });
});
