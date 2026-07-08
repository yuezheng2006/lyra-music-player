// src/components/visualizer/geometric/webgl/coverParticleShaders.ts
// Mineradio cover particle GLSL (cover / vinyl / lightflow presets).

export const COVER_PARTICLE_VERTEX_SHADER = `
precision highp float;
attribute vec2 aUv;
attribute float aRand;
uniform float uTime, uSpeed, uPreset, uIntensity, uDepth, uMid, uTreble, uBass, uBeat, uEnergy, uBurstAmt;
uniform float uHasCover, uHasDepth, uAiBoost, uPixel, uPointScale, uColorMixT;
uniform sampler2D uCoverTex;
uniform sampler2D uPrevCoverTex;
uniform sampler2D uEdgeTex;
uniform sampler2D uRippleTex;
uniform int uRippleCount;
uniform vec2 uMouseXY;
uniform float uMouseActive;
varying vec3 vColor;
varying float vAlpha, vBright, vRipple, vEdgeBoost, vSourceLum;

const float PI = 3.141592653589793;

float hash11(float p){ return fract(sin(p * 127.1) * 43758.5453); }

vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float rippleSumAt(vec2 p, out float maxAmp) {
  maxAmp = 0.0;
  if (uRippleCount <= 0) return 0.0;
  float sum = 0.0;
  for (int ri = 0; ri < 12; ri++) {
    if (ri >= uRippleCount) break;
    float vCoord = (float(ri) + 0.5) / 12.0;
    vec4 rd = texture2D(uRippleTex, vec2(0.5, vCoord));
    float age = rd.z;
    float str = rd.w;
    if (str < 0.005 || age < 0.0 || age > 2.0) continue;
    float dx = p.x - rd.x;
    float dy = p.y - rd.y;
    float dist = sqrt(dx * dx + dy * dy);
    float lifeN = age / 2.0;
    float fadeIn = smoothstep(0.0, 0.06, age);
    float fadeOut = 1.0 - smoothstep(0.7, 1.0, lifeN);
    float env = fadeIn * fadeOut;
    float bulgeW = 0.55 + age * 0.80;
    float bulge = exp(-dist * dist / (2.0 * bulgeW * bulgeW)) * (1.0 - smoothstep(0.0, 0.55, lifeN));
    float waveR = age * 2.10;
    float ringW = 0.40 + age * 0.22;
    float ring = exp(-pow((dist - waveR) / ringW, 2.0));
    float local = (bulge * 2.4 + ring * 1.30) * env * str;
    sum += local;
    maxAmp = max(maxAmp, abs(local));
  }
  return sum;
}

vec3 samplePrevCoverColor(vec2 uv) {
  return texture2D(uPrevCoverTex, clamp(uv, vec2(0.0012), vec2(0.9988))).rgb;
}

vec4 sampleEdgeColor(vec2 uv) {
  return texture2D(uEdgeTex, clamp(uv, vec2(0.0012), vec2(0.9988)));
}

void main(){
  float t = uTime * uSpeed;
  vec3 pos = vec3(0.0);
  vec2 sampleUv = clamp(aUv, vec2(0.0012), vec2(0.9988));
  vec3 newCol = texture2D(uCoverTex, sampleUv).rgb;
  vec3 prevCol = samplePrevCoverColor(sampleUv);
  vec3 coverColor = mix(prevCol, newCol, clamp(uColorMixT, 0.0, 1.0));
  vec4 edge = sampleEdgeColor(sampleUv);
  float depthVal = edge.r;
  float maxRippleAmp = 0.0;
  vec3 defaultColor = mix(vec3(0.36, 0.28, 0.72), mix(vec3(0.85,0.55,0.95), vec3(0.45,0.78,0.95), aUv.x), aUv.y);
  vColor = mix(defaultColor, coverColor, uHasCover);
  vAlpha = 1.0;
  vBright = 0.5 + uBeat * 0.35 + uBass * 0.2;
  vRipple = 0.0;
  float K = uIntensity * 1.6;

  if (uPreset < 0.5) {
    pos = position;
    float rippleZ = rippleSumAt(pos.xy, maxRippleAmp);
    float midN = snoise(vec3(pos.x * 1.4, pos.y * 1.4, t * 0.55)) * 0.6
               + snoise(vec3(pos.x * 2.8 + 5.0, pos.y * 2.8 - 3.0, t * 0.85)) * 0.4;
    float midMask = 0.55 + 0.45 * snoise(vec3(pos.x * 0.4, pos.y * 0.4, t * 0.18));
    float midDisp = midN * uMid * 0.55 * midMask * K;
    float trebleJ = snoise(vec3(pos.x * 6.5, pos.y * 6.5, t * 3.5 + aRand * 4.0)) * uTreble * 0.18 * K;
    float bassBreath = snoise(vec3(pos.x * 0.35, pos.y * 0.35, t * 0.4)) * uBass * 0.42 * K;
    float depthZ = (depthVal - 0.5) * uAiBoost * uDepth * 1.40 * uHasDepth;
    depthZ += sin(t * 0.62 + aRand * 6.2831) * uBass * 0.14 * K;
    pos.z = rippleZ * 1.30 + midDisp + trebleJ + bassBreath + depthZ;
    if (uMouseActive > 0.5) {
      float md = length(pos.xy - uMouseXY);
      if (md < 1.0) pos.z += pow(1.0 - md, 2.0) * 0.55;
    }
  } else if (uPreset < 1.5) {
    float bassDrive = smoothstep(0.08, 0.78, uBass + uBeat * 0.82);
    float highDrive = smoothstep(0.05, 0.46, uTreble);
    vec2 p = (aUv - 0.5) * 5.12;
    float spin = t * (0.26 + uBass * 0.05);
    float cs = cos(spin);
    float sn = sin(spin);
    vec2 rp = mat2(cs, -sn, sn, cs) * p;
    float d = length(p);
    float angle0 = atan(p.y, p.x);
    float recordR = 2.46;
    float coverR = 1.18;
    float recordAlpha = 1.0 - smoothstep(recordR - 0.02, recordR + 0.05, d);
    float coverMask = 1.0 - smoothstep(coverR - 0.012, coverR + 0.018, d);
    float border = exp(-pow((d - coverR) / 0.064, 2.0));
    float outerRim = exp(-pow((d - (recordR - 0.050)) / 0.055, 2.0));
    float vinylN = clamp((d - coverR) / max(0.001, recordR - coverR), 0.0, 1.0);

    pos = vec3(rp * (1.0 + bassDrive * 0.012 + uBeat * 0.026), 0.0);
    vAlpha = recordAlpha;

    if (coverMask > 0.02) {
      vec2 coverUv = clamp(p / (coverR * 2.0) + 0.5, vec2(0.0012), vec2(0.9988));
      newCol = texture2D(uCoverTex, coverUv).rgb;
      prevCol = samplePrevCoverColor(coverUv);
      coverColor = mix(prevCol, newCol, clamp(uColorMixT, 0.0, 1.0));
      vColor = mix(defaultColor, coverColor, uHasCover);
      vColor *= 1.02 + 0.10 * (1.0 - smoothstep(0.0, coverR, d));
      vColor = mix(vColor, vec3(1.0), border * 0.54);
      pos.z = 0.040 + border * 0.026 + uBeat * 0.018;
      maxRippleAmp = max(maxRippleAmp, border * 0.30 + bassDrive * 0.075 + uBeat * 0.075);
    } else {
      float groove = 0.5 + 0.5 * sin((d - coverR) * 98.0);
      float fineGroove = 0.5 + 0.5 * sin((d - coverR) * 170.0 + aRand * 3.0);
      float tick = smoothstep(0.82, 0.995, hash11(floor((angle0 + PI) * 38.0) + floor(d * 72.0) * 2.1));
      vec3 vinyl = vec3(0.052, 0.054, 0.058) + vec3(0.052) * groove + vec3(0.026) * fineGroove;
      vinyl = mix(vinyl, coverColor * 0.32, 0.18 * (1.0 - vinylN));
      float whiteRing = max(border * 0.92, outerRim * 0.26);
      vColor = mix(vinyl, vec3(0.92, 0.94, 0.94), whiteRing);
      vColor = mix(vColor, vec3(1.0), tick * highDrive * (0.06 + border * 0.12));
      pos.z = groove * 0.010 + border * 0.024 + bassDrive * vinylN * 0.016 * K + tick * highDrive * 0.010;
      maxRippleAmp = max(maxRippleAmp, border * 0.32 + outerRim * 0.12 + bassDrive * vinylN * 0.11 + tick * highDrive * 0.10 + uBeat * vinylN * 0.08);
    }
  } else {
    vec2 p = (aUv - 0.5) * vec2(10.8, 6.2);
    float lane = p.x * 0.86 - p.y * 0.50;
    float crossLane = p.x * 0.50 + p.y * 0.86;
    float channel = floor(aUv.y * 9.0);
    float seed = hash11(channel * 41.0 + aRand * 13.0);
    float flow = fract(aUv.x + t * (0.030 + seed * 0.014 + uEnergy * 0.010) + seed);
    float thread = sin(crossLane * (3.6 + seed * 3.2) + lane * 1.4 - t * (1.8 + uMid * 0.8) + seed * 6.0);
    float sharp = pow(0.5 + 0.5 * thread, 7.0);
    float centerBand = exp(-pow((crossLane + sin(lane * 0.42 + t * 0.4) * 0.32) / (0.38 + seed * 0.18), 2.0));
    float blade = exp(-abs(p.y + sin(t * 1.6 + seed) * 0.04) * 4.8) * smoothstep(-5.0, -0.2, p.x) * (1.0 - smoothstep(0.2, 5.0, p.x));
    float drift = (flow - 0.5) * (9.0 + seed * 2.2);
    float wobble = snoise(vec3(flow * 2.8 + seed, channel * 0.4, t * 0.20));

    pos.x = drift + lane * 0.22 + wobble * 0.42;
    pos.y = crossLane * 0.56 + thread * (0.34 + uMid * 0.35) + sin(t * 0.7 + seed * 7.0) * 0.12;
    pos.z = -3.0 + channel * 0.62 + wobble * 1.1 + sharp * (0.75 + uBeat * 0.45);

    float pulse = uBeat * 0.40 + uBurstAmt * 0.25 + uBass * 0.18;
    vec3 ch1 = vec3(1.00, 0.13, 0.31);
    vec3 ch2 = vec3(0.16, 1.00, 0.86);
    vec3 ch3 = vec3(1.00, 0.76, 0.28);
    vec3 lightflow = mix(ch1, ch2, smoothstep(-2.8, 2.8, crossLane));
    lightflow = mix(lightflow, ch3, sharp * 0.35 + uBass * 0.12);
    vAlpha = (0.10 + centerBand * 0.52 + sharp * 0.70 + blade * 0.34) * (0.72 + uEnergy * 0.28);
    vColor = mix(coverColor, lightflow, 0.78 + sharp * 0.16) * (0.82 + sharp * 1.08 + pulse * 0.18);
    maxRippleAmp = max(maxRippleAmp, sharp * (0.16 + uTreble * 0.18) + blade * (0.08 + uBass * 0.10) + pulse * 0.08);
  }

  float edgeBoostFinal = edge.g * uHasDepth;
  vSourceLum = dot(max(vColor, vec3(0.0)), vec3(0.299, 0.587, 0.114));
  float blackParticleGuard = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  vEdgeBoost = edgeBoostFinal * (uPreset > 3.5 ? 0.22 : 1.0) * (1.0 - blackParticleGuard);

  vBright = 0.82 + maxRippleAmp * 0.55 + uBass * 0.10 + edgeBoostFinal * 0.30 + uEnergy * 0.05 + uBurstAmt * 0.40 + uBeat * 0.22;
  if (uPreset > 4.5) {
    vBright = 0.94 + maxRippleAmp * 0.34 + uBass * 0.020 + uEnergy * 0.026 + uBurstAmt * 0.025 + uBeat * 0.08;
  } else if (uPreset > 0.5 && uPreset < 1.5) {
    vBright = 0.84 + uBass * 0.12 + uBeat * 0.16 + maxRippleAmp * 1.35 + uEnergy * 0.14 + uBurstAmt * 0.12;
  }

  vRipple = clamp(maxRippleAmp * 1.5, 0.0, 1.0);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float dist = max(0.5, -mvPos.z);
  float depthSize = 36.0 / dist;
  float audioBoost = 1.0 + maxRippleAmp * 0.7 + edgeBoostFinal * 0.55 + uBeat * 0.30 + uBurstAmt * 0.5;
  float sz = clamp(depthSize * audioBoost, 1.05, 4.95);
  if (uPreset > 4.5) {
    float flowDrive = uBass * 0.070 + uMid * 0.046 + uTreble * 0.060 + uBurstAmt * 0.090 + uBeat * 0.055;
    sz = clamp(depthSize * (1.05 + flowDrive), 1.00, 5.45);
  } else if (uPreset > 0.5 && uPreset < 1.5) {
    float vinylDrive = uBass * 0.12 + uMid * 0.16 + uTreble * 0.24 + uBeat * 0.18 + maxRippleAmp * 0.52;
    sz = clamp(depthSize * (1.02 + vinylDrive * 0.48), 1.05, 5.35);
  }
  gl_PointSize = sz * uPixel * uPointScale;
  gl_Position = projectionMatrix * mvPos;
}
`;

