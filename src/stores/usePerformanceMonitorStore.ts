import { create } from 'zustand';
import type { GeometricQualityTier } from '../components/visualizer/geometric/geometricQuality';
import { resolveGeometricQualityProfile } from '../components/visualizer/geometric/geometricQuality';
import type { PerformanceMemorySample, PerformanceMode } from '../types/performance';
import { parsePerformanceMode } from '../utils/performance/performanceMonitorMath';

// src/stores/usePerformanceMonitorStore.ts
// Persisted performance mode + throttled live FPS/memory snapshot.

export const PERFORMANCE_MODE_STORAGE_KEY = 'lyra_performance_mode';
export const PERFORMANCE_HUD_STORAGE_KEY = 'lyra_performance_hud';

const readStoredMode = (): PerformanceMode => {
  if (typeof window === 'undefined') return 'auto';
  return parsePerformanceMode(localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY));
};

// HUD 默认仅在 dev 显示；用户手动切换后以 localStorage 记忆为准。
const readStoredShowHud = (): boolean => {
  const devDefault = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
  if (typeof window === 'undefined') return devDefault;
  const stored = localStorage.getItem(PERFORMANCE_HUD_STORAGE_KEY);
  if (stored === '1') return true;
  if (stored === '0') return false;
  return devDefault;
};

const deviceBaseline = (): GeometricQualityTier => resolveGeometricQualityProfile().tier;

interface PerformanceMonitorState {
  mode: PerformanceMode;
  /** Device-suggested ceiling used when mode === 'auto'. */
  baselineTier: GeometricQualityTier;
  /** Live ladder tier while auto-adapting (ignored when mode is fixed). */
  autoTier: GeometricQualityTier;
  /** Resolved tier consumers should apply. */
  effectiveTier: GeometricQualityTier;
  fpsInstant: number;
  fpsAvg: number;
  fpsMin: number;
  memory: PerformanceMemorySample | null;
  memoryWarning: boolean;
  autoDegraded: boolean;
  showHud: boolean;

  setMode: (mode: PerformanceMode) => void;
  setAutoTier: (tier: GeometricQualityTier) => void;
  publishStats: (stats: {
    fpsInstant: number;
    fpsAvg: number;
    fpsMin: number;
    memory: PerformanceMemorySample | null;
    memoryWarning: boolean;
  }) => void;
  setShowHud: (show: boolean) => void;
}

const initialMode = readStoredMode();
const baseline = deviceBaseline();

export const usePerformanceMonitorStore = create<PerformanceMonitorState>((set, get) => ({
  mode: initialMode,
  baselineTier: baseline,
  autoTier: baseline,
  effectiveTier: initialMode === 'auto' ? baseline : initialMode,
  fpsInstant: 0,
  fpsAvg: 60,
  fpsMin: 60,
  memory: null,
  memoryWarning: false,
  autoDegraded: false,
  showHud: readStoredShowHud(),

  setMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, mode);
    }
    const { baselineTier, autoTier } = get();
    const effectiveTier = mode === 'auto' ? autoTier : mode;
    set({
      mode,
      effectiveTier,
      autoDegraded: mode === 'auto' && tierIsBelow(autoTier, baselineTier),
    });
  },

  setAutoTier: (tier) => {
    const { mode, baselineTier } = get();
    set({
      autoTier: tier,
      effectiveTier: mode === 'auto' ? tier : get().effectiveTier,
      autoDegraded: mode === 'auto' && tierIsBelow(tier, baselineTier),
    });
  },

  publishStats: (stats) => {
    const prev = get();
    if (
      Math.abs(prev.fpsAvg - stats.fpsAvg) < 0.4
      && Math.abs(prev.fpsInstant - stats.fpsInstant) < 1.5
      && prev.memoryWarning === stats.memoryWarning
      && (prev.memory?.usedMb ?? 0) === (stats.memory?.usedMb ?? 0)
    ) {
      return;
    }
    set({
      fpsInstant: stats.fpsInstant,
      fpsAvg: stats.fpsAvg,
      fpsMin: stats.fpsMin,
      memory: stats.memory,
      memoryWarning: stats.memoryWarning,
    });
  },

  setShowHud: (show) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PERFORMANCE_HUD_STORAGE_KEY, show ? '1' : '0');
    }
    set({ showHud: show });
  },
}));

function tierIsBelow(a: GeometricQualityTier, b: GeometricQualityTier): boolean {
  const order = { lite: 0, balanced: 1, high: 2 };
  return order[a] < order[b];
}
