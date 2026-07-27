// src/components/visualizer/strategies/VisualStrategyManager.ts
// Visual Strategy Manager - Manages strategy lifecycle and switching
// 视觉策略管理器 - 管理策略生命周期和切换

import * as THREE from 'three';
import type { VisualStrategy, VisualStrategyType, VisualStrategyParams } from '../../../types/visualStrategy';
import type { BeatEvent } from '../../../types/atmosphere';
import type { EmotionTag } from '../../../types/moodEngine';
import { getVisualStrategyForEmotion } from '../../../types/moodEngine';
import {
  advanceAmbientTransitionProgress,
  DEFAULT_AMBIENT_TRANSITION_DURATION,
  resolveAmbientCrossFade,
} from '../../../utils/atmosphere/ambientVisualTransition';
import { dispatchAmbientRhythmEvent } from '../../../utils/atmosphere/ambientVisualRhythm';
import { ParticleStrategy } from './ParticleStrategy';
import { WaveStrategy } from './WaveStrategy';
import { GeometryStrategy } from './GeometryStrategy';

export type VisualStrategyFactory = (params?: VisualStrategyParams) => VisualStrategy;

/**
 * 视觉策略管理器
 * Manages visual strategies and handles transitions
 */
export class VisualStrategyManager {
  private scene: THREE.Scene | null = null;
  private currentStrategy: VisualStrategy | null = null;
  private nextStrategy: VisualStrategy | null = null;

  private transitionProgress = 0;
  private transitionDuration = DEFAULT_AMBIENT_TRANSITION_DURATION;
  private isTransitioning = false;
  private pendingParams: VisualStrategyParams | undefined;

  private strategies: Map<VisualStrategyType, VisualStrategyFactory> = new Map();
  private preloaded = false;

  constructor(factories?: Partial<Record<VisualStrategyType, VisualStrategyFactory>>) {
    this.strategies.set('particle', factories?.particle ?? ((params) => new ParticleStrategy(params)));
    this.strategies.set('wave', factories?.wave ?? ((params) => new WaveStrategy(params)));
    this.strategies.set('geometry', factories?.geometry ?? ((params) => new GeometryStrategy(params)));
  }

  /**
   * 初始化管理器
   * Initialize manager with scene
   */
  init(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * 设置淡入淡出时长（秒）
   */
  setTransitionDuration(durationSec: number): void {
    this.transitionDuration = Math.max(0.05, durationSec);
  }

  getTransitionDuration(): number {
    return this.transitionDuration;
  }

  /**
   * 预注册/预热所有策略工厂，避免首次切换时查找失败
   * Strategies currently build geometry on init; factories are validated here.
   */
  preload(): VisualStrategyType[] {
    const types = Array.from(this.strategies.keys());
    this.preloaded = types.length === 3;
    return types;
  }

  isPreloaded(): boolean {
    return this.preloaded;
  }

  /**
   * 根据情绪切换策略
   */
  switchByEmotion(
    emotion: EmotionTag,
    params?: VisualStrategyParams,
    options?: { force?: boolean },
  ): void {
    const strategyType = getVisualStrategyForEmotion(emotion);
    this.switchStrategy(strategyType, params, options);
  }

  /**
   * 切换视觉策略（cross-fade）
   * @param options.force — remount even when strategy type is unchanged (same-family emotion correction)
   */
  switchStrategy(
    type: VisualStrategyType,
    params?: VisualStrategyParams,
    options?: { force?: boolean },
  ): void {
    if (!this.scene) {
      console.warn('VisualStrategyManager not initialized');
      return;
    }

    if (this.currentStrategy?.name === type && !this.isTransitioning && !options?.force) {
      return;
    }

    // 过渡中切到同一目标：默认保持；force 时打断并用新 params 重挂
    if (this.isTransitioning && this.nextStrategy?.name === type && !options?.force) {
      this.pendingParams = params;
      return;
    }

    const factory = this.strategies.get(type);
    if (!factory) {
      console.warn(`Strategy ${type} not registered yet`);
      return;
    }

    // 打断进行中的过渡：丢弃尚未接管的 next
    if (this.isTransitioning && this.nextStrategy) {
      this.nextStrategy.dispose();
      this.nextStrategy = null;
    }

    this.pendingParams = params;
    this.nextStrategy = factory(params);
    this.nextStrategy.init(this.scene);
    this.nextStrategy.setOpacity(0);

    // 首次激活：无需淡出旧策略
    if (!this.currentStrategy) {
      this.currentStrategy = this.nextStrategy;
      this.nextStrategy = null;
      this.currentStrategy.setOpacity(1);
      this.isTransitioning = false;
      this.transitionProgress = 0;
      return;
    }

    this.isTransitioning = true;
    this.transitionProgress = 0;
  }

  /**
   * 分发节拍事件（自动分级 beat / bar / phrase）
   */
  onRhythmEvent(event: BeatEvent): void {
    if (this.currentStrategy) {
      dispatchAmbientRhythmEvent(this.currentStrategy, event);
    }
    if (this.isTransitioning && this.nextStrategy) {
      dispatchAmbientRhythmEvent(this.nextStrategy, event);
    }
  }

  onBeat(event: BeatEvent): void {
    this.currentStrategy?.onBeat(event);
    if (this.isTransitioning) {
      this.nextStrategy?.onBeat(event);
    }
  }

  onBar(event: BeatEvent): void {
    this.currentStrategy?.onBar(event);
    if (this.isTransitioning) {
      this.nextStrategy?.onBar(event);
    }
  }

  onPhrase(event: BeatEvent): void {
    this.currentStrategy?.onPhrase(event);
    if (this.isTransitioning) {
      this.nextStrategy?.onPhrase(event);
    }
  }

  /**
   * 每帧更新
   */
  update(deltaTime: number): void {
    this.currentStrategy?.update(deltaTime);

    if (this.isTransitioning && this.nextStrategy) {
      this.nextStrategy.update(deltaTime);
      this.transitionProgress = advanceAmbientTransitionProgress(
        this.transitionProgress,
        deltaTime,
        this.transitionDuration,
      );

      if (this.transitionProgress >= 1) {
        this.completeTransition();
      } else {
        const { fadeOut, fadeIn } = resolveAmbientCrossFade(this.transitionProgress);
        this.currentStrategy?.setOpacity(fadeOut);
        this.nextStrategy.setOpacity(fadeIn);
      }
    }
  }

  private completeTransition(): void {
    if (this.currentStrategy) {
      this.currentStrategy.dispose();
    }

    this.currentStrategy = this.nextStrategy;
    this.nextStrategy = null;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.pendingParams = undefined;

    if (this.currentStrategy) {
      this.currentStrategy.setOpacity(1);
    }
  }

  getCurrentStrategyType(): VisualStrategyType | null {
    return this.currentStrategy?.name ?? null;
  }

  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  getTransitionProgress(): number {
    return this.transitionProgress;
  }

  dispose(): void {
    this.currentStrategy?.dispose();
    this.nextStrategy?.dispose();
    this.currentStrategy = null;
    this.nextStrategy = null;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.scene = null;
  }
}