export const COVER_PARTICLE_BLOOM_VERTEX_SHADER = COVER_PARTICLE_VERTEX_SHADER.replace(
    'gl_PointSize = sz * uPixel * uPointScale;',
    'gl_PointSize = sz * uPixel * uPointScale * 1.34;',
);

export const COVER_PARTICLE_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uDotTex;
uniform float uAlpha, uPreset, uParticleDim;
varying vec3 vColor;
varying float vAlpha, vBright, vRipple, vEdgeBoost, vSourceLum;
void main(){
  vec4 tex = texture2D(uDotTex, gl_PointCoord);
  if (tex.a < 0.02) discard;
  vec3 col = vColor * vBright;
  col = mix(col, col * 1.3 + vec3(0.05), vEdgeBoost * 0.35);
  col = mix(col, col * 1.2, vRipple * 0.4);
  float keepBlack = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  float nonBlack = 1.0 - keepBlack;
  float dotDist = length(gl_PointCoord - vec2(0.5)) * 2.0;
  float readableRim = smoothstep(0.44, 0.94, dotDist) * (1.0 - smoothstep(0.94, 1.08, dotDist)) * tex.a;
  float outLum = dot(col, vec3(0.299, 0.587, 0.114));
  float lightParticle = smoothstep(0.50, 0.82, outLum) * nonBlack;
  float darkParticle = (1.0 - smoothstep(0.20, 0.50, outLum)) * nonBlack;
  col = mix(col, vec3(0.0), readableRim * lightParticle * 0.38);
  col = mix(col, vec3(1.0), readableRim * darkParticle * 0.20);
  col = clamp(col, vec3(0.0), vec3(1.6));
  gl_FragColor = vec4(col, tex.a * uAlpha * uParticleDim * vAlpha);
}
`;

export const COVER_PARTICLE_BLOOM_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uDotTex;
uniform float uAlpha, uBloomStrength, uPreset, uParticleDim;
varying vec3 vColor;
varying float vBright, vRipple, vEdgeBoost, vAlpha, vSourceLum;
void main(){
  vec4 tex = texture2D(uDotTex, gl_PointCoord);
  if (tex.a < 0.01) discard;
  float soft = tex.a * tex.a;
  vec3 col = vColor * (0.55 + vBright * 0.62);
  col = mix(col, col + vec3(0.22, 0.18, 0.10), vEdgeBoost * 0.35);
  col = clamp(col, vec3(0.0), vec3(1.8));
  float pulse = 1.0 + vRipple * 0.65;
  float keepBlack = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  float bloomKeep = 1.0 - keepBlack * 0.92;
  gl_FragColor = vec4(col, soft * uAlpha * uBloomStrength * uParticleDim * pulse * 0.55 * vAlpha * bloomKeep);
}
`;
