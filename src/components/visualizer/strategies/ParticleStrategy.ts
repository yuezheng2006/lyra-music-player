// src/components/visualizer/strategies/ParticleStrategy.ts
// Particle Strategy - Visual effect using particle systems
// 粒子策略 - 使用粒子系统的视觉效果

import * as THREE from 'three';
import type { VisualStrategy, VisualStrategyParams } from '../../../types/visualStrategy';
import type { BeatEvent } from '../../../types/atmosphere';
import type { EmotionTag } from '../../../types/moodEngine';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

/**
 * 粒子策略 - 快乐/激昂情绪的视觉效果
 * Particle strategy for happy/energetic emotions
 */
export class ParticleStrategy implements VisualStrategy {
  readonly name = 'particle' as const;

  private scene: THREE.Scene | null = null;
  private particles: Particle[] = [];
  private particleSystem: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;

  private maxParticles = 1000;
  private particlePool: Particle[] = [];
  private activeParticles: Particle[] = [];

  private opacity = 1.0;
  private emotion: EmotionTag = 'happy';
  private params: VisualStrategyParams;

  constructor(params: VisualStrategyParams = {}) {
    this.params = {
      speed: params.speed ?? 1.0,
      intensity: params.intensity ?? 1.0,
      colorTone: params.colorTone ?? 'bright',
      particleCount: params.particleCount ?? 1000,
    };

    this.maxParticles = this.params.particleCount!;
    this.initializeParticlePool();
  }

  /**
   * 初始化粒子对象池
   * Initialize particle object pool
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  /**
   * 创建一个粒子
   * Create a particle
   */
  private createParticle(): Particle {
    return {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0,
      maxLife: 1,
      size: 1,
      color: new THREE.Color(1, 1, 1),
    };
  }

  /**
   * 从对象池获取粒子
   * Get particle from pool
   */
  private getParticle(): Particle | null {
    if (this.particlePool.length === 0) return null;
    const particle = this.particlePool.pop()!;
    this.activeParticles.push(particle);
    return particle;
  }

  /**
   * 回收粒子到对象池
   * Return particle to pool
   */
  private recycleParticle(particle: Particle): void {
    const index = this.activeParticles.indexOf(particle);
    if (index > -1) {
      this.activeParticles.splice(index, 1);
      this.particlePool.push(particle);
    }
  }

  init(scene: THREE.Scene): void {
    this.scene = scene;

    // 创建粒子几何体
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建粒子材质
    this.material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: this.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // 创建粒子系统
    this.particleSystem = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particleSystem);
  }

  /**
   * 发射粒子
   * Emit particles
   */
  private emitParticles(count: number, position: THREE.Vector3, strength: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      // 根据情绪调整粒子属性
      const speedMultiplier = this.emotion === 'energetic' ? 2.0 : 1.0;
      const spreadMultiplier = this.emotion === 'energetic' ? 1.5 : 1.0;

      // 设置位置
      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 0.5 * spreadMultiplier;
      particle.position.z += (Math.random() - 0.5) * 0.5 * spreadMultiplier;

      // 设置速度（向上为主，带随机扩散）
      particle.velocity.set(
        (Math.random() - 0.5) * 0.5 * spreadMultiplier,
        (0.5 + Math.random() * 0.5) * speedMultiplier * this.params.speed!,
        (Math.random() - 0.5) * 0.3 * spreadMultiplier,
      );

      particle.velocity.multiplyScalar(strength);

      // 设置生命周期
      particle.maxLife = 1.0 + Math.random() * 1.0;
      particle.life = particle.maxLife;

      // 设置大小
      particle.size = 0.02 + Math.random() * 0.03;

      // 设置颜色（根据情绪）
      particle.color = this.getEmotionColor();
    }
  }

  /**
   * 根据情绪获取颜色
   * Get color based on emotion
   */
  private getEmotionColor(): THREE.Color {
    if (this.emotion === 'happy') {
      // 快乐：明亮的黄色、橙色、粉色
      const colors = [
        new THREE.Color(1.0, 0.9, 0.2),  // 明黄
        new THREE.Color(1.0, 0.6, 0.2),  // 橙色
        new THREE.Color(1.0, 0.7, 0.8),  // 粉色
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    } else if (this.emotion === 'energetic') {
      // 激昂：强烈的红色、橙红、紫色
      const colors = [
        new THREE.Color(1.0, 0.2, 0.2),  // 红色
        new THREE.Color(1.0, 0.3, 0.0),  // 橙红
        new THREE.Color(0.8, 0.2, 1.0),  // 紫色
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    } else {
      // 默认：中性白色
      return new THREE.Color(1.0, 1.0, 1.0);
    }
  }

  onBeat(event: BeatEvent): void {
    // 节拍点：小幅粒子脉冲
    const strength = event.strength || 0.5;
    const count = Math.floor(10 * this.params.intensity! * strength);

    // 在中心位置发射粒子
    this.emitParticles(count, new THREE.Vector3(0, -1, 0), strength);
  }

  onBar(event: BeatEvent): void {
    // 小节：中等规模的粒子爆发
    const strength = event.strength || 0.7;
    const count = Math.floor(20 * this.params.intensity! * strength);

    // 多个位置同时发射
    const positions = [
      new THREE.Vector3(-0.5, -1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0.5, -1, 0),
    ];

    positions.forEach(pos => {
      this.emitParticles(count / 3, pos, strength);
    });
  }

  onPhrase(event: BeatEvent): void {
    // 乐句：大规模的粒子爆炸效果
    const strength = event.strength || 1.0;
    const count = Math.floor(50 * this.params.intensity! * strength);

    // 环形发射
    const radius = 0.8;
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        -1,
        Math.sin(angle) * radius,
      );
      this.emitParticles(count / steps, pos, strength * 1.5);
    }
  }

  update(deltaTime: number): void {
    if (!this.geometry) return;

    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;

    // 更新所有活跃粒子
    let writeIndex = 0;
    const particlesToRecycle: Particle[] = [];

    for (const particle of this.activeParticles) {
      // 更新生命周期
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        particlesToRecycle.push(particle);
        continue;
      }

      // 更新位置
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime),
      );

      // 应用重力（轻微下拉）
      particle.velocity.y -= 0.5 * deltaTime;

      // 写入几何体
      positions[writeIndex * 3] = particle.position.x;
      positions[writeIndex * 3 + 1] = particle.position.y;
      positions[writeIndex * 3 + 2] = particle.position.z;

      colors[writeIndex * 3] = particle.color.r;
      colors[writeIndex * 3 + 1] = particle.color.g;
      colors[writeIndex * 3 + 2] = particle.color.b;

      // 生命周期淡出
      const lifeFactor = particle.life / particle.maxLife;
      sizes[writeIndex] = particle.size * lifeFactor;

      writeIndex++;
    }

    // 回收死亡粒子
    particlesToRecycle.forEach(p => this.recycleParticle(p));

    // 更新几何体
    this.geometry.setDrawRange(0, writeIndex);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    if (this.material) {
      this.material.opacity = opacity;
    }
  }

  /**
   * 设置情绪（用于调整粒子行为）
   * Set emotion to adjust particle behavior
   */
  setEmotion(emotion: EmotionTag): void {
    this.emotion = emotion;
  }

  dispose(): void {
    if (this.particleSystem && this.scene) {
      this.scene.remove(this.particleSystem);
    }

    if (this.geometry) {
      this.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    this.activeParticles = [];
    this.particlePool = [];
    this.scene = null;
  }
}
