// src/components/visualizer/strategies/GeometryStrategy.ts
// Geometry Strategy - Visual effect using geometric shapes
// 几何策略 - 使用几何图形的视觉效果

import * as THREE from 'three';
import type { VisualStrategy, VisualStrategyParams } from '../../../types/visualStrategy';
import type { BeatEvent } from '../../../types/atmosphere';
import type { EmotionTag } from '../../../types/moodEngine';

interface GeometricShape {
  mesh: THREE.Mesh;
  baseScale: number;
  rotationSpeed: THREE.Vector3;
  pulseFactor: number;
  pulseDecay: number;
}

/**
 * 几何策略 - 默认/中性情绪的视觉效果
 * Geometry strategy for neutral/default emotions
 */
export class GeometryStrategy implements VisualStrategy {
  readonly name = 'geometry' as const;

  private scene: THREE.Scene | null = null;
  private shapes: GeometricShape[] = [];
  private group: THREE.Group | null = null;

  private opacity = 1.0;
  private emotion: EmotionTag = 'neutral';
  private params: VisualStrategyParams;

  constructor(params: VisualStrategyParams = {}) {
    this.params = {
      speed: params.speed ?? 1.0,
      intensity: params.intensity ?? 1.0,
      colorTone: params.colorTone ?? 'neutral',
    };
  }

  init(scene: THREE.Scene): void {
    this.scene = scene;
    this.group = new THREE.Group();

    // 创建多个几何体
    this.createGeometricShapes();

    this.scene.add(this.group);
  }

  /**
   * 创建几何图形
   * Create geometric shapes
   */
  private createGeometricShapes(): void {
    if (!this.group) return;

    const shapeConfigs = [
      {
        geometry: new THREE.IcosahedronGeometry(0.5, 0),
        position: new THREE.Vector3(0, 0, -1),
        baseScale: 1.0,
        rotationSpeed: new THREE.Vector3(0.2, 0.3, 0.1),
      },
      {
        geometry: new THREE.TorusGeometry(0.4, 0.15, 8, 12),
        position: new THREE.Vector3(-1.2, 0.5, -1.5),
        baseScale: 0.8,
        rotationSpeed: new THREE.Vector3(0.1, 0.4, 0.2),
      },
      {
        geometry: new THREE.OctahedronGeometry(0.4, 0),
        position: new THREE.Vector3(1.2, -0.5, -1.5),
        baseScale: 0.9,
        rotationSpeed: new THREE.Vector3(0.3, 0.2, 0.3),
      },
    ];

    for (const config of shapeConfigs) {
      const material = new THREE.MeshBasicMaterial({
        color: this.getEmotionColor(),
        wireframe: true,
        transparent: true,
        opacity: this.opacity * 0.6,
      });

      const mesh = new THREE.Mesh(config.geometry, material);
      mesh.position.copy(config.position);
      mesh.scale.setScalar(config.baseScale);

      this.group.add(mesh);

      this.shapes.push({
        mesh,
        baseScale: config.baseScale,
        rotationSpeed: config.rotationSpeed,
        pulseFactor: 0,
        pulseDecay: 0.95,
      });
    }
  }

  /**
   * 根据情绪获取颜色
   * Get color based on emotion
   */
  private getEmotionColor(): THREE.Color {
    if (this.emotion === 'neutral') {
      // 中性：白色
      return new THREE.Color(0.8, 0.8, 0.9);
    } else if (this.emotion === 'romantic') {
      // 浪漫：粉紫色
      return new THREE.Color(0.9, 0.6, 0.8);
    } else if (this.emotion === 'angry') {
      // 愤怒：红橙色
      return new THREE.Color(1.0, 0.4, 0.3);
    } else if (this.emotion === 'tense') {
      // 紧张：黄绿色
      return new THREE.Color(0.8, 0.9, 0.4);
    } else {
      // 默认：淡蓝灰色
      return new THREE.Color(0.7, 0.8, 0.9);
    }
  }

  /**
   * 触发脉冲效果
   * Trigger pulse effect
   */
  private triggerPulse(strength: number): void {
    for (const shape of this.shapes) {
      shape.pulseFactor += strength * this.params.intensity!;
    }
  }

  onBeat(event: BeatEvent): void {
    // 节拍点：小幅脉冲
    const strength = (event.strength || 0.5) * 0.3;
    this.triggerPulse(strength);
  }

  onBar(event: BeatEvent): void {
    // 小节：中等脉冲 + 旋转加速
    const strength = (event.strength || 0.7) * 0.5;
    this.triggerPulse(strength);

    // 临时加速旋转
    for (const shape of this.shapes) {
      shape.rotationSpeed.multiplyScalar(1.2);
    }
  }

  onPhrase(event: BeatEvent): void {
    // 乐句：大幅脉冲 + 旋转变向
    const strength = (event.strength || 1.0) * 0.8;
    this.triggerPulse(strength);

    // 随机改变旋转方向
    for (const shape of this.shapes) {
      if (Math.random() > 0.5) {
        shape.rotationSpeed.x *= -1;
      }
      if (Math.random() > 0.5) {
        shape.rotationSpeed.y *= -1;
      }
    }
  }

  update(deltaTime: number): void {
    if (!this.group) return;

    // 更新每个几何体
    for (const shape of this.shapes) {
      // 旋转
      shape.mesh.rotation.x += shape.rotationSpeed.x * deltaTime * this.params.speed!;
      shape.mesh.rotation.y += shape.rotationSpeed.y * deltaTime * this.params.speed!;
      shape.mesh.rotation.z += shape.rotationSpeed.z * deltaTime * this.params.speed!;

      // 脉冲缩放
      const scale = shape.baseScale * (1.0 + shape.pulseFactor);
      shape.mesh.scale.setScalar(scale);

      // 脉冲衰减
      shape.pulseFactor *= shape.pulseDecay;

      // 旋转速度衰减（恢复到正常速度）
      shape.rotationSpeed.multiplyScalar(0.99);
    }

    // 整体组的轻微浮动
    const floatY = Math.sin(performance.now() * 0.0005) * 0.1;
    this.group.position.y = floatY;
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;

    for (const shape of this.shapes) {
      const material = shape.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = opacity * 0.6;
    }
  }

  /**
   * 设置情绪
   * Set emotion
   */
  setEmotion(emotion: EmotionTag): void {
    this.emotion = emotion;

    // 更新所有几何体的颜色
    const color = this.getEmotionColor();
    for (const shape of this.shapes) {
      const material = shape.mesh.material as THREE.MeshBasicMaterial;
      material.color = color;
    }
  }

  dispose(): void {
    if (this.group && this.scene) {
      this.scene.remove(this.group);
    }

    for (const shape of this.shapes) {
      shape.mesh.geometry.dispose();
      (shape.mesh.material as THREE.Material).dispose();
    }

    this.shapes = [];
    this.group = null;
    this.scene = null;
  }
}
