import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MotionValue } from 'framer-motion';
import { CharacterRuntime } from './CharacterRuntime';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { usePerformanceMonitorStore } from '../../stores/usePerformanceMonitorStore';
import { useCharacterRhythmDriver } from '../../hooks/atmosphere/useCharacterRhythmDriver';

// src/components/character/CharacterStage.tsx
// Independent Character Layer canvas (alpha, above Ambient Visual).

type CharacterStageProps = {
  className?: string;
  style?: CSSProperties;
  /** Override model URL; defaults to store modelUrl. */
  modelUrl?: string;
  /** Pause skeletal animation; layer stays mounted and still renders. */
  paused?: boolean;
  /** Optional lyric/audio clock for beat-map driven rhythm. */
  currentTime?: MotionValue<number> | null;
};

/**
 * Transparent WebGL character layer. Mount above ambient / geometric layers.
 */
export function CharacterStage({
  className,
  style,
  modelUrl: modelUrlProp,
  paused = false,
  currentTime = null,
}: CharacterStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<CharacterRuntime | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Read MotionValue from a ref so mount effect does not tear down WebGL on identity churn.
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const [hovered, setHovered] = useState(false);

  const enabled = useCharacterStore((s) => s.enabled);
  const storeModelUrl = useCharacterStore((s) => s.modelUrl);
  const bpm = useCharacterStore((s) => s.bpm);
  const setStatus = useCharacterStore((s) => s.setStatus);
  const setClips = useCharacterStore((s) => s.setClips);
  const setPlayback = useCharacterStore((s) => s.setPlayback);
  const performanceTier = usePerformanceMonitorStore((s) => s.effectiveTier);

  const modelUrl = modelUrlProp ?? storeModelUrl;

  const { tickCharacterRhythm, resetCharacterRhythm } = useCharacterRhythmDriver({
    runtimeRef,
    currentTime,
    enabled: enabled && !paused,
  });

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const runtime = new CharacterRuntime({
      onStatus: (status, error) => setStatus(status, error ?? null),
      onClips: (names) => setClips(names),
      // Discrete UI mirror only — beat accents must not flood this path.
      onPlayback: (state, clipName, actionId) => setPlayback(state, clipName, actionId),
      onHoverChange: (next) => setHovered(next),
    });
    runtime.mount(canvas);
    runtime.setQualityTier(performanceTier);
    runtimeRef.current = runtime;

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || canvas.clientWidth || 1;
      const height = parent?.clientHeight || canvas.clientHeight || 1;
      runtime.resize(width, height);
    };
    resize();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null;
    if (canvas.parentElement && observer) observer.observe(canvas.parentElement);

    /** Map client point → canvas NDC for raycasting. */
    const toNdc = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return { x: 2, y: 2 };
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((clientY - rect.top) / rect.height) * 2 - 1),
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { x, y } = toNdc(event.clientX, event.clientY);
      runtime.setPointerNdc(x, y);
    };
    const onPointerLeave = () => {
      runtime.clearPointer();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const { x, y } = toNdc(event.clientX, event.clientY);
      runtime.setPointerNdc(x, y, true);
      if (runtime.handlePointerClick()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerdown', onPointerDown);

    let raf = 0;
    let lastTs = performance.now();
    const frame = (ts: number) => {
      const dt = Math.min(0.08, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;
      const clock = currentTimeRef.current?.get() ?? 0;
      tickCharacterRhythm(clock);
      runtime.update(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    void runtime.load(modelUrl).then(() => {
      if (pausedRef.current) runtime.pause();
    });

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      resetCharacterRhythm();
      runtime.dispose();
      runtimeRef.current = null;
      setHovered(false);
      setStatus('idle');
    };
  }, [
    enabled,
    modelUrl,
    resetCharacterRhythm,
    setClips,
    setPlayback,
    setStatus,
    tickCharacterRhythm,
  ]);

  useEffect(() => {
    runtimeRef.current?.setQualityTier(performanceTier);
  }, [performanceTier]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !enabled) return;
    if (paused) runtime.pause();
    else if (runtime.getPlaybackState() === 'paused') runtime.resume();
  }, [enabled, paused]);

  useEffect(() => {
    runtimeRef.current?.setBpm(bpm);
  }, [bpm]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-testid="character-stage"
      data-hovered={hovered ? 'true' : 'false'}
      title={hovered ? 'Click the companion' : undefined}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: hovered ? 'pointer' : 'default',
        zIndex: 2,
        ...style,
      }}
      aria-hidden
    />
  );
}
