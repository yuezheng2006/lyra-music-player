// src/utils/performance/startupRedlineBudgets.ts
// Hard budgets for cold-start / interactive3d readiness. CI must fail if exceeded.

/** Shell must emit `boot.ready` under this wall time (ms from module load). */
export const BOOT_READY_REDLINE_MS = 8_000;

/**
 * React Bits effect must emit `reactbits.first_frame` under this time (ms from effect mount).
 * The Particles hang (stall @ frameCount=0) blew past this forever — that is the red line.
 */
export const REACTBITS_FIRST_FRAME_REDLINE_MS = 4_000;

/**
 * After stage mount, a `reactbits.stall` with frameCount=0 past this age is a hard fail.
 * Watchdog fires at 1500ms; allow one tick of slack then fail.
 */
export const REACTBITS_ZERO_FRAME_STALL_REDLINE_MS = 2_500;
