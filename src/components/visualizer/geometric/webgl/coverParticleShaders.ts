// src/components/visualizer/geometric/webgl/coverParticleShaders.ts
// Mineradio cover particle GLSL (cover / Mineradio originals / modern WebGL presets).

export const COVER_PARTICLE_VERTEX_SHADER = `
precision highp float;
attribute vec2 aUv;
attribute float aRand;
uniform float uTime, uSpeed, uPreset, uIntensity, uDepth, uMid, uTreble, uBass, uBeat, uEnergy, uBurstAmt;
uniform float uVinylSpin, uCoverRes, uCoverWarp, uColorBoost;
uniform float uHasCover, uHasDepth, uEdgeEnabled, uAiBoost, uPixel, uPointScale, uColorMixT;
uniform sampler2D uCoverTex;
uniform sampler2D uPrevCoverTex;
uniform sampler2D uEdgeTex;
uniform sampler2D uRippleTex;
uniform int uRippleCount;
uniform vec2 uMouseXY;
uniform float uMouseActive, uLoading;
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

vec3 sampleCoverColor(vec2 uv) {
  return texture2D(uCoverTex, clamp(uv, vec2(0.0012), vec2(0.9988))).rgb;
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
  float edgeVal = edge.g;
  float fgMask = edge.b;
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
    pos.z = (rippleZ * 1.30 + midDisp + trebleJ + bassBreath + depthZ) * uCoverWarp;
    if (uMouseActive > 0.5) {
      float md = length(pos.xy - uMouseXY);
      if (md < 1.0) pos.z += pow(1.0 - md, 2.0) * 0.55 * uCoverWarp;
    }
  } else if (uPreset < 1.5) {
    float bassDrive = smoothstep(0.08, 0.78, uBass + uBeat * 0.82);
    float highDrive = smoothstep(0.05, 0.46, uTreble);
    vec2 p = (aUv - 0.5) * 5.12;
    float spin = uVinylSpin + t * 0.03;
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
      newCol = sampleCoverColor(coverUv);
      prevCol = samplePrevCoverColor(coverUv);
      coverColor = mix(prevCol, newCol, clamp(uColorMixT, 0.0, 1.0));
      float hiResGuard = smoothstep(1.08, 1.55, uCoverRes);
      if (hiResGuard > 0.001) {
        vec2 sx = vec2(0.0026, 0.0);
        vec2 sy = vec2(0.0, 0.0026);
        vec3 softNew = (sampleCoverColor(coverUv + sx) + sampleCoverColor(coverUv - sx) + sampleCoverColor(coverUv + sy) + sampleCoverColor(coverUv - sy)) * 0.25;
        vec3 softPrev = (samplePrevCoverColor(coverUv + sx) + samplePrevCoverColor(coverUv - sx) + samplePrevCoverColor(coverUv + sy) + samplePrevCoverColor(coverUv - sy)) * 0.25;
        coverColor = mix(coverColor, mix(softPrev, softNew, clamp(uColorMixT, 0.0, 1.0)), hiResGuard * 0.42);
      }
      vec3 nebulaCore = mix(vec3(0.20, 0.88, 1.0), vec3(1.0, 0.28, 0.72), 0.45 + 0.5 * sin(angle0 * 3.0 + t * 0.5));
      vColor = mix(mix(defaultColor, coverColor, uHasCover), nebulaCore, 0.05 + border * 0.18 + uBeat * 0.06);
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
      float prismGroove = pow(max(groove, fineGroove), 3.0) * (0.28 + highDrive * 0.5 + uBeat * 0.32);
      vec3 prism = mix(vec3(0.12, 0.82, 1.0), vec3(1.0, 0.16, 0.42), vinylN);
      vColor = mix(vinyl, vec3(0.92, 0.94, 0.94), whiteRing);
      vColor = mix(vColor, prism, prismGroove * (1.0 - coverMask));
      vColor = mix(vColor, vec3(1.0), tick * highDrive * (0.06 + border * 0.12));
      pos.z = groove * 0.010 + border * 0.024 + bassDrive * vinylN * 0.016 * K + tick * highDrive * 0.010;
      maxRippleAmp = max(maxRippleAmp, border * 0.32 + outerRim * 0.12 + bassDrive * vinylN * 0.11 + tick * highDrive * 0.10 + uBeat * vinylN * 0.08);
    }
  } else if (uPreset < 2.5) {
    vec2 p = (aUv - 0.5) * vec2(7.6, 5.4);
    float r = length(p);
    float angle = atan(p.y, p.x);
    float swirl = angle + t * (0.16 + uEnergy * 0.12) + snoise(vec3(p * 0.34, t * 0.12)) * 1.4;
    float arm = sin(swirl * 3.0 + r * 1.9 - t * (0.8 + uMid * 0.9));
    float cloud = snoise(vec3(p.x * 0.48, p.y * 0.48, t * 0.16))
                + snoise(vec3(p.x * 0.94 + 8.0, p.y * 0.94 - 4.0, t * 0.24)) * 0.62;
    float filament = pow(0.5 + 0.5 * arm, 5.0);
    float core = exp(-r * r * 0.16);
    float halo = exp(-pow((r - 2.2 - sin(t * 0.35) * 0.18) / 1.25, 2.0));
    float lift = cloud * (0.48 + uMid * 0.44) + filament * (0.88 + uTreble * 0.52) + core * (0.72 + uBass * 0.65);
    float breathe = 1.0 + uBeat * 0.035 + uBurstAmt * 0.040;

    pos.x = p.x * breathe + cos(swirl) * (0.12 + filament * 0.20);
    pos.y = p.y * breathe + sin(swirl) * (0.12 + filament * 0.20);
    pos.z = -0.55 + lift * K + halo * 0.42 + uBeat * core * 0.28;

    vec3 nebulaA = vec3(0.11, 0.88, 1.00);
    vec3 nebulaB = vec3(0.86, 0.28, 1.00);
    vec3 nebulaC = vec3(1.00, 0.28, 0.43);
    vec3 nebulaColor = mix(nebulaA, nebulaB, smoothstep(-0.6, 0.9, cloud));
    nebulaColor = mix(nebulaColor, nebulaC, filament * (0.24 + uTreble * 0.24));
    vAlpha = (0.12 + halo * 0.42 + filament * 0.56 + core * 0.18) * (0.78 + uEnergy * 0.24);
    vColor = mix(coverColor, nebulaColor, 0.66 + filament * 0.22) * (0.82 + lift * 0.32 + uBeat * 0.12);
    maxRippleAmp = max(maxRippleAmp, filament * (0.18 + uTreble * 0.24) + core * (0.12 + uBass * 0.28) + uBurstAmt * 0.08);
  } else if (uPreset < 3.5) {
    vec2 p = (aUv - 0.5) * vec2(9.4, 5.8);
    float row = floor(aUv.y * 44.0);
    float col = floor(aUv.x * 76.0);
    float rowSeed = hash11(row * 19.7);
    float ridge = sin(p.x * (1.8 + rowSeed * 1.3) + t * (1.2 + uBass * 0.8) + rowSeed * 6.0);
    float fine = snoise(vec3(p.x * 0.85 + rowSeed * 2.0, p.y * 1.1, t * 0.34));
    float gridPulse = smoothstep(0.78, 0.98, sin(col * 0.56 + row * 0.34 + t * (2.2 + uTreble)));
    float horizon = smoothstep(-3.0, 2.6, p.y);
    float perspective = 1.0 / (1.05 + max(0.0, p.y + 2.6) * 0.26);
    float wave = ridge * (0.42 + uBass * 0.62) + fine * (0.20 + uMid * 0.38) + gridPulse * uTreble * 0.45;

    pos.x = p.x * perspective;
    pos.y = p.y * 0.62 - 0.42 + wave * 0.22;
    pos.z = -2.4 + horizon * 2.4 + wave * (0.92 + K * 0.32) + uBeat * 0.28;

    float wire = max(
      1.0 - smoothstep(0.0, 0.060, abs(fract(aUv.x * 38.0) - 0.5)),
      1.0 - smoothstep(0.0, 0.070, abs(fract(aUv.y * 24.0) - 0.5))
    );
    vec3 low = vec3(0.08, 0.96, 0.88);
    vec3 high = vec3(1.00, 0.20, 0.36);
    vec3 peak = mix(low, high, smoothstep(-0.4, 1.2, wave + uBeat * 0.5));
    vAlpha = (0.10 + wire * 0.58 + gridPulse * 0.24 + horizon * 0.18) * (0.74 + uEnergy * 0.28);
    vColor = mix(coverColor * 0.62, peak, 0.72 + wire * 0.20) * (0.78 + wire * 0.72 + uBurstAmt * 0.24);
    maxRippleAmp = max(maxRippleAmp, abs(wave) * 0.18 + wire * (0.08 + uTreble * 0.16) + uBeat * 0.12);
  } else if (uPreset < 4.5) {
    vec2 uv = aUv * 2.0 - 1.0;
    float face = floor(aRand * 6.0);
    float cubeSize = 1.42 + uBass * 0.10 + uBeat * 0.06;
    vec2 faceUv = aUv;
    vec3 q = vec3(uv, cubeSize);
    if (face < 1.0) {
      q = vec3(uv.x, uv.y, cubeSize);
      faceUv = aUv;
    } else if (face < 2.0) {
      q = vec3(uv.x, uv.y, -cubeSize);
      faceUv = vec2(1.0 - aUv.x, aUv.y);
    } else if (face < 3.0) {
      q = vec3(cubeSize, uv.x, uv.y);
      faceUv = vec2(aUv.y, aUv.x);
    } else if (face < 4.0) {
      q = vec3(-cubeSize, uv.x, uv.y);
      faceUv = vec2(1.0 - aUv.y, aUv.x);
    } else if (face < 5.0) {
      q = vec3(uv.x, cubeSize, uv.y);
      faceUv = vec2(aUv.x, 1.0 - aUv.y);
    } else {
      q = vec3(uv.x, -cubeSize, uv.y);
      faceUv = vec2(aUv.x, aUv.y);
    }

    float rotY = t * (0.32 + uEnergy * 0.13) + uBurstAmt * 0.18;
    float rotX = 0.54 + sin(t * 0.27) * 0.18 + uBeat * 0.05;
    float cy = cos(rotY);
    float sy = sin(rotY);
    float cx = cos(rotX);
    float sx = sin(rotX);
    q = mat3(cy, 0.0, sy, 0.0, 1.0, 0.0, -sy, 0.0, cy) * q;
    q = mat3(1.0, 0.0, 0.0, 0.0, cx, -sx, 0.0, sx, cx) * q;

    float edgeX = smoothstep(0.76, 0.99, abs(uv.x));
    float edgeY = smoothstep(0.76, 0.99, abs(uv.y));
    float edgeLine = max(edgeX, edgeY);
    float innerGrid = max(
      1.0 - smoothstep(0.0, 0.052, abs(fract((uv.x + 1.0) * 4.0) - 0.5)),
      1.0 - smoothstep(0.0, 0.052, abs(fract((uv.y + 1.0) * 4.0) - 0.5))
    );
    float circuit = pow(innerGrid, 2.0) * (0.18 + uTreble * 0.44 + uBeat * 0.20);
    float plasma = snoise(vec3(q.xy * 1.8, t * 0.46 + face)) * (0.16 + uMid * 0.28);
    float facePulse = 0.5 + 0.5 * sin(face * 1.7 + t * 1.4 + uBass * 2.0);
    vec3 cubeCover = mix(samplePrevCoverColor(faceUv), sampleCoverColor(faceUv), clamp(uColorMixT, 0.0, 1.0));
    vec4 cubeEdge = sampleEdgeColor(faceUv);
    float coverLum = dot(cubeCover, vec3(0.299, 0.587, 0.114));

    pos = q;
    pos += normalize(q + vec3(0.001)) * (edgeLine * (0.12 + uBeat * 0.16) + circuit * 0.06 + plasma * 0.18);

    vec3 cubeCyan = vec3(0.08, 0.96, 1.00);
    vec3 cubeMagenta = vec3(1.00, 0.15, 0.62);
    vec3 cubeViolet = vec3(0.46, 0.24, 1.00);
    vec3 cubeColor = mix(cubeCyan, cubeMagenta, smoothstep(-1.0, 1.0, q.x + q.y * 0.3));
    cubeColor = mix(cubeColor, cubeViolet, facePulse * 0.28 + circuit * 0.18);
    float coverPresence = smoothstep(0.035, 0.18, coverLum) * uHasCover;
    vAlpha = (0.13 + edgeLine * 0.68 + circuit * 0.40 + cubeEdge.g * 0.16 + uBurstAmt * 0.16) * (0.78 + uEnergy * 0.26);
    vColor = mix(cubeCover, cubeColor, 0.34 + edgeLine * 0.34 + circuit * 0.18) * (0.86 + edgeLine * 0.72 + circuit * 0.40 + cubeEdge.g * 0.24 + uBeat * 0.14);
    vColor = mix(cubeColor, vColor, 0.55 + coverPresence * 0.45);
    maxRippleAmp = max(maxRippleAmp, edgeLine * (0.18 + uBeat * 0.24) + circuit * 0.32 + cubeEdge.g * 0.18 + abs(plasma) * 0.16);
  } else if (uPreset < 5.5) {
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
    vec3 ch4 = vec3(0.46, 0.22, 1.00);
    vec3 lightflow = mix(ch1, ch2, smoothstep(-2.8, 2.8, crossLane));
    lightflow = mix(lightflow, ch3, sharp * 0.35 + uBass * 0.12);
    lightflow = mix(lightflow, ch4, pow(centerBand, 2.0) * (0.18 + uTreble * 0.34));
    vAlpha = (0.10 + centerBand * 0.52 + sharp * 0.70 + blade * 0.34) * (0.72 + uEnergy * 0.28);
    float tunnelBloom = 0.82 + sharp * 1.18 + pulse * 0.34 + centerBand * uBeat * 0.32;
    vColor = mix(coverColor, lightflow, 0.82 + sharp * 0.16) * tunnelBloom;
    maxRippleAmp = max(maxRippleAmp, sharp * (0.16 + uTreble * 0.18) + blade * (0.08 + uBass * 0.10) + pulse * 0.08);
  } else if (uPreset < 6.5) {
    vec2 p = (aUv - 0.5) * vec2(8.8, 5.2);
    float bandId = floor(aUv.y * 5.0);
    float seed = hash11(bandId * 31.0 + 4.0);
    float phase = p.x * (0.72 + seed * 0.32) + t * (0.42 + seed * 0.16 + uEnergy * 0.10);
    float ribbonY = sin(phase) * (0.34 + seed * 0.16) + sin(phase * 1.8 + seed * 5.0) * 0.12;
    float bandCenter = -1.8 + bandId * 0.86 + sin(t * 0.18 + seed * 5.0) * 0.20;
    float distToBand = abs(p.y - bandCenter - ribbonY);
    float ribbon = exp(-pow(distToBand / (0.18 + uBass * 0.08), 2.0));
    float crest = pow(ribbon, 1.8) * (0.60 + uMid * 0.36 + uBeat * 0.18);
    float shimmer = smoothstep(0.90, 0.995, sin(p.x * 2.8 + bandId * 1.6 - t * (1.4 + uTreble * 0.8)));
    float depthWave = sin(p.x * 0.42 + bandId * 0.7 + t * 0.24) * 0.28;

    pos.x = p.x * 0.74;
    pos.y = (bandCenter + ribbonY) * 0.72 + (aUv.y - 0.5) * 0.28;
    pos.z = -1.20 + bandId * 0.36 + depthWave + crest * (0.72 + K * 0.18) + uBeat * 0.10;

    vec3 auroraA = vec3(0.10, 0.96, 0.80);
    vec3 auroraB = vec3(0.32, 0.42, 1.00);
    vec3 auroraC = vec3(0.92, 0.32, 1.00);
    vec3 auroraColor = mix(auroraA, auroraB, smoothstep(-3.8, 3.8, p.x));
    auroraColor = mix(auroraColor, auroraC, shimmer * 0.32 + seed * 0.18);
    vAlpha = (0.06 + ribbon * 0.48 + shimmer * 0.16) * (0.62 + uEnergy * 0.30);
    vColor = mix(coverColor * 0.46, auroraColor, 0.78 + ribbon * 0.14) * (0.76 + crest * 0.48 + shimmer * 0.28);
    maxRippleAmp = max(maxRippleAmp, ribbon * (0.12 + uMid * 0.16) + shimmer * (0.05 + uTreble * 0.10) + uBeat * 0.06);
  } else if (uPreset < 7.5) {
    float spin = t * 0.12;
    float angle = aUv.x * 2.0 * PI + spin;
    float flow = fract(aUv.y - t * 0.08 * (1.0 + uBass * 0.55));
    float zPos = (flow - 0.5) * 9.0;
    float baseR = 2.0 - uBass * 0.28 * K;
    float ripG = sin(angle * 5.0 + zPos * 1.4 + t * 2.2) * 0.10 * (uMid + uTreble) * K;
    float r = baseR + ripG;
    pos.x = cos(angle) * r;
    pos.y = sin(angle) * r;
    pos.z = zPos;

    vec2 tubeUv = clamp(vec2(aUv.x, flow), vec2(0.0012), vec2(0.9988));
    coverColor = mix(samplePrevCoverColor(tubeUv), sampleCoverColor(tubeUv), clamp(uColorMixT, 0.0, 1.0));
    float depthFade = smoothstep(-4.5, 4.5, zPos);
    vAlpha = 0.28 + depthFade * 0.62;
    vColor = mix(defaultColor, coverColor, uHasCover) * (0.4 + depthFade * 0.7);
    maxRippleAmp = max(maxRippleAmp, abs(ripG) * 0.56 + uBass * 0.10 + uBeat * 0.08);
  } else if (uPreset < 8.5) {
    // Mineradio orbit: keep a readable sphere. Equal-area latitude + gentle audio breath only.
    float theta = aUv.x * 2.0 * PI;
    float phi = asin(clamp(aUv.y * 2.0 - 1.0, -1.0, 1.0));
    float baseR = 2.0;
    float trebFlare = snoise(vec3(theta * 1.5, phi * 1.5, t * 0.7)) * uTreble * 0.14 * K;
    float bassExpand = uBass * 0.06 * K + uBeat * 0.03 * K;
    float r = baseR * (1.0 + clamp(bassExpand, 0.0, 0.10)) + clamp(trebFlare, -0.10, 0.14);

    pos.x = r * cos(phi) * cos(theta);
    pos.y = r * sin(phi);
    pos.z = r * cos(phi) * sin(theta);

    float yaw = t * 0.18;
    float cy = cos(yaw);
    float sy = sin(yaw);
    pos.xz = mat2(cy, -sy, sy, cy) * pos.xz;
  } else if (uPreset < 9.5) {
    pos = vec3((aUv.x - 0.5) * 0.01, (aUv.y - 0.5) * 0.01, -90.0);
    vAlpha = 0.0;
    vColor = vec3(0.0);
    maxRippleAmp = 0.0;
  } else if (uPreset < 10.5) {
    float bassDrive = smoothstep(0.08, 0.78, uBass + uBeat * 0.82);
    float highDrive = smoothstep(0.05, 0.46, uTreble);
    float hiResGuard = smoothstep(1.08, 1.55, uCoverRes);
    float edgeGuard = mix(1.0, 0.38, hiResGuard);
    float depthGuard = mix(1.0, 0.44, hiResGuard);
    float grooveGuard = mix(1.0, 0.48, hiResGuard);
    float beatGuard = mix(1.0, 0.36, hiResGuard);
    vec2 p = (aUv - 0.5) * 5.12;
    float spin = uVinylSpin;
    float cs = cos(spin);
    float sn = sin(spin);
    vec2 rp = mat2(cs, -sn, sn, cs) * p;
    float d = length(p);
    float angle0 = atan(p.y, p.x);
    float recordR = 2.46;
    float coverR = 1.18;
    float recordAlpha = 1.0 - smoothstep(recordR - 0.02, recordR + 0.05, d);
    float coverMask = 1.0 - smoothstep(coverR - 0.012, coverR + 0.018, d);
    float border = exp(-pow((d - coverR) / 0.064, 2.0)) * edgeGuard;
    float outerRim = exp(-pow((d - (recordR - 0.050)) / 0.055, 2.0)) * edgeGuard;
    float vinylN = clamp((d - coverR) / max(0.001, recordR - coverR), 0.0, 1.0);

    pos = vec3(rp * (1.0 + bassDrive * 0.012 * beatGuard + uBeat * 0.026 * beatGuard), 0.0);
    vAlpha = recordAlpha;

    if (coverMask > 0.02) {
      vec2 coverUv = clamp(p / (coverR * 2.0) + 0.5, vec2(0.0012), vec2(0.9988));
      coverColor = mix(samplePrevCoverColor(coverUv), sampleCoverColor(coverUv), clamp(uColorMixT, 0.0, 1.0));
      if (hiResGuard > 0.001) {
        vec2 sx = vec2(0.0026, 0.0);
        vec2 sy = vec2(0.0, 0.0026);
        vec3 softNew = (sampleCoverColor(coverUv + sx) + sampleCoverColor(coverUv - sx) + sampleCoverColor(coverUv + sy) + sampleCoverColor(coverUv - sy)) * 0.25;
        vec3 softPrev = (samplePrevCoverColor(coverUv + sx) + samplePrevCoverColor(coverUv - sx) + samplePrevCoverColor(coverUv + sy) + samplePrevCoverColor(coverUv - sy)) * 0.25;
        coverColor = mix(coverColor, mix(softPrev, softNew, clamp(uColorMixT, 0.0, 1.0)), hiResGuard * 0.42);
      }
      vColor = mix(defaultColor, coverColor, uHasCover) * (1.02 + 0.10 * (1.0 - smoothstep(0.0, coverR, d)));
      vColor = mix(vColor, vec3(1.0), border * 0.54);
      pos.z = 0.040 + border * 0.026 * depthGuard + uBeat * 0.018 * beatGuard;
      maxRippleAmp = max(maxRippleAmp, border * 0.30 + bassDrive * 0.075 * beatGuard + uBeat * 0.075 * beatGuard);
    } else {
      float groove = 0.5 + 0.5 * sin((d - coverR) * mix(98.0, 58.0, hiResGuard));
      float fineGroove = 0.5 + 0.5 * sin((d - coverR) * mix(170.0, 92.0, hiResGuard) + aRand * 3.0);
      float tick = smoothstep(0.82, 0.995, hash11(floor((angle0 + PI) * 38.0) + floor(d * 72.0) * 2.1));
      vec3 vinyl = vec3(0.052, 0.054, 0.058) + vec3(0.052 * grooveGuard) * groove + vec3(0.026 * grooveGuard) * fineGroove;
      vinyl = mix(vinyl, coverColor * 0.32, 0.18 * (1.0 - vinylN));
      float whiteRing = max(border * 0.92, outerRim * 0.26);
      vColor = mix(vinyl, vec3(0.92, 0.94, 0.94), whiteRing);
      vColor = mix(vColor, vec3(1.0), tick * highDrive * (0.06 + border * 0.12) * grooveGuard);
      pos.z = groove * 0.010 * grooveGuard + border * 0.024 * depthGuard + bassDrive * vinylN * 0.016 * K * beatGuard + tick * highDrive * 0.010 * grooveGuard;
      maxRippleAmp = max(maxRippleAmp, border * 0.32 + outerRim * 0.12 + bassDrive * vinylN * 0.11 * beatGuard + tick * highDrive * 0.10 * grooveGuard + uBeat * vinylN * 0.08 * beatGuard);
    }
  } else {
    float bassGlow = smoothstep(0.07, 0.78, uBass) * 0.34 + uBeat * 0.014;
    float midGlow = smoothstep(0.07, 0.62, uMid) * 0.42;
    float highGlow = smoothstep(0.04, 0.46, uTreble) * 0.46;
    float lane = aUv.y;
    float transition = clamp(uBurstAmt, 0.0, 1.0);

    if (lane < 0.80) {
      float laneWarp = snoise(vec3(aUv.x * 0.42, lane * 1.7, t * 0.026)) * 0.11 + (hash11(aRand * 73.1) - 0.5) * 0.045;
      float warpedLane = clamp(lane + laneWarp, 0.0, 0.80);
      float bandCoord = warpedLane / 0.80 * 5.65 + snoise(vec3(aUv.x * 0.82, lane * 2.25, t * 0.032)) * 0.62;
      float band = floor(bandCoord);
      float local = fract(bandCoord + hash11(band * 9.13 + aRand * 2.4) * 0.18);
      float bandN = clamp((band + 0.5) / 5.65, 0.0, 1.0);
      float seed = hash11(band * 19.17 + aRand * 31.0);
      float flow = fract(aUv.x + t * (0.0034 + bandN * 0.0038 + seed * 0.0022) + seed * 0.53);
      float arc = (flow - 0.5) * PI * (1.35 + bandN * 0.72 + seed * 0.24);
      float armCurve = sin(arc + bandN * 2.2 + seed * 5.3);
      float spiralRadius = 9.2 + bandN * 11.8 + seed * 6.0 + local * 2.9;
      float x = cos(arc * 0.72 + bandN * 0.92 + seed * 1.3) * spiralRadius + (flow - 0.5) * (13.5 + bandN * 9.5);
      float ribbonPhase = flow * PI * 2.0 * (0.55 + bandN * 0.24 + seed * 0.10) + t * (0.010 + bandN * 0.007) + seed * 5.7;
      float broadWave = sin(ribbonPhase) * 0.92;
      float fineWave = sin(ribbonPhase * (1.36 + seed * 0.62) - t * 0.044 + seed * 5.0) * 0.045;
      float yBase = (bandN - 0.5) * 13.2 + armCurve * (2.3 + bandN * 1.6) + (seed - 0.5) * 1.85 + snoise(vec3(bandN * 2.0, flow * 0.62, seed)) * 0.92;
      float ridgeCenter = 0.43 + (seed - 0.5) * 0.18;
      float ridge = exp(-pow((local - ridgeCenter) / (0.25 + seed * 0.04), 2.0));
      float softMask = smoothstep(0.010, 0.12, lane) * (1.0 - smoothstep(0.72, 0.81, lane));
      float ribbonNoise = snoise(vec3(flow * 1.18 + seed, bandN * 2.0, t * 0.018)) * 0.74;
      float zLayer = mix(-23.5, 15.5, bandN) + (seed - 0.5) * 6.0;

      pos.x = x + ribbonNoise * 1.40 + sin(t * 0.012 + seed * 8.0) * 0.22;
      pos.y = yBase + broadWave + fineWave + (local - 0.5) * (0.58 + ridge * 0.14);
      pos.z = zLayer + broadWave * 1.35 + ribbonNoise * 1.85;

      float pulseLine = 0.5 + 0.5 * sin(ribbonPhase * (1.7 + seed * 0.9) - t * 0.32 + seed * 6.0);
      vec3 aurora = mix(vec3(0.52, 0.86, 1.0), vec3(0.70, 0.58, 1.0), bandN);
      aurora = mix(aurora, vec3(0.96, 0.98, 0.92), bassGlow * 0.05);
      vAlpha = (0.18 + ridge * 0.78 + pulseLine * highGlow * 0.035 + bassGlow * 0.025) * softMask * (0.96 + transition * 0.02);
      vColor = mix(coverColor, aurora, 0.62 + ridge * 0.22) * (0.76 + ridge * 0.86 + pulseLine * highGlow * 0.05 + bassGlow * 0.04);
      maxRippleAmp = max(maxRippleAmp, ridge * (0.12 + midGlow * 0.05) + pulseLine * highGlow * 0.045 + bassGlow * 0.030);
    } else {
      float q = (lane - 0.80) / 0.20;
      float seed = hash11(aRand * 917.0 + floor(q * 130.0));
      float depth = mix(-32.0, 18.0, seed);
      float drift = fract(aUv.x + t * (0.0014 + seed * 0.0048) + seed * 0.63);
      float cluster = snoise(vec3(seed * 2.0, q * 3.2, t * 0.007));
      float x = (drift - 0.5) * (45.0 + seed * 22.0) + cluster * 3.4;
      float y = (hash11(aRand * 331.0 + seed * 5.0) - 0.5) * 22.0 + sin(t * (0.018 + seed * 0.028) + seed * 7.0) * 0.86;
      float z = depth + sin(t * (0.020 + seed * 0.032) + aRand * 8.0) * 1.05;
      float twinkle = pow(0.5 + 0.5 * sin(t * (0.24 + seed * 0.42) + aRand * 17.0), 5.0);
      float dust = smoothstep(0.22, 0.98, hash11(aRand * 661.0 + floor(q * 160.0)));

      pos = vec3(x, y, z);
      vAlpha = dust * (0.16 + twinkle * 0.46 + highGlow * 0.025 + bassGlow * 0.018) * (1.0 - q * 0.06);
      vColor = mix(coverColor, vec3(0.92, 0.97, 1.0), 0.62 + twinkle * 0.14) * (0.72 + twinkle * 0.62 + bassGlow * 0.025);
      maxRippleAmp = max(maxRippleAmp, twinkle * highGlow * 0.055 + dust * bassGlow * 0.030);
    }

    if (transition > 0.001) {
      float bloom = smoothstep(0.0, 1.0, transition);
      vec2 burstVec = pos.xy + vec2(hash11(aRand * 31.0) - 0.5, hash11(aRand * 47.0) - 0.5) * 0.75;
      vec2 burstDir = burstVec / max(length(burstVec), 0.001);
      pos.xy += burstDir * bloom * 0.026;
      pos.xy += vec2(snoise(vec3(aRand, t * 0.014, 1.0)), snoise(vec3(aRand, t * 0.014, 5.0))) * bloom * 0.06;
      pos.xy *= 1.0 + bloom * 0.014;
      pos.z += (hash11(aRand * 123.0) - 0.5) * bloom * 0.18;
      vAlpha *= 0.86 + bloom * 0.22;
      maxRippleAmp = max(maxRippleAmp, bloom * 0.10);
    }
  }

  float mineradioVinylMask = step(9.5, uPreset) * (1.0 - step(10.5, uPreset));
  float mineradioVinylHiResGuard = smoothstep(1.08, 1.55, uCoverRes) * mineradioVinylMask;
  float edgeBoostFinal = edgeVal * uHasDepth * uEdgeEnabled * mix(1.0, 0.42, mineradioVinylHiResGuard);
  vSourceLum = dot(max(vColor, vec3(0.0)), vec3(0.299, 0.587, 0.114));
  float blackParticleGuard = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  vEdgeBoost = edgeBoostFinal * (uPreset > 3.5 ? 0.22 : 1.0) * (1.0 - blackParticleGuard);
  vColor = pow(max(vColor, vec3(0.0)), vec3(1.0 / max(0.35, uColorBoost)));
  float edgeColorMix = edgeBoostFinal * (uPreset > 3.5 ? 0.20 : 0.50) * (1.0 - blackParticleGuard);
  vColor = mix(vColor, vColor + vec3(0.20), edgeColorMix);

  vBright = 0.82 + maxRippleAmp * 0.55 + uBass * 0.10 + edgeBoostFinal * 0.30 + uEnergy * 0.05 + uBurstAmt * 0.40;
  if (uHasDepth > 0.5 && uPreset < 0.5) {
    float bgMul = mix(1.0, 0.55, 0.20 * (1.0 - fgMask));
    vBright *= bgMul;
  }
  if (uPreset > 10.5) {
    vBright = 0.94 + maxRippleAmp * 0.34 + uBass * 0.020 + uEnergy * 0.026 + uBurstAmt * 0.025;
  } else if (uPreset > 9.5) {
    vBright = 0.94 + maxRippleAmp * 0.64 + uBass * 0.08 + edgeBoostFinal * 0.12 + uEnergy * 0.05 + uBeat * 0.16 + uBurstAmt * 0.16;
  } else if (uPreset > 8.5) {
    vBright = 0.0;
  } else if (uPreset > 6.5 && uPreset < 7.5) {
    // Tunnel only; orbit (8) keeps the default vBright path like Mineradio.
    vBright = 0.88 + maxRippleAmp * 0.68 + uBass * 0.09 + uMid * 0.08 + uEnergy * 0.07 + uBeat * 0.14;
  } else if (uPreset > 5.5) {
    vBright = 0.82 + maxRippleAmp * 0.44 + uBass * 0.030 + uEnergy * 0.045 + uBurstAmt * 0.050 + uBeat * 0.07;
  } else if (uPreset > 4.5) {
    vBright = 0.94 + maxRippleAmp * 0.34 + uBass * 0.020 + uEnergy * 0.026 + uBurstAmt * 0.025 + uBeat * 0.08;
  } else if (uPreset > 1.5 && uPreset < 3.5) {
    vBright = 0.90 + maxRippleAmp * 0.76 + uBass * 0.08 + uMid * 0.08 + uEnergy * 0.08 + uBurstAmt * 0.18 + uBeat * 0.16;
  } else if (uPreset > 0.5 && uPreset < 1.5) {
    vBright = 0.84 + uBass * 0.12 + uBeat * 0.16 + maxRippleAmp * 1.35 + uEnergy * 0.14 + uBurstAmt * 0.12;
  }

  float loadingMistSize = 1.0;
  if (uLoading > 0.001) {
    float mistSeed = hash11(aRand * 931.7);
    float mistLayer = floor(mistSeed * 4.0);
    float layerN = (mistLayer + 0.5) / 4.0;
    float mistAngle = aRand * 6.2831 + uTime * (0.16 + mistSeed * 0.18) + snoise(vec3(aRand * 2.1, uTime * 0.24, 2.0)) * 1.85;
    float mistR = mix(1.35, 3.15, sqrt(hash11(aRand * 127.3))) * (1.0 + sin(uTime * 0.42 + aRand * 7.0) * 0.13);
    vec2 mistCurl = vec2(
      snoise(vec3(aRand * 4.1, uTime * 0.32, 3.0)),
      snoise(vec3(aRand * 4.7, uTime * 0.30, 8.0))
    );
    float mistBreath = 0.5 + 0.5 * sin(uTime * (0.82 + mistSeed * 0.55) + aRand * 17.0);
    float mistRibbon = sin(mistAngle * (1.35 + layerN * 0.55) + uTime * 0.34 + mistSeed * 4.0);
    float glowPick = smoothstep(0.88, 0.997, hash11(aRand * 1501.0 + mistLayer * 17.0));
    float dustPick = 0.34 + glowPick * 0.66;
    vec3 mistPos = vec3(
      cos(mistAngle) * mistR * (1.24 + mistCurl.x * 0.16) + mistCurl.x * 0.72,
      sin(mistAngle * 0.82 + mistRibbon * 0.25) * mistR * (0.56 + layerN * 0.10) + mistCurl.y * 0.62,
      (layerN - 0.5) * 4.85 + mistCurl.x * 0.56 + mistBreath * 0.36 + mistRibbon * 0.24
    );
    vec3 mistCol = mix(vec3(0.62, 0.86, 0.84), vec3(0.36, 0.46, 0.78), mistSeed);
    mistCol = mix(mistCol, vec3(0.94, 1.0, 0.97), glowPick * (0.45 + mistBreath * 0.35));
    vColor = mix(vColor, mistCol, uLoading * 0.78);
    vBright = mix(vBright, 0.20 + mistBreath * 0.18 + abs(mistCurl.x) * 0.06 + glowPick * (0.72 + abs(mistRibbon) * 0.24), uLoading);
    vAlpha = mix(vAlpha, 0.08 + mistBreath * 0.11 + dustPick * 0.11 + glowPick * 0.30, uLoading);
    pos = mix(pos, mistPos, uLoading);
    loadingMistSize = 1.26 + mistBreath * 0.24 + abs(mistRibbon) * 0.14 + glowPick * 0.78;
  }

  vRipple = clamp(maxRippleAmp * 1.5, 0.0, 1.0);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float dist = max(0.5, -mvPos.z);
  float depthSize = 36.0 / dist;
  float audioBoost = 1.0 + maxRippleAmp * 0.82 + edgeBoostFinal * 0.62 + uBeat * 0.38 + uBurstAmt * 0.62;
  float sz = clamp(depthSize * audioBoost, 1.05, 5.55);
  if (uPreset < 0.5) {
    float coverDrive = uBass * 0.10 + uMid * 0.08 + uTreble * 0.08 + uBeat * 0.12 + maxRippleAmp * 0.36;
    sz = clamp(depthSize * (1.0 + coverDrive), 1.05, 4.95);
  } else if (uPreset > 10.5) {
    float galaxyDrive = uBass * 0.070 + uMid * 0.046 + uTreble * 0.060 + uBurstAmt * 0.090 + uBeat * 0.055;
    sz = clamp(depthSize * (1.05 + galaxyDrive), 1.00, 5.45);
  } else if (uPreset > 9.5) {
    float ringDrive = uBass * 0.30 + uMid * 0.18 + uTreble * 0.22 + uBeat * 0.30;
    sz = clamp(depthSize * (0.90 + ringDrive * 0.62), 1.05, 3.90);
  } else if (uPreset > 8.5) {
    sz = 0.0;
  } else if (uPreset > 6.5 && uPreset < 7.5) {
    // Tunnel only; orbit (8) keeps the default point-size path like Mineradio.
    float originalDrive = uBass * 0.12 + uMid * 0.10 + uTreble * 0.12 + uBeat * 0.12 + maxRippleAmp * 0.38;
    sz = clamp(depthSize * (1.00 + originalDrive * 0.48), 1.00, 5.20);
  } else if (uPreset > 5.5) {
    float auroraDrive = uBass * 0.030 + uMid * 0.040 + uTreble * 0.045 + uBurstAmt * 0.045 + uBeat * 0.035;
    sz = clamp(depthSize * (0.92 + auroraDrive), 0.82, 4.10);
  } else if (uPreset > 4.5) {
    float flowDrive = uBass * 0.090 + uMid * 0.064 + uTreble * 0.082 + uBurstAmt * 0.120 + uBeat * 0.085;
    sz = clamp(depthSize * (1.05 + flowDrive), 1.00, 6.10);
  } else if (uPreset > 1.5 && uPreset < 3.5) {
    float fieldDrive = uBass * 0.12 + uMid * 0.16 + uTreble * 0.18 + uBurstAmt * 0.16 + maxRippleAmp * 0.48;
    sz = clamp(depthSize * (1.00 + fieldDrive * 0.58), 1.00, 6.35);
  } else if (uPreset > 0.5 && uPreset < 1.5) {
    float vinylDrive = uBass * 0.14 + uMid * 0.18 + uTreble * 0.28 + uBeat * 0.22 + maxRippleAmp * 0.62;
    sz = clamp(depthSize * (1.02 + vinylDrive * 0.54), 1.05, 5.90);
  }
  sz = mix(sz, sz * loadingMistSize, uLoading);
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
  col = mix(col, col * 1.42 + vec3(0.06, 0.04, 0.08), vEdgeBoost * 0.42);
  col = mix(col, col * 1.28 + vec3(0.03, 0.05, 0.08), vRipple * 0.48);
  float keepBlack = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  float nonBlack = 1.0 - keepBlack;
  float dotDist = length(gl_PointCoord - vec2(0.5)) * 2.0;
  float readableRim = smoothstep(0.44, 0.94, dotDist) * (1.0 - smoothstep(0.94, 1.08, dotDist)) * tex.a;
  float outLum = dot(col, vec3(0.299, 0.587, 0.114));
  float lightParticle = smoothstep(0.50, 0.82, outLum) * nonBlack;
  float darkParticle = (1.0 - smoothstep(0.20, 0.50, outLum)) * nonBlack;
  col = mix(col, vec3(0.0), readableRim * lightParticle * 0.38);
  col = mix(col, vec3(1.0), readableRim * darkParticle * 0.20);
  float chromaRim = smoothstep(0.54, 0.96, dotDist) * (vRipple * 0.28 + vEdgeBoost * 0.18);
  col.r += chromaRim * 0.16;
  col.b += chromaRim * 0.22;
  col = clamp(col, vec3(0.0), vec3(1.8));
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
  vec3 col = vColor * (0.62 + vBright * 0.76);
  col = mix(col, col + vec3(0.26, 0.20, 0.16), vEdgeBoost * 0.42);
  col = clamp(col, vec3(0.0), vec3(2.05));
  float pulse = 1.0 + vRipple * 0.82;
  float keepBlack = 1.0 - smoothstep(0.025, 0.115, vSourceLum);
  float bloomKeep = 1.0 - keepBlack * 0.92;
  gl_FragColor = vec4(col, soft * uAlpha * uBloomStrength * uParticleDim * pulse * 0.68 * vAlpha * bloomKeep);
}
`;
