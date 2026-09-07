import { describe, expect, it } from 'vitest';
import {
    BOOT_READY_REDLINE_MS,
    REACTBITS_FIRST_FRAME_REDLINE_MS,
    REACTBITS_ZERO_FRAME_STALL_REDLINE_MS,
} from '@/utils/performance/startupRedlineBudgets';

// test/unit/performance/startupRedlineBudgets.test.ts
// Keep startup red-line budgets tight enough to catch hangs, not polish regressions.

describe('startupRedlineBudgets', () => {
    it('keeps boot / first-frame budgets under hard hang thresholds', () => {
        expect(BOOT_READY_REDLINE_MS).toBeLessThanOrEqual(8_000);
        expect(REACTBITS_FIRST_FRAME_REDLINE_MS).toBeLessThanOrEqual(4_000);
        expect(REACTBITS_ZERO_FRAME_STALL_REDLINE_MS).toBeLessThanOrEqual(2_500);
        expect(REACTBITS_ZERO_FRAME_STALL_REDLINE_MS).toBeLessThan(REACTBITS_FIRST_FRAME_REDLINE_MS);
    });
});
