// src/utils/audio/lyricAudioSync.ts
// 歌词音频同步引擎 - 实现歌词色彩与音频的实时联动

export interface AudioAnalyzerData {
    frequencyData: Uint8Array;
    timeData: Uint8Array;
    bassLevel: number; // 0-1, 低音强度
    midLevel: number; // 0-1, 中音强度
    trebleLevel: number; // 0-1, 高音强度
    volumeLevel: number; // 0-1, 整体音量
    beatDetected: boolean;
    tempo: number; // BPM
}

export interface LyricAudioSyncConfig {
    enableFrequencySync: boolean;
    enableBeatSync: boolean;
    enableVolumeSync: boolean;
    colorSensitivity: number; // 0-1, 色彩变化灵敏度
    glowSensitivity: number; // 0-1, 发光效果灵敏度
    scaleSensitivity: number; // 0-1, 缩放效果灵敏度
}

export const DEFAULT_AUDIO_SYNC_CONFIG: LyricAudioSyncConfig = {
    enableFrequencySync: true,
    enableBeatSync: true,
    enableVolumeSync: true,
    colorSensitivity: 0.7,
    glowSensitivity: 0.8,
    scaleSensitivity: 0.6,
};

/**
 * 音频分析器类 - 从 AudioContext 提取实时音频特征
 */
export class AudioAnalyzer {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;

    private frequencyData: Uint8Array;
    private timeData: Uint8Array;

    private beatHistory: number[] = [];
    private lastBeatTime: number = 0;
    private estimatedTempo: number = 120;

    constructor(private audioElement: HTMLAudioElement) {
        this.initialize();

        this.frequencyData = new Uint8Array(512);
        this.timeData = new Uint8Array(512);
    }

    private initialize() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.8;

