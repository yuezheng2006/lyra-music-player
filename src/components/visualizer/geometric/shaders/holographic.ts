// src/components/visualizer/geometric/shaders/holographic.ts
// 全息投影着色器 - 彩虹色散和扫描线效果

export const holographicVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
}
`;

export const holographicFragmentShader = `
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audioLevel;
uniform float u_bassLevel;
uniform float u_beatDetected;
uniform vec3 u_accentColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// RGB 分离函数
vec3 rgbShift(vec2 uv, float amount) {
    vec3 color;
    color.r = sin((uv.x + u_time * 0.1) * 10.0 + amount) * 0.5 + 0.5;
    color.g = sin((uv.y + u_time * 0.15) * 10.0 + amount * 1.5) * 0.5 + 0.5;
    color.b = sin((uv.x + uv.y + u_time * 0.2) * 10.0 + amount * 2.0) * 0.5 + 0.5;
    return color;
}

// 扫描线
float scanline(vec2 uv, float thickness) {
    float scan = sin(uv.y * u_resolution.y * thickness + u_time * 5.0);
    return scan * 0.5 + 0.5;
}

// 故障效果
float glitch(vec2 uv, float intensity) {
    float glitchLine = step(0.98, sin(uv.y * 50.0 + u_time * 10.0));
    float glitchOffset = (sin(u_time * 20.0) * 0.5 + 0.5) * glitchLine * intensity;
    return glitchOffset;
}

void main() {
    vec2 uv = vUv;

    // 菲涅尔效果
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);

    // RGB 色散
    float dispersionAmount = fresnel * 2.0 + u_audioLevel;
    vec3 rainbow = rgbShift(uv, dispersionAmount);

    // 全息扫描线
    float scan = scanline(uv, 2.0);
    rainbow *= (0.7 + scan * 0.3);

    // 音频驱动的波纹
    float wave = sin(length(uv - vec2(0.5)) * 20.0 - u_time * 3.0);
    wave *= u_bassLevel;
    rainbow += vec3(wave * 0.2);

    // 节拍闪烁
    rainbow += vec3(u_beatDetected * 0.3);

    // 故障效果（随机触发）
    float glitchIntensity = step(0.95, sin(u_time * 0.5)) * u_audioLevel;
    float glitchAmount = glitch(uv, glitchIntensity);
    uv.x += glitchAmount * 0.05;

    // 边缘发光
    float edgeGlow = fresnel * 1.5;
    rainbow += u_accentColor * edgeGlow;

    // 透明度基于菲涅尔
    float alpha = 0.3 + fresnel * 0.7;

    gl_FragColor = vec4(rainbow, alpha);
}
`;

export const createHolographicMaterial = (uniforms: any) => {
    return {
        uniforms,
        vertexShader: holographicVertexShader,
        fragmentShader: holographicFragmentShader,
        transparent: true,
        blending: 2, // AdditiveBlending
        side: 2, // DoubleSide
    };
};
