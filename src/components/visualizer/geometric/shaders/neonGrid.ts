// src/components/visualizer/geometric/shaders/neonGrid.ts
// 霓虹网格着色器 - 音频反应的赛博朋克风格网格

export const neonGridVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const neonGridFragmentShader = `
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audioLevel;
uniform float u_bassLevel;
uniform float u_beatDetected;
uniform vec3 u_accentColor;
uniform vec3 u_primaryColor;

varying vec2 vUv;
varying vec3 vPosition;

// 哈希函数用于生成伪随机数
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 平滑噪声
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 网格线函数
float grid(vec2 uv, float lineWidth) {
    vec2 grid = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
    float line = min(grid.x, grid.y);
    return 1.0 - min(line, 1.0);
}

void main() {
    vec2 uv = vUv;

    // 网格缩放和扭曲
    float scale = 10.0 + sin(u_time * 0.5) * 2.0;
    vec2 gridUv = uv * scale;

    // 音频驱动的波浪扭曲
    float wave = sin(gridUv.x * 0.5 + u_time) * cos(gridUv.y * 0.5 + u_time * 0.7);
    gridUv += wave * u_bassLevel * 0.3;

    // 主网格
    float mainGrid = grid(gridUv, 0.05);

    // 子网格（更细的线）
    float subGrid = grid(gridUv * 5.0, 0.02) * 0.3;

    // 合并网格
    float finalGrid = max(mainGrid, subGrid);

    // 音频脉冲
    float pulse = sin(u_time * 3.0 + length(gridUv - vec2(5.0)) * 0.5) * 0.5 + 0.5;
    pulse *= u_audioLevel;

    // 节拍闪烁
    float beatPulse = u_beatDetected * 2.0;

    // 霓虹发光
    vec3 gridColor = u_accentColor * finalGrid * (1.0 + pulse + beatPulse);

    // 中心热点
    float centerDist = length(uv - vec2(0.5));
    float hotspot = exp(-centerDist * 3.0) * u_bassLevel;
    gridColor += u_primaryColor * hotspot * 0.5;

    // 添加噪声纹理
    float n = noise(gridUv * 2.0 + u_time * 0.1);
    gridColor += vec3(n * 0.1);

    // 边缘渐变
    float vignette = 1.0 - centerDist * 0.8;
    gridColor *= vignette;

    gl_FragColor = vec4(gridColor, 1.0);
}
`;

export const createNeonGridMaterial = (uniforms: any) => {
    return {
        uniforms,
        vertexShader: neonGridVertexShader,
        fragmentShader: neonGridFragmentShader,
        transparent: true,
        blending: 2, // AdditiveBlending
    };
};
