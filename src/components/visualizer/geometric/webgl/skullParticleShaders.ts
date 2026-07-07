// src/components/visualizer/geometric/webgl/skullParticleShaders.ts
// Mineradio requiem skull point-cloud GLSL.

export const SKULL_PARTICLE_VERTEX_SHADER = `
precision highp float;
attribute float seed;
attribute float kind;
uniform float uTime, uSpeed, uIntensity, uBass, uBeat, uPixel, uPointScale;
varying vec3 vColor;
varying float vAlpha;

void main(){
  vec3 pos = position;
  float t = uTime * uSpeed;
  float pulse = uBeat * 0.55 + uBass * 0.35;
  float wobble = sin(t * 1.4 + seed * 6.283) * (0.08 + pulse * 0.22) * uIntensity;
  pos += normalize(pos + vec3(0.001)) * wobble * (0.35 + kind * 0.25);
  pos.y += sin(t * 0.6 + seed * 12.0) * 0.06 * uIntensity;
  vColor = mix(vec3(0.72, 0.78, 0.92), vec3(0.92, 0.86, 0.98), kind);
  vAlpha = 0.42 + pulse * 0.35;
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float dist = max(0.6, -mvPos.z);
  gl_PointSize = clamp(34.0 / dist, 1.1, 3.6) * uPointScale * uPixel;
  gl_Position = projectionMatrix * mvPos;
}
`;

export const SKULL_PARTICLE_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uDotTex;
uniform float uAlpha;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec4 tex = texture2D(uDotTex, gl_PointCoord);
  if (tex.a < 0.02) discard;
  gl_FragColor = vec4(vColor * 1.05, tex.a * uAlpha * vAlpha);
}
`;
