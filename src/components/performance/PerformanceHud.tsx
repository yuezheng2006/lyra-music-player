import React from 'react';
import { usePerformanceMonitorStore } from '../../stores/usePerformanceMonitorStore';

// src/components/performance/PerformanceHud.tsx
// Dev-only corner HUD for FPS / tier / memory (Ticket 10).

/**
 * Compact live performance readout. Hidden unless showHud is on (defaults to DEV).
 */
export function PerformanceHud(): React.ReactElement | null {
  const showHud = usePerformanceMonitorStore((s) => s.showHud);
  const fpsAvg = usePerformanceMonitorStore((s) => s.fpsAvg);
  const fpsMin = usePerformanceMonitorStore((s) => s.fpsMin);
  const effectiveTier = usePerformanceMonitorStore((s) => s.effectiveTier);
  const mode = usePerformanceMonitorStore((s) => s.mode);
  const memory = usePerformanceMonitorStore((s) => s.memory);
  const memoryWarning = usePerformanceMonitorStore((s) => s.memoryWarning);
  const autoDegraded = usePerformanceMonitorStore((s) => s.autoDegraded);

  if (!showHud) return null;

  return (
    <div
      data-testid="performance-hud"
      className="pointer-events-none fixed bottom-3 left-3 z-[160] rounded-lg border border-white/15 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-white/85 backdrop-blur-md"
      aria-hidden
    >
      <div>
        FPS {fpsAvg.toFixed(0)}
        <span className="text-white/45"> · min {fpsMin.toFixed(0)}</span>
      </div>
      <div>
        {mode}/{effectiveTier}
        {autoDegraded ? <span className="text-amber-300"> · degraded</span> : null}
      </div>
      {memory ? (
        <div className={memoryWarning ? 'text-amber-300' : undefined}>
          heap {memory.usedMb.toFixed(0)}
          {memory.limitMb != null ? `/${memory.limitMb.toFixed(0)}` : ''}
          {' '}
          MB
        </div>
      ) : null}
    </div>
  );
}
