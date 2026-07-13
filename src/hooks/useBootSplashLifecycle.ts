import { useEffect } from 'react';
import {
    armBootSplashTimeout,
    BOOT_SPLASH_PAINT_SETTLE_MS,
    DEFAULT_BOOT_TIMEOUT_MS,
    dismissBootSplash,
    setBootSplashStatus,
} from '@/utils/bootSplash';

// src/hooks/useBootSplashLifecycle.ts
// Dismisses the HTML boot splash only after the React shell has had time to paint.

type UseBootSplashLifecycleOptions = {
    ready: boolean;
    statusText?: string;
};

/**
 * Arms the splash timeout and dismisses it when ready.
 * Uses double-rAF + a short settle so the shell paints under the overlay (avoids black flash).
 */
export function useBootSplashLifecycle({ ready, statusText }: UseBootSplashLifecycleOptions): void {
    useEffect(() => {
        armBootSplashTimeout(DEFAULT_BOOT_TIMEOUT_MS);
    }, []);

    useEffect(() => {
        if (statusText) {
            setBootSplashStatus(statusText);
        }
    }, [statusText]);

    useEffect(() => {
        if (!ready) {
            return;
        }

        let cancelled = false;
        let settleTimer: number | null = null;
        let outerFrame = 0;
        let innerFrame = 0;

        // Do not latch a dismissedRef before hide — StrictMode cleanup would cancel
        // the first schedule and skip the remount pass forever (stuck black splash).
        outerFrame = window.requestAnimationFrame(() => {
            innerFrame = window.requestAnimationFrame(() => {
                settleTimer = window.setTimeout(() => {
                    if (!cancelled) {
                        dismissBootSplash();
                    }
                }, BOOT_SPLASH_PAINT_SETTLE_MS);
            });
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(outerFrame);
            window.cancelAnimationFrame(innerFrame);
            if (settleTimer !== null) {
                window.clearTimeout(settleTimer);
            }
        };
    }, [ready]);
}
