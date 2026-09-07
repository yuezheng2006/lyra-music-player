// src/utils/visualizer/turntable/vinylSurfaceShaders.ts
// GLSL port of vinylformac VinylShaders.metal (vinylSurface + platterSurface).

export const VINYL_FULLSCREEN_VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const VINYL_SURFACE_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_light;
uniform float u_mode; // 0 = vinyl, 1 = platter

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float ringGauss(float rn, float center, float width) {
  float x = (rn - center) / width;
  return exp(-x * x);
}

vec4 vinylSurface(vec2 uv) {
  vec2 c = vec2(0.5);
  vec2 d = uv - c;
  float R = 0.5;
  float r = length(d);
  float rn = r / R;
  float alpha = 1.0 - smoothstep(R - 0.002, R + 0.0004, r);
  if (alpha <= 0.0) return vec4(0.0);

  vec2 radial = r > 0.001 ? d / r : vec2(0.0, 1.0);
  vec2 L = normalize(u_light);

  float labelR = 0.318;
  float deadwaxEnd = 0.372;
  float grooveEnd = 0.955;
  float edgeStart = 0.982;

  float sep = ringGauss(rn, 0.455, 0.0075)
    + ringGauss(rn, 0.560, 0.0060)
    + ringGauss(rn, 0.662, 0.0080)
    + ringGauss(rn, 0.778, 0.0060)
    + ringGauss(rn, 0.884, 0.0070);
  sep = min(sep, 1.0);

  float inGroove = smoothstep(deadwaxEnd, deadwaxEnd + 0.012, rn)
    * (1.0 - smoothstep(grooveEnd, grooveEnd + 0.010, rn));
  float grooveAmp = inGroove * mix(1.0, 0.30, sep);

  float pixelR = r * 1024.0;
  float g1 = vnoise(vec2(pixelR * 0.70, 3.7)) - 0.5;
  float g2 = vnoise(vec2(pixelR * 0.22, 9.1)) - 0.5;
  float grooves = g1 * 0.6 + g2;

  float base = 0.052 + grooveAmp * grooves * 0.022 - sep * inGroove * 0.012;
  float ca = dot(radial, L);
  float lobes = ca * ca;
  float env = smoothstep(labelR, 0.46, rn) * (1.0 - smoothstep(0.965, 1.0, rn));
  float sheen = (pow(lobes, 2.0) * 0.045 + pow(lobes, 5.0) * 0.26 + pow(lobes, 32.0) * 0.32)
    * env * (0.30 + 0.70 * grooveAmp);
  float smoothArea = (1.0 - inGroove) * step(labelR, rn);
  sheen += pow(lobes, 80.0) * 0.18 * smoothArea * env;

  float ang = atan(d.y, d.x);
  float sp = hash21(vec2(floor(pixelR * 1.5), floor(ang * 520.0)));
  float sparkle = step(0.997, sp) * pow(lobes, 4.0) * grooveAmp * 0.34;

  float bevel = smoothstep(edgeStart, 1.0, rn);
  base *= 1.0 - bevel * 0.45;
  float rimLight = bevel * max(0.0, dot(radial, L)) * 0.20;
  vec3 sheenTint = vec3(1.0, 0.94, 0.84);
  vec3 rgb = base * vec3(1.02, 1.0, 0.98) + sheen * sheenTint + sparkle + rimLight * sheenTint;
  rgb = clamp(rgb, 0.0, 1.0);
  return vec4(rgb * alpha, alpha);
}

vec4 platterSurface(vec2 uv) {
  vec2 c = vec2(0.5);
  vec2 d = uv - c;
  float R = 0.5;
  float r = length(d);
  float rn = r / R;
  float alpha = 1.0 - smoothstep(R - 0.002, R + 0.0004, r);
  if (alpha <= 0.0) return vec4(0.0);

  vec2 radial = r > 0.001 ? d / r : vec2(0.0, 1.0);
  vec2 L = normalize(u_light);
  float ca = dot(radial, L);
  float lobes = ca * ca;
  float rimStart = 0.955;
  float rim = smoothstep(rimStart, rimStart + 0.02, rn);
  float pixelR = r * 1024.0;
  float ribs = sin(pixelR * 1.35) * 0.5 + 0.5;
  float mat = 0.085
    + (vnoise(vec2(pixelR * 0.8, 4.2)) - 0.5) * 0.018
    + ribs * 0.020 * smoothstep(0.15, 0.3, rn)
    + pow(lobes, 4.0) * 0.045;
  float metal = 0.30
    + (vnoise(vec2(pixelR * 0.9, 8.8)) - 0.5) * 0.10
    + pow(lobes, 3.0) * 0.14
    + pow(lobes, 28.0) * 0.16
    + max(0.0, dot(radial, L)) * 0.10;
  float v = mix(mat, metal, rim);
  v *= 1.0 - smoothstep(0.994, 1.0, rn) * 0.5;
  vec3 rgb = clamp(vec3(v, v * 0.995, v * 0.985), 0.0, 1.0);
  return vec4(rgb * alpha, alpha);
}

void main() {
  if (u_mode < 0.5) {
    gl_FragColor = vinylSurface(v_uv);
  } else {
    gl_FragColor = platterSurface(v_uv);
  }
}
`;
