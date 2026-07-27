import React, { useEffect, useRef } from 'react';
import * as twgl from 'twgl.js';
import { Theme } from '../../types';
import { parseColorChannels } from './colorMix';
import { SORA_STAR_COUNT } from '../../utils/visualizer/soraStarfieldMath';

// src/components/visualizer/SoraBackground.tsx
// Layered GL_POINTS starfield (Sora / 星空) with a lyric-friendly center well.

interface SoraBackgroundProps {
  theme: Theme;
  isDaylight: boolean;
  paused?: boolean;
}

const VERTEX_SHADER = `
attribute float a_index;
uniform vec2 u_resolution;
uniform float u_time;
varying float v_color_type;
varying float v_intensity_base;
varying float v_layer;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  float seed = a_index * 123.456;
  float t = a_index / ${SORA_STAR_COUNT.toFixed(1)};
  float layer = t < 0.58 ? 0.0 : (t < 0.88 ? 1.0 : 2.0);
  v_layer = layer;

  float speedMul = layer < 0.5 ? 0.45 : (layer < 1.5 ? 0.95 : 1.45);
  float sizeMul = layer < 0.5 ? 0.70 : (layer < 1.5 ? 1.15 : 2.15);
  float blinkMul = layer < 0.5 ? 0.55 : (layer < 1.5 ? 1.0 : 1.45);

  float speed_rand = hash2(vec2(seed, 1.1));
  float size_rand = hash2(vec2(seed, 2.2));
  float y_rand = hash2(vec2(seed, 3.3));
  float x_rand = hash2(vec2(seed, 4.4));
  float blink_rand = hash2(vec2(seed, 5.5));
  float color_type_rand = hash2(vec2(seed, 6.6));
  float drift_rand = hash2(vec2(seed, 7.7));

  float aspect = max(0.01, u_resolution.x / u_resolution.y);
  float speed = (0.004 + speed_rand * 0.020) * speedMul;
  // Stronger power-law: mostly small stars, a few bright ones — avoids noisy dust.
  float size = (0.0007 + 0.0065 * pow(size_rand, 5.0)) * sizeMul;

  // Bias stars away from the lyric well (lower-center) so text stays clean.
  float y = -0.92 + y_rand * 1.84;
  float lyricAvoid = smoothstep(0.05, -0.35, y) * smoothstep(0.55, 0.15, abs(x_rand - 0.5));
  if (lyricAvoid > 0.55 && layer < 1.5 && hash2(vec2(seed, 8.8)) > 0.35) {
    y = mix(y, 0.55 + hash2(vec2(seed, 9.1)) * 0.40, 0.85);
  }

  float margin = 0.08;
  float width = aspect + margin * 2.0;
  float x = fract(x_rand + u_time * speed);
  x = x * width - (aspect * 0.5 + margin);

  float wave = sin(u_time * (0.18 + drift_rand * 0.14) + y_rand * 6.283) * (0.003 + layer * 0.0025);
  float parallaxY = sin(u_time * 0.06 + x_rand * 4.0) * (0.0015 + layer * 0.003);

  float ndc_x = x / (aspect * 0.5);
  float ndc_y = (y + wave + parallaxY) / 0.5;

  gl_Position = vec4(ndc_x, ndc_y, 0.0, 1.0);

  float pointSize = size * u_resolution.y * (3.6 + layer * 1.1);
  gl_PointSize = max(2.0, pointSize);

  float blink = 0.28 + 0.72 * pow(0.5 + 0.5 * sin(u_time * (0.8 + blink_rand * 2.8) * blinkMul + x_rand * 6.283), 1.8);
  float flare = layer > 1.5 ? smoothstep(0.93, 0.997, hash2(vec2(floor(u_time * 0.65 + seed), seed))) * 1.0 : 0.0;
  v_intensity_base = clamp(blink + flare, 0.0, 1.45);
  v_color_type = color_type_rand;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 u_particle_color;
uniform vec3 u_particle_accent_color;
uniform vec3 u_warm_color;

varying float v_color_type;
varying float v_intensity_base;
varying float v_layer;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float dist = length(pc);

  // Tight core + short halo — reads as stars, not sand grain.
  float core = smoothstep(0.42, 0.0, dist);
  float halo = smoothstep(0.50, 0.16, dist) * 0.32;
  float alpha = (core * 1.15 + halo) * v_intensity_base;
  if (alpha < 0.02) discard;

  vec3 baseColor = mix(u_particle_color, vec3(0.92, 0.96, 1.0), 0.35);
  if (v_color_type > 0.90) {
    baseColor = u_particle_accent_color;
  } else if (v_color_type > 0.78) {
    baseColor = mix(u_particle_color, u_warm_color, 0.62);
  } else if (v_layer > 1.5) {
    baseColor = mix(baseColor, vec3(1.0), core * 0.40);
  }

  gl_FragColor = vec4(baseColor * alpha, alpha);
}
`;

