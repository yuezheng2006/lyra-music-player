import { describe, expect, it } from 'vitest';
import {
  createFpsTracker,
  isMemoryPressureHigh,
  parsePerformanceMode,
  pushFpsSample,
  resolveEffectivePerformanceTier,
  shouldHoldDegrade,
  shouldHoldUpgrade,
  stepTierDown,
  stepTierUp,
} from '@/utils/performance/performanceMonitorMath';

// test/unit/performance/performanceMonitorMath.test.ts

describe('performanceMonitorMath', () => {
  it('tracks rolling fps avg/min', () => {
    const tracker = createFpsTracker(5);
    pushFpsSample(tracker, 1 / 60);
    pushFpsSample(tracker, 1 / 30);
    expect(tracker.instant).toBeCloseTo(30, 0);
    expect(tracker.avg).toBeGreaterThan(30);
    expect(tracker.min).toBeLessThanOrEqual(tracker.avg);
  });

  it('steps quality tiers within the auto ceiling', () => {
    expect(stepTierDown('high')).toBe('balanced');
    expect(stepTierDown('lite')).toBe('lite');
    expect(stepTierUp('lite', 'balanced')).toBe('balanced');
    expect(stepTierUp('balanced', 'balanced')).toBe('balanced');
  });

  it('resolves effective tier from mode', () => {
    expect(resolveEffectivePerformanceTier('high', 'balanced', 'lite')).toBe('high');
    expect(resolveEffectivePerformanceTier('auto', 'high', 'lite')).toBe('lite');
  });

  it('holds degrade/upgrade against thresholds', () => {
    expect(shouldHoldDegrade(20, 3, 2.5)).toBe(true);
    expect(shouldHoldDegrade(30, 3, 2.5)).toBe(false);
    expect(shouldHoldUpgrade(55, 9, 8)).toBe(true);
    expect(shouldHoldUpgrade(40, 9, 8)).toBe(false);
  });

  it('parses mode and memory pressure', () => {
    expect(parsePerformanceMode('lite')).toBe('lite');
    expect(parsePerformanceMode('nope')).toBe('auto');
    expect(isMemoryPressureHigh({ usedMb: 900, limitMb: 1000 })).toBe(true);
    expect(isMemoryPressureHigh({ usedMb: 100, limitMb: 1000 })).toBe(false);
  });
});
