// src/utils/bootSplash.ts
// Controls the HTML boot splash that paints before the React bundle.

const BOOT_SPLASH_ID = 'boot-splash';
const BOOT_STATUS_SELECTOR = '[data-boot-status]';
/** Failsafe if React never signals ready. */
export const DEFAULT_BOOT_TIMEOUT_MS = 8000;
/** Keep splash long enough to avoid a black flash between HTML and React paint. */
export const BOOT_SPLASH_MIN_DWELL_MS = 520;
/** Match CSS transition on #boot-splash[data-hidden]. */
export const BOOT_SPLASH_FADE_MS = 280;
/** Extra settle after double-rAF so AppShell can paint under the overlay. */
export const BOOT_SPLASH_PAINT_SETTLE_MS = 64;

let dismissScheduled = false;
let forceDismissTimer: number | null = null;
let splashShownAtMs = 0;

/** Keep splash on screen when previewing with ?holdBoot=1. */
export function shouldHoldBootSplash(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        return new URLSearchParams(window.location.search).get('holdBoot') === '1';
    } catch {
        return false;
    }
}

/** Record when the splash became visible (for min-dwell). */
export function markBootSplashShown(nowMs: number = typeof performance !== 'undefined' ? performance.now() : Date.now()): void {
    if (splashShownAtMs > 0) {
        return;
    }
    const early = typeof window !== 'undefined'
        ? (window as Window & { __lyraBootShownAt?: number }).__lyraBootShownAt
        : undefined;
    splashShownAtMs = typeof early === 'number' && early > 0 ? early : nowMs;
}

/** How long to wait before fading so min dwell is honored. */
export function resolveBootSplashDismissDelayMs(
    shownAtMs: number,
    nowMs: number,
    minDwellMs: number = BOOT_SPLASH_MIN_DWELL_MS,
): number {
    if (shownAtMs <= 0) {
        return minDwellMs;
    }
    return Math.max(0, minDwellMs - (nowMs - shownAtMs));
}

/** Update the splash status line while the shell is still visible. */
export function setBootSplashStatus(text: string): void {
    if (typeof document === 'undefined') {
        return;
    }
    const statusNode = document.querySelector(BOOT_STATUS_SELECTOR);
    if (statusNode) {
        statusNode.textContent = text;
        statusNode.setAttribute('data-boot-locked', '1');
    }
}

/** Hide and remove the HTML boot splash after min-dwell + fade. */
export function dismissBootSplash(): void {
    if (typeof document === 'undefined' || dismissScheduled || shouldHoldBootSplash()) {
        return;
    }
    dismissScheduled = true;
    if (forceDismissTimer !== null) {
        window.clearTimeout(forceDismissTimer);
        forceDismissTimer = null;
    }

    const splash = document.getElementById(BOOT_SPLASH_ID);
    if (!splash) {
        return;
    }

    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const delayMs = resolveBootSplashDismissDelayMs(splashShownAtMs, nowMs);

    const hide = () => {
        splash.setAttribute('data-hidden', 'true');
        window.setTimeout(() => {
            splash.remove();
        }, BOOT_SPLASH_FADE_MS);
    };

    if (delayMs > 0) {
        window.setTimeout(hide, delayMs);
    } else {
        hide();
    }
}

/** Force-dismiss the splash if the app never signals ready. */
export function armBootSplashTimeout(timeoutMs = DEFAULT_BOOT_TIMEOUT_MS): void {
    if (typeof window === 'undefined' || forceDismissTimer !== null) {
        return;
    }
    markBootSplashShown();
    forceDismissTimer = window.setTimeout(() => {
        dismissBootSplash();
    }, timeoutMs);
}

/** Test helper — reset module timers/flags between cases. */
export function __resetBootSplashForTests(): void {
    dismissScheduled = false;
    forceDismissTimer = null;
    splashShownAtMs = 0;
}
