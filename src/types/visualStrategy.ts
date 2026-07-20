// src/types/visualStrategy.ts
// Visual Strategy Interface - Base interface for all visual strategies
// 视觉策略接口 - 所有视觉策略的基础接口

import type { BeatEvent } from './atmosphere';
import type * as THREE from 'three';

/**
 * 视觉策略类型
 * Visual strategy types
 */
export type VisualStrategyType = 'particle' | 'wave' | 'geometry';

/**
 * 视觉策略接口
 * Base interface for visual strategies
 *
 * 每个策略负责一种视觉效果，响应节拍事件并更新视觉表现
 */
export interface VisualStrategy {
  /** 策略名称 */
  readonly name: VisualStrategyType;

  /**
   * 初始化策略
   * @param scene Three.js scene to add objects to
   */
  init(scene: THREE.Scene): void;

  /**
   * 节拍点回调
   * Called on every beat
   * @param event Beat event with strength and timing info
   */
  onBeat(event: BeatEvent): void;

  /**
   * 小节回调
   * Called on every bar (typically 4 beats)
   * @param event Beat event
   */
  onBar(event: BeatEvent): void;

  /**
   * 乐句回调
   * Called on phrase boundaries
   * @param event Beat event
   */
  onPhrase(event: BeatEvent): void;

  /**
   * 每帧更新
   * Called every frame
   * @param deltaTime Time since last frame in seconds
   */
  update(deltaTime: number): void;

  /**
   * 清理资源
   * Dispose and clean up resources
   */
  dispose(): void;

  /**
   * 设置可见性
   * Set visibility (for fade in/out)
   * @param opacity 0-1
   */
  setOpacity(opacity: number): void;
}

/**
 * 视觉策略参数
 * Visual strategy parameters
 */
export interface VisualStrategyParams {
  /** 速度倍数 */
  speed?: number;
  /** 强度倍数 */
  intensity?: number;
  /** 颜色基调 */
  colorTone?: 'bright' | 'dark' | 'neutral';
  /** 粒子数量（仅 particle 策略） */
  particleCount?: number;
}
