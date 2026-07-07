import * as THREE from 'three';
import { lyricThreeColor } from './lyricColorHelpers';
import type { LyricMask } from './makeLyricMask';

// src/components/visualizer/geometric/mineradio/lyrics/lyricShaders.ts
// Shader materials for Mineradio stage lyric meshes.

export type LyricPalette = {
    primary: string;
    secondary: string;
    highlight: string;
    glow: string;
};

export const LYRIC_TEXT_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uMap;
uniform float uProgress,uTextMin,uTextMax,uOpacity,uFeather,uSolar;
uniform vec3 uBaseColor,uHiColor,uGlowColor,uSolarColor;
varying vec2 vUv;
void main(){
  vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
  float mask = texture2D(uMap, uv).a;
  if(mask < 0.01) discard;
  float denom = max(0.001, uTextMax - uTextMin);
  float p = clamp((uv.x - uTextMin) / denom, 0.0, 1.0);
  float filled = 1.0 - smoothstep(uProgress, uProgress + uFeather, p);
  float edge = 1.0 - smoothstep(0.0, uFeather * 2.8, abs(p - uProgress));
  vec3 color = mix(uBaseColor, uHiColor, filled * 0.88);
  color += uGlowColor * edge * 0.14;
  vec3 solar = uSolarColor;
  color = mix(color, color + solar * 0.34, uSolar * (0.25 + filled * 0.45));
  color += solar * edge * uSolar * 0.22;
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color += vec3(max(0.0, 0.30 - lum));
  gl_FragColor = vec4(color, mask * uOpacity);
}
`;

export const makeLyricShaderMaterial = (mask: LyricMask, palette: LyricPalette) =>
    new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: mask.texture },
            uProgress: { value: 0 },
            uTextMin: { value: mask.textMin },
            uTextMax: { value: mask.textMax },
            uOpacity: { value: 0 },
            uBaseColor: { value: lyricThreeColor(palette.primary, '#d6f8ff', 0.38) },
            uHiColor: { value: lyricThreeColor(palette.highlight || palette.primary, '#fff0b8', 0.48) },
            uGlowColor: { value: lyricThreeColor(palette.glow || palette.secondary, '#9cffdf', 0.36) },
            uSolarColor: { value: lyricThreeColor(palette.highlight || palette.secondary, '#fff0b8', 0.5) },
            uFeather: { value: 0.055 },
            uSolar: { value: 0 },
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: LYRIC_TEXT_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
    });

let sunBloomTexture: THREE.CanvasTexture | null = null;

export const getLyricSunBloomTexture = (): THREE.CanvasTexture => {
    if (sunBloomTexture) return sunBloomTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.5;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.height * 0.43);
        radial.addColorStop(0, 'rgba(255,246,186,0.92)');
        radial.addColorStop(0.18, 'rgba(255,219,126,0.44)');
        radial.addColorStop(0.46, 'rgba(255,186,82,0.15)');
        radial.addColorStop(1, 'rgba(255,186,82,0)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    sunBloomTexture = new THREE.CanvasTexture(canvas);
    sunBloomTexture.minFilter = THREE.LinearFilter;
    sunBloomTexture.magFilter = THREE.LinearFilter;
    sunBloomTexture.generateMipmaps = false;
    return sunBloomTexture;
};

export const disposeLyricSunBloomTexture = () => {
    sunBloomTexture?.dispose();
    sunBloomTexture = null;
};
