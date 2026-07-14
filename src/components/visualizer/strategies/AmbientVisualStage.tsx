import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CSSProperties, MutableRefObject } from 'react';
import type { BeatMap } from '../../../types/atmosphere';
import { VisualStrategyManager } from './VisualStrategyManager';
import { useAmbientVisualController } from '../../../hooks/atmosphere/useAmbientVisualController';
import { useAmbientVisualStore } from '../../../stores/useAmbientVisualStore';
import { useMoodEngineStore } from '../../../stores/useMoodEngineStore';

// src/components/visualizer/strategies/AmbientVisualStage.tsx
// Hosts a Three.js scene for ambient VisualStrategyManager + mood/beat bridge.

type AmbientVisualStageProps = {
  /** Shared atmosphere BeatMap ref (from useAtmosphereEngine). */
  beatMapRef?: MutableRefObject<BeatMap | null>;
  /** Audio element for currentTime; optional — rhythm idle without it. */
  audioRef?: MutableRefObject<HTMLAudioElement | null>;
  className?: string;
  style?: CSSProperties;
};

/**
 * Lightweight ambient visual canvas. Mount when ambient layer is enabled.
 * Does not replace geometric cover-particle runtime; sits alongside as Ambient Layer.
 */
export function AmbientVisualStage({
  beatMapRef,
  audioRef,
  className,
  style,
}: AmbientVisualStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const managerRef = useRef<VisualStrategyManager | null>(null);
  const enabled = useAmbientVisualStore((s) => s.enabled);

  const { tickAmbientRhythm, resetRhythmCursor } = useAmbientVisualController({
    managerRef,
    beatMapRef,
    enabled,
  });

  const tickRef = useRef(tickAmbientRhythm);
  tickRef.current = tickAmbientRhythm;
  const audioHolder = useRef(audioRef);
  audioHolder.current = audioRef;

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const manager = new VisualStrategyManager();
    manager.init(scene);
    manager.preload();
    const emotion = useMoodEngineStore.getState().currentEmotion;
    if (emotion) {
      manager.switchByEmotion(emotion.emotion);
    } else {
      manager.switchStrategy('geometry');
    }
    managerRef.current = manager;

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || canvas.clientWidth || 1;
      const height = parent?.clientHeight || canvas.clientHeight || 1;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null;
    if (canvas.parentElement && observer) observer.observe(canvas.parentElement);

    let raf = 0;
    let lastTs = performance.now();

    const frame = (ts: number) => {
      const dt = Math.min(0.08, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;

      const currentTime = audioHolder.current?.current?.currentTime ?? 0;
      tickRef.current(currentTime, dt);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      resetRhythmCursor();
      manager.dispose();
      renderer.dispose();
      managerRef.current = null;
    };
  }, [enabled, resetRhythmCursor]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden
    />
  );
}