const channelsToUnit = (channels: { r: number; g: number; b: number }) => ([
  channels.r / 255,
  channels.g / 255,
  channels.b / 255,
] as [number, number, number]);

const SoraBackground: React.FC<SoraBackgroundProps> = ({ theme, isDaylight, paused = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);
  const colorsRef = useRef({
    particle: [1, 1, 1] as [number, number, number],
    accent: [0.7, 0.85, 1] as [number, number, number],
    warm: [1, 0.82, 0.65] as [number, number, number],
    bg: [0, 0, 0] as [number, number, number],
  });

  pausedRef.current = paused;

  const primaryColorChannels = parseColorChannels(theme.primaryColor)
    || (isDaylight ? { r: 30, g: 40, b: 55 } : { r: 210, g: 225, b: 255 });
  const accentColorChannels = parseColorChannels(theme.accentColor) || primaryColorChannels;
  const warmChannels = parseColorChannels(theme.secondaryColor)
    || { r: 255, g: 196, b: 150 };

  colorsRef.current = {
    particle: channelsToUnit(primaryColorChannels),
    accent: channelsToUnit(accentColorChannels),
    warm: channelsToUnit(warmChannels),
    bg: isDaylight ? [0.94, 0.96, 0.99] : [0.008, 0.01, 0.028],
  };

  const nebulaPrimary = `rgba(${primaryColorChannels.r}, ${primaryColorChannels.g}, ${primaryColorChannels.b}, ${isDaylight ? 0.12 : 0.20})`;
  const nebulaAccent = `rgba(${accentColorChannels.r}, ${accentColorChannels.g}, ${accentColorChannels.b}, ${isDaylight ? 0.08 : 0.16})`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = twgl.getContext(canvas, { alpha: false, depth: false, antialias: false });
    if (!gl) return;

    const programInfo = twgl.createProgramInfo(gl, [VERTEX_SHADER, FRAGMENT_SHADER], (err) => {
      console.error('SoraBackground twgl program error:', err);
    });
    if (!programInfo) return;

    const indices = new Float32Array(SORA_STAR_COUNT);
    for (let i = 0; i < SORA_STAR_COUNT; i++) {
      indices[i] = i;
    }

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_index: { numComponents: 1, data: indices },
    });

    let lastTimestamp = performance.now();
    let disposed = false;

    const render = (now: number) => {
      if (disposed) return;

      // Paused: keep RAF alive for resume, but skip GL draws (GPU helper thrash).
      if (pausedRef.current) {
        lastTimestamp = now;
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min(0.05, (now - lastTimestamp) / 1000);
      timeRef.current += delta;
      lastTimestamp = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);

      const { particle, accent, warm, bg } = colorsRef.current;
      gl.clearColor(bg[0], bg[1], bg[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_resolution: [canvas.width, canvas.height],
        u_time: timeRef.current,
        u_particle_color: particle,
        u_particle_accent_color: accent,
        u_warm_color: warm,
      });
      twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      disposed = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      gl.deleteProgram(programInfo.program);
      const indexBuffer = bufferInfo.attribs?.a_index?.buffer;
      if (indexBuffer) gl.deleteBuffer(indexBuffer);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" data-testid="sora-starfield">
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 65% at 22% 30%, ${nebulaPrimary} 0%, transparent 58%),
            radial-gradient(ellipse 70% 55% at 78% 68%, ${nebulaAccent} 0%, transparent 55%)
          `,
          filter: 'blur(3px)',
          opacity: isDaylight ? 0.8 : 1,
        }}
      />
      {/* Soft well so stage lyrics stay readable against the starfield. */}
      <div
        className="absolute inset-0"
        aria-hidden
        data-testid="sora-lyric-well"
        style={{
          background: isDaylight
            ? 'radial-gradient(ellipse 58% 42% at 50% 58%, rgba(255,255,255,0.35) 0%, transparent 72%)'
            : 'radial-gradient(ellipse 58% 42% at 50% 58%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.22) 48%, transparent 72%)',
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
};

export default SoraBackground;
