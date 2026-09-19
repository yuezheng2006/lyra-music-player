import { useEffect } from 'react';
import { usePerformanceMonitorStore } from '../stores/usePerformanceMonitorStore';
import { useSettingsUiStore } from '../stores/useSettingsUiStore';
import {
  createFpsTracker,
  isMemoryPressureHigh,
  PERFORMANCE_DEGRADE_HOLD_SEC,
  PERFORMANCE_FPS_SAMPLE_STRIDE,
  PERFORMANCE_STORE_PUBLISH_MS,
  PERFORMANCE_UPGRADE_HOLD_SEC,
  pushFpsSample,
  readPerformanceMemorySample,
  shouldHoldDegrade,
  shouldHoldUpgrade,
  shouldRunPerformanceFpsSampler,
  stepTierDown,
  stepTierUp,
} from '../utils/performance/performanceMonitorMath';
import { startDevTelemetryDump } from '../utils/telemetry/devTelemetryDump';
import { installTelemetryDevBridge } from '../utils/telemetry/installTelemetryDevBridge';
import { trackTelemetry } from '../utils/telemetry/trackTelemetry';

// src/hooks/usePerformanceMonitor.ts
// Optional FPS sampler + auto tier ladder. GPU demote handler always stays armed.

const PERF_FPS_TELEMETRY_MIN_INTERVAL_MS = 5000;
const PERF_FPS_TELEMETRY_LOW_AVG = 40;

/**
 * Mount once near the app root.
 * FPS RAF runs only when HUD is on or performance mode is auto; GPU crash demote always listens.
 */
export function usePerformanceMonitor(): void {
  useEffect(() => {
    (globalThis as { __LYRA_PERF_STORE__?: typeof usePerformanceMonitorStore }).__LYRA_PERF_STORE__ =
      usePerformanceMonitorStore;
    installTelemetryDevBridge();
    return startDevTelemetryDump();
  }, []);

  const showHud = usePerformanceMonitorStore((state) => state.showHud);
  const mode = usePerformanceMonitorStore((state) => state.mode);
  const runFpsSampler = shouldRunPerformanceFpsSampler({ showHud, mode });

  useEffect(() => {
    if (!runFpsSampler) return undefined;

    const tracker = createFpsTracker(90);
    let raf = 0;
    let frameCounter = 0;
    let lastTs = performance.now();
    let lastPublish = 0;
    let lastFpsTelemetryAt = 0;
    let lowHoldSec = 0;
    let highHoldSec = 0;
    let memoryTick = 0;

    const frame = (ts: number) => {
      const dt = Math.min(0.08, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;
      frameCounter += 1;
      // Keep per-frame dt for accurate FPS; only run ladder/publish on stride.
      pushFpsSample(tracker, dt);
      if (frameCounter % PERFORMANCE_FPS_SAMPLE_STRIDE !== 0) {
        raf = requestAnimationFrame(frame);
        return;
      }

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
            trackTelemetry('perf.tier_change', {
              level: 'warn',
              data: { from: state.autoTier, to: next, reason: 'degrade', fpsAvg: Math.round(tracker.avg) },
            });
            state.setAutoTier(next);
            lowHoldSec = 0;
          }
        } else if (shouldHoldUpgrade(tracker.avg, highHoldSec, PERFORMANCE_UPGRADE_HOLD_SEC)) {
          const next = stepTierUp(state.autoTier, state.baselineTier);
          if (next !== state.autoTier) {
            trackTelemetry('perf.tier_change', {
              data: { from: state.autoTier, to: next, reason: 'upgrade', fpsAvg: Math.round(tracker.avg) },
            });
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

        if (
          tracker.avg < PERF_FPS_TELEMETRY_LOW_AVG
          && ts - lastFpsTelemetryAt >= PERF_FPS_TELEMETRY_MIN_INTERVAL_MS
        ) {
          lastFpsTelemetryAt = ts;
          const live = usePerformanceMonitorStore.getState();
          trackTelemetry('perf.fps', {
            level: 'warn',
            data: {
              fpsAvg: Math.round(tracker.avg),
              fpsMin: Math.round(tracker.min),
              tier: live.effectiveTier,
              mode: live.mode,
              memoryWarning: isMemoryPressureHigh(memory),
            },
          });
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [runFpsSampler]);

  useEffect(() => {
    const onGpuGone = window.electron?.onGpuProcessGone;
    if (!onGpuGone) return undefined;

    // Visual-only recovery: demote backgrounds / tier. Never pause audio or
    // tear down media clocks — playback isolation is the hard floor.
    return onGpuGone((payload) => {
      trackTelemetry('gpu.process_gone', {
        level: 'error',
        data: {
          reason: payload?.reason ?? null,
          exitCode: payload?.exitCode ?? null,
          count: payload?.count ?? null,
        },
      });
      usePerformanceMonitorStore.getState().setMode('lite');
      useSettingsUiStore.getState().forceSafeVisualizerBackgroundAfterGpuCrash();
      if (import.meta.env?.DEV) {
        console.warn('[gpu] process gone — visual demote only; media clocks keep running', payload);
      }
      // Main process reloads the window after repeated crashes if the renderer is wedged.
    });
  }, []);
}
