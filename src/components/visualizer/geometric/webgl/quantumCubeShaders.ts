// src/components/visualizer/geometric/webgl/quantumCubeShaders.ts
// Cover-tinted SDF crystal cube shader adapted for the interactive 3D backdrop.

export const QUANTUM_CUBE_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const QUANTUM_CUBE_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uBass, uMid, uTreble, uBeat, uEnergy, uColorMixT;
uniform vec3 uCamPos;
uniform sampler2D uCoverTex;
uniform sampler2D uPrevCoverTex;
varying vec2 vUv;

mat2 rot2d(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float mapCube(vec3 p) {
  vec3 q = p;
  q.xy *= rot2d(iTime * 0.15);
  q.yz *= rot2d(iTime * 0.25);
  return sdBox(q, vec3(0.40 + uBass * 0.012));
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    mapCube(p + e.xyy) - mapCube(p - e.xyy),
    mapCube(p + e.yxy) - mapCube(p - e.yxy),
    mapCube(p + e.yyx) - mapCube(p - e.yyx)
  ));
}

vec3 coverAt(vec2 uv) {
  vec2 safeUv = clamp(uv, vec2(0.0012), vec2(0.9988));
  return mix(texture2D(uPrevCoverTex, safeUv).rgb, texture2D(uCoverTex, safeUv).rgb, clamp(uColorMixT, 0.0, 1.0));
}

vec3 crystalField(vec3 p, vec3 normal, vec3 coverColor) {
  vec3 q = p * 0.1;
  q.yz *= rot2d(-iTime * 0.25);
  q.xy *= rot2d(-iTime * 0.15);
  q.xz *= rot2d(iTime * 0.08 * (1.0 + uMid * 0.08));
  q.yz *= rot2d(iTime * 0.05 * (1.0 + uTreble * 0.08));

  vec3 accum = vec3(0.0);
  float scaleFactor = 0.3;
  vec3 colorA = mix(vec3(0.00, 0.333, 1.00), coverColor, 0.08);
  vec3 colorB = mix(vec3(0.20, 0.333, 1.00), coverColor.bgr, 0.06);
  vec3 colorC = mix(vec3(1.00, 0.600, 0.00), coverColor.grb, 0.05);

  for(int i=0; i<8; i++) {
    vec3 morph = vec3(0.14, 0.22, 0.14)
      + sin(iTime * 0.4 * (1.0 + uMid * 0.08) + float(i) * 1.5) * 0.003;
    q = abs(q) - morph;
    if(q.x < q.y) q.xy = q.yx;
    if(q.x < q.z) q.xz = q.zx;
    if(q.y < q.z) q.yz = q.zy;
    q.xy *= rot2d(0.785 + float(i) * 0.02 + sin(iTime * 0.3 + float(i)) * 0.015);
    q.xz *= rot2d(0.35 + cos(iTime * 0.25 - float(i)) * 0.015);
    q.x = q.x * 1.85 - 0.02;
    q.y = q.y * 1.85 - 0.08;
    q.z = q.z * 1.65 - 0.04;
    scaleFactor *= 2.13;

    float edge = smoothstep(0.12, 0.0, abs(max(q.x, max(q.y, q.z))) - 0.01);
    vec3 layerColor = (i == 0 || i == 3 || i == 6) ? colorA : ((i == 1 || i == 4 || i == 7) ? colorB : colorC);
    float line = smoothstep(0.80, 1.0, sin(q.y * -6.5));
    accum += (layerColor + vec3(4.6, 0.95, 0.9) * line * 8.3) * edge / scaleFactor;
  }

  vec3 localP = p;
  vec3 localN = normal;
  localP.xy *= rot2d(iTime * 0.15);
  localP.yz *= rot2d(iTime * 0.25);
  localN.xy *= rot2d(iTime * 0.15);
  localN.yz *= rot2d(iTime * 0.25);
  vec3 absN = abs(localN);
  float slice = localP.y;
  if(absN.y > absN.x && absN.y > absN.z) slice = localP.x;
  float scanlines = step(0.60, fract(slice * 65.9)) * -1.65 + 1.75;
  float core = exp(-length(p) * 20.1) * 0.25;
  return (accum * 79.1 + vec3(0.0, 0.5, 1.0) * core) * scanlines;
}

vec4 accumulateVolume(vec3 ro, vec3 rd, vec3 normal, vec3 coverColor) {
  vec3 color = vec3(0.0);
  float alpha = 0.0;
  for(int j=0; j<23; j++) {
    vec3 p = ro + rd * (float(j) * 0.022);
    if(mapCube(p) > 0.01) break;
    vec3 r = crystalField(p + vec3(0.022, 0.0, 0.0), normal, coverColor);
    vec3 g = crystalField(p, normal, coverColor);
    vec3 b = crystalField(p - vec3(0.022, 0.0, 0.0), normal, coverColor);
    color += vec3(r.r, g.g, b.b) * 0.065;
    alpha += 0.08;
    if(alpha >= 1.2) { alpha = 0.5; break; }
  }
  return vec4(color, alpha);
}

void main() {
  vec2 uv = (vUv - 0.5) * iResolution.xy / max(1.0, iResolution.y);
  vec3 ro = uCamPos;
  vec3 forward = normalize(vec3(0.0) - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  vec3 rd = normalize(forward + uv.x * right + uv.y * up);
  vec3 coverColor = coverAt(vUv);

  vec3 finalColor = vec3(0.0);
  float tCube = 0.6;
  bool hit = false;
  vec3 hitPos = vec3(0.0);
  for(int i=0; i<80; i++) {
    hitPos = ro + rd * tCube;
    float d = mapCube(hitPos);
    if(d < 0.001) { hit = true; break; }
    tCube += d;
    if(tCube >= 10.0) break;
  }

  if(hit) {
    vec3 normal = calcNormal(hitPos);
    vec3 qEdge = hitPos;
    qEdge.xy *= rot2d(iTime * 0.15);
    qEdge.yz *= rot2d(iTime * 0.25);
    vec3 distEdge = smoothstep(0.37, 0.397, abs(qEdge));
    float edgeMask = max(distEdge.x * distEdge.y, max(distEdge.y * distEdge.z, distEdge.z * distEdge.x));
    vec4 volume = accumulateVolume(hitPos + rd * 0.01, rd, normal, coverColor);
    vec3 lightDir = normalize(vec3(2.0, 4.0, -3.0));
    vec3 refl = reflect(rd, normal);
    float specular = pow(max(dot(refl, lightDir), 0.0), 40.4) * (0.4 + uBeat * 0.08);
    float fresnel = pow(1.0 - max(dot(normal, -rd), -0.5), 4.0);
    vec3 edgeGlow = vec3(0.0, 1.75, 1.0) * edgeMask * (uBeat * 0.35 + uTreble * 0.20);
    finalColor = volume.xyz + edgeGlow + vec3(specular);
    finalColor = mix(finalColor, vec3(0.2, 0.65, 1.0), fresnel * 0.45);
  }

  finalColor = finalColor / (finalColor + vec3(1.0));
  finalColor = pow(finalColor, vec3(0.4545));
  gl_FragColor = vec4(finalColor, hit ? 0.94 : 0.0);
}
`;
