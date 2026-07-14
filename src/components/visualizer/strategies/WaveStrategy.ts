// src/components/visualizer/strategies/WaveStrategy.ts
// Wave Strategy - Visual effect using wave/ripple patterns
// 波浪策略 - 使用波浪/涟漪的视觉效果

import * as THREE from 'three';
import type { VisualStrategy, VisualStrategyParams } from '../../../types/visualStrategy';
import type { BeatEvent } from '../../../types/atmosphere';
import type { EmotionTag } from '../../../types/moodEngine';

interface Ripple {
  origin: THREE.Vector2;
  startTime: number;
  strength: number;
  maxRadius: number;
  duration: number;
}

/**
 * 波浪策略 - 悲伤/舒缓情绪的视觉效果
 * Wave strategy for sad/calm emotions
 */
export class WaveStrategy implements VisualStrategy {
  readonly name = 'wave' as const;

  private scene: THREE.Scene | null = null;
  private plane: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;

  private ripples: Ripple[] = [];
  private maxRipples = 10;
  private currentTime = 0;

  private opacity = 1.0;
  private emotion: EmotionTag = 'calm';
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

    // 创建平面几何体
    const geometry = new THREE.PlaneGeometry(8, 8, 128, 128);

    // 创建 shader 材质
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: this.opacity },
        ripples: { value: [] },
        rippleCount: { value: 0 },
        baseColor: { value: this.getEmotionBaseColor() },
        waveColor: { value: this.getEmotionWaveColor() },
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.plane = new THREE.Mesh(geometry, this.material);
    this.plane.position.z = -2; // 放在背景层
    this.scene.add(this.plane);
  }

  /**
   * 根据情绪获取基础颜色
   * Get base color based on emotion
   */
  private getEmotionBaseColor(): THREE.Vector3 {
    if (this.emotion === 'sad') {
      // 悲伤：深蓝色背景
      return new THREE.Vector3(0.1, 0.15, 0.3);
    } else if (this.emotion === 'calm' || this.emotion === 'relaxed') {
      // 舒缓/放松：柔和的青色
      return new THREE.Vector3(0.15, 0.25, 0.3);
    } else if (this.emotion === 'melancholic') {
      // 忧郁：灰蓝色
      return new THREE.Vector3(0.2, 0.2, 0.25);
    } else {
      // 默认：中性蓝
      return new THREE.Vector3(0.15, 0.2, 0.25);
    }
  }

  /**
   * 根据情绪获取波浪颜色
   * Get wave color based on emotion
   */
  private getEmotionWaveColor(): THREE.Vector3 {
    if (this.emotion === 'sad') {
      // 悲伤：淡蓝色波浪
      return new THREE.Vector3(0.3, 0.5, 0.8);
    } else if (this.emotion === 'calm' || this.emotion === 'relaxed') {
      // 舒缓：青绿色波浪
      return new THREE.Vector3(0.4, 0.7, 0.8);
    } else if (this.emotion === 'melancholic') {
      // 忧郁：紫蓝色波浪
      return new THREE.Vector3(0.5, 0.4, 0.7);
    } else {
      // 默认：淡蓝色
      return new THREE.Vector3(0.4, 0.6, 0.8);
    }
  }

  /**
   * 顶点着色器
   * Vertex shader
   */
  private getVertexShader(): string {
    return `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  /**
   * 片段着色器
   * Fragment shader
   */
  private getFragmentShader(): string {
    return `
      uniform float time;
      uniform float opacity;
      uniform vec3 baseColor;
      uniform vec3 waveColor;
      uniform int rippleCount;
      uniform vec4 ripples[10]; // x, y, startTime, strength

      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vec3 color = baseColor;
        float wave = 0.0;

        // 计算所有涟漪的叠加效果
        for (int i = 0; i < 10; i++) {
          if (i >= rippleCount) break;

          vec4 ripple = ripples[i];
          vec2 origin = ripple.xy;
          float startTime = ripple.z;
          float strength = ripple.w;

          // 计算到涟漪中心的距离
          float dist = distance(vUv, origin);

          // 计算涟漪的生命周期（0-1）
          float age = (time - startTime) * 0.5; // 减速

          if (age >= 0.0 && age <= 1.0) {
            // 涟漪半径随时间扩散
            float rippleRadius = age * 2.0; // 最大扩散到 2.0

            // 计算涟漪强度（距离越近越强，随时间衰减）
            float rippleEffect = 0.0;
            float distToRipple = abs(dist - rippleRadius);

            if (distToRipple < 0.15) {
              rippleEffect = (1.0 - distToRipple / 0.15) * (1.0 - age) * strength;
            }

            wave += rippleEffect;
          }
        }

        // 限制波浪强度
        wave = clamp(wave, 0.0, 1.0);

        // 混合基础颜色和波浪颜色
        color = mix(baseColor, waveColor, wave * 0.6);

        // 添加柔和的渐变效果
        float vignette = 1.0 - length(vUv - 0.5) * 0.8;
        color *= vignette;

        gl_FragColor = vec4(color, opacity);
      }
    `;
  }

  /**
   * 创建涟漪
   * Create ripple
   */
  private createRipple(x: number, y: number, strength: number): void {
    // 移除最老的涟漪（如果超过最大数量）
    if (this.ripples.length >= this.maxRipples) {
      this.ripples.shift();
    }

    // 调整速度和持续时间
    const durationMultiplier = this.emotion === 'sad' ? 1.5 : 1.0;
    const maxRadius = 2.0 * this.params.speed!;
    const duration = 2.0 * durationMultiplier;

    this.ripples.push({
      origin: new THREE.Vector2(x, y),
      startTime: this.currentTime,
      strength: strength * this.params.intensity!,
      maxRadius,
      duration,
    });

    this.updateShaderUniforms();
  }

  /**
   * 更新 shader uniforms
   * Update shader uniforms
   */
  private updateShaderUniforms(): void {
    if (!this.material) return;

    const rippleData: number[] = [];
    let count = 0;

    for (const ripple of this.ripples) {
      const age = this.currentTime - ripple.startTime;
      if (age < ripple.duration) {
        rippleData.push(
          ripple.origin.x,
          ripple.origin.y,
          ripple.startTime,
          ripple.strength,
        );
        count++;
      }
    }

    // 填充到 10 个（shader 数组大小）
    while (rippleData.length < 40) {
      rippleData.push(0, 0, 0, 0);
    }

    this.material.uniforms.ripples.value = rippleData;
    this.material.uniforms.rippleCount.value = count;
  }

  onBeat(event: BeatEvent): void {
    // 节拍点：单个涟漪
    const strength = (event.strength || 0.5) * 0.6;

    // 在中心位置创建涟漪
    this.createRipple(0.5, 0.5, strength);
  }

  onBar(event: BeatEvent): void {
    // 小节：多个涟漪
    const strength = (event.strength || 0.7) * 0.8;

    // 在多个位置创建涟漪
    this.createRipple(0.5, 0.5, strength);
    this.createRipple(0.3, 0.4, strength * 0.7);
    this.createRipple(0.7, 0.6, strength * 0.7);
  }

  onPhrase(event: BeatEvent): void {
    // 乐句：环形涟漪
    const strength = (event.strength || 1.0);

    // 环形分布的涟漪
    const steps = 6;
    const radius = 0.3;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = 0.5 + Math.cos(angle) * radius;
      const y = 0.5 + Math.sin(angle) * radius;
      this.createRipple(x, y, strength * 0.8);
    }
  }

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    if (this.material) {
      this.material.uniforms.time.value = this.currentTime;
    }

    // 移除过期的涟漪
    this.ripples = this.ripples.filter(
      ripple => this.currentTime - ripple.startTime < ripple.duration,
    );

    this.updateShaderUniforms();
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    if (this.material) {
      this.material.uniforms.opacity.value = opacity;
    }
  }

  /**
   * 设置情绪
   * Set emotion
   */
  setEmotion(emotion: EmotionTag): void {
    this.emotion = emotion;

    // 更新颜色
    if (this.material) {
      this.material.uniforms.baseColor.value = this.getEmotionBaseColor();
      this.material.uniforms.waveColor.value = this.getEmotionWaveColor();
    }
  }

  dispose(): void {
    if (this.plane && this.scene) {
      this.scene.remove(this.plane);
    }

    if (this.plane?.geometry) {
      this.plane.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }

    this.ripples = [];
    this.scene = null;
  }
}