            // 连接音频源
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        } catch (error) {
            console.error('Failed to initialize AudioAnalyzer:', error);
        }
    }

    /**
     * 获取实时音频分析数据
     */
    analyze(): AudioAnalyzerData {
        if (!this.analyser) {
            return this.getEmptyData();
        }

        // 获取频率和时域数据
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeData);

        // 计算频段能量
        const bassLevel = this.getFrequencyBandEnergy(20, 250);
        const midLevel = this.getFrequencyBandEnergy(250, 4000);
        const trebleLevel = this.getFrequencyBandEnergy(4000, 20000);

        // 计算整体音量
        const volumeLevel = this.calculateVolume();

        // 检测节拍
        const beatDetected = this.detectBeat(bassLevel);

        return {
            frequencyData: this.frequencyData,
            timeData: this.timeData,
            bassLevel,
            midLevel,
            trebleLevel,
            volumeLevel,
            beatDetected,
            tempo: this.estimatedTempo,
        };
    }

    /**
     * 计算指定频率范围的能量 (0-1)
     */
    private getFrequencyBandEnergy(minFreq: number, maxFreq: number): number {
        if (!this.analyser) return 0;

        const nyquist = (this.audioContext?.sampleRate || 44100) / 2;
        const minIndex = Math.floor((minFreq / nyquist) * this.frequencyData.length);
        const maxIndex = Math.ceil((maxFreq / nyquist) * this.frequencyData.length);

        let sum = 0;
        let count = 0;

        for (let i = minIndex; i < maxIndex && i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
            count++;
        }

        return count > 0 ? (sum / count) / 255 : 0;
    }

    /**
     * 计算整体音量 (0-1)
     */
    private calculateVolume(): number {
        let sum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return (sum / this.frequencyData.length) / 255;
    }

    /**
     * 节拍检测算法
     */
    private detectBeat(bassLevel: number): boolean {
        const now = performance.now();
        const threshold = 0.6; // 节拍阈值

        // 简单的能量阈值检测
        if (bassLevel > threshold && now - this.lastBeatTime > 200) {
            this.lastBeatTime = now;

            // 更新节拍历史用于 BPM 估算
            this.beatHistory.push(now);
            if (this.beatHistory.length > 8) {
                this.beatHistory.shift();
            }

            this.estimateTempo();

            return true;
        }

        return false;
    }

    /**
     * 估算 BPM
     */
    private estimateTempo() {
        if (this.beatHistory.length < 3) return;

        const intervals: number[] = [];
        for (let i = 1; i < this.beatHistory.length; i++) {
            intervals.push(this.beatHistory[i] - this.beatHistory[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        this.estimatedTempo = Math.round(60000 / avgInterval);
    }

    private getEmptyData(): AudioAnalyzerData {
        return {
            frequencyData: new Uint8Array(512),
            timeData: new Uint8Array(512),
            bassLevel: 0,
            midLevel: 0,
            trebleLevel: 0,
            volumeLevel: 0,
            beatDetected: false,
            tempo: 120,
        };
    }

    dispose() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

/**
 * 将音频数据映射到歌词色彩参数
 */
export const mapAudioToLyricStyle = (
    audioData: AudioAnalyzerData,
    config: LyricAudioSyncConfig
): {
    hueShift: number; // 色相偏移 (-180 to 180)
    saturationMultiplier: number; // 饱和度倍数 (0.5 to 2)
    brightnessMultiplier: number; // 亮度倍数 (0.5 to 2)
    glowIntensity: number; // 发光强度 (0 to 2)
    scale: number; // 缩放倍数 (0.9 to 1.2)
    shadowBlur: number; // 阴影模糊 (0 to 30)
} => {
    const { bassLevel, midLevel, trebleLevel, volumeLevel, beatDetected } = audioData;
    const { colorSensitivity, glowSensitivity, scaleSensitivity } = config;

    // 频率映射到色相 (低音→红，中音→绿，高音→蓝)
    const hueShift = config.enableFrequencySync
        ? ((bassLevel * -60) + (trebleLevel * 60)) * colorSensitivity
        : 0;

    // 音量映射到饱和度和亮度
    const saturationMultiplier = config.enableVolumeSync
        ? 0.8 + (volumeLevel * 0.4) * colorSensitivity
        : 1;

    const brightnessMultiplier = config.enableVolumeSync
        ? 0.9 + (volumeLevel * 0.3) * colorSensitivity
        : 1;

    // 低音映射到发光强度
    const glowIntensity = config.enableVolumeSync
        ? bassLevel * 1.5 * glowSensitivity
        : 0;

    // 节拍触发缩放
    const beatScale = config.enableBeatSync && beatDetected ? 0.15 : 0;
    const scale = 1.0 + (beatScale * scaleSensitivity);

    // 音量映射到阴影
    const shadowBlur = volumeLevel * 20 * glowSensitivity;

    return {
        hueShift,
        saturationMultiplier,
        brightnessMultiplier,
        glowIntensity,
        scale,
        shadowBlur,
    };
};

/**
 * 应用音频同步样式到歌词元素
 */
export const applyAudioSyncStyle = (
    element: HTMLElement,
    baseColor: string,
    audioStyle: ReturnType<typeof mapAudioToLyricStyle>
): void => {
    const { hueShift, saturationMultiplier, brightnessMultiplier, glowIntensity, scale, shadowBlur } = audioStyle;

    // 计算调整后的颜色
    const hslColor = rgbToHsl(hexToRgb(baseColor));
    const adjustedHsl = {
        h: (hslColor.h + hueShift + 360) % 360,
        s: Math.min(100, hslColor.s * saturationMultiplier),
        l: Math.min(100, hslColor.l * brightnessMultiplier),
    };

    const finalColor = hslToHex(adjustedHsl);

    // 应用样式
    element.style.color = finalColor;
    element.style.transform = `scale(${scale})`;

    // 发光效果
    if (glowIntensity > 0.1) {
        const glowColor = finalColor;
        element.style.textShadow = `
            0 0 ${10 * glowIntensity}px ${glowColor},
            0 0 ${20 * glowIntensity}px ${glowColor},
            0 0 ${shadowBlur}px rgba(255, 255, 255, 0.3)
        `;
    } else {
        element.style.textShadow = 'none';
    }
};

// 颜色转换辅助函数
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(hsl: { h: number; s: number; l: number }): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r: number;
    let g: number;
    let b: number;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
