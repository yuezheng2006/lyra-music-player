import { useEffect } from 'react';
import { usePerformanceMonitorStore } from '../stores/usePerformanceMonitorStore';
import {
  createFpsTracker,
  isMemoryPressureHigh,
  PERFORMANCE_DEGRADE_HOLD_SEC,
  PERFORMANCE_STORE_PUBLISH_MS,
  PERFORMANCE_UPGRADE_HOLD_SEC,
  pushFpsSample,
  readPerformanceMemorySample,
  shouldHoldDegrade,
  shouldHoldUpgrade,
  stepTierDown,
  stepTierUp,
} from '../utils/performance/performanceMonitorMath';

// src/hooks/usePerformanceMonitor.ts
// Global RAF FPS sampler + auto tier ladder (store updates are throttled).

/**
 * Mount once near the app root. Samples FPS every frame; publishes to Zustand ~2Hz.
 */
export function usePerformanceMonitor(): void {
  useEffect(() => {
    const tracker = createFpsTracker(90);
    let raf = 0;
    let lastTs = performance.now();
    let lastPublish = 0;
    let lowHoldSec = 0;
    let highHoldSec = 0;
    let memoryTick = 0;

    const frame = (ts: number) => {
      const dt = Math.min(0.08, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;
      pushFpsSample(tracker, dt);

      const state = usePerformanceMonitorStore.getState();
      if (state.mode === 'auto') {
        if (tracker.avg < 25) {
          lowHoldSec += dt;
          highHoldSec = 0;
        } else if (tracker.avg > 50) {
          highHoldSec += dt;
          lowHoldSec = 0;
        } else {
          lowHoldSec = 0;
          highHoldSec = 0;
        }

        if (shouldHoldDegrade(tracker.avg, lowHoldSec, PERFORMANCE_DEGRADE_HOLD_SEC)) {
          const next = stepTierDown(state.autoTier);
          if (next !== state.autoTier) {
            state.setAutoTier(next);
            lowHoldSec = 0;
          }
        } else if (shouldHoldUpgrade(tracker.avg, highHoldSec, PERFORMANCE_UPGRADE_HOLD_SEC)) {
          const next = stepTierUp(state.autoTier, state.baselineTier);
          if (next !== state.autoTier) {
            state.setAutoTier(next);
            highHoldSec = 0;
          }
        }
      }

      if (ts - lastPublish >= PERFORMANCE_STORE_PUBLISH_MS) {
        lastPublish = ts;
        memoryTick += 1;
        const memory = memoryTick % 4 === 0 ? readPerformanceMemorySample() : state.memory;
        usePerformanceMonitorStore.getState().publishStats({
          fpsInstant: tracker.instant,
          fpsAvg: tracker.avg,
          fpsMin: tracker.min,
          memory,
          memoryWarning: isMemoryPressureHigh(memory),
        });
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
}
