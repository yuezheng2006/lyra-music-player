import type { LyricColorPresetId } from '../../../utils/theme/lyricColorPresets';

// src/components/visualizer/effects/LyricTextEffects.tsx
// CSS/Web Animations lyric effects used by preset previews and optional DOM overlays.

export type LyricEffectPreset = LyricColorPresetId;

export interface LyricEffectConfig {
    preset: LyricEffectPreset;
    intensity: 'calm' | 'normal' | 'chaotic';
    enableParticles: boolean;
    enableGlow: boolean;
    enableStroke: boolean;
}

type AudioEffectData = {
    bassLevel: number;
    volumeLevel: number;
    beatDetected: boolean;
};

const PRESET_GLOW: Record<LyricEffectPreset, string[]> = {
    'midnight-default': ['#fafafa', '#b8b8c2'],
    'douyin-neon': ['#00f5ff', '#fe2c55'],
    'douyin-purple': ['#9333ea', '#e879f9'],
    'xhs-morandi': ['#d4738f', '#9a6b7a'],
    'xhs-note-red': ['#ff2442', '#ff6b8a'],
    'dazibao-red': ['#de2910', '#ff3b30'],
};

const resolveGlowShadow = (preset: LyricEffectPreset, level = 0.5) => {
    const [primary, secondary] = PRESET_GLOW[preset];
    const boost = Math.max(0, Math.min(1, level));
    return [
        `0 0 ${8 + boost * 12}px ${primary}`,
        `0 0 ${18 + boost * 24}px ${primary}`,
        `0 0 ${30 + boost * 34}px ${secondary}`,
    ].join(', ');
};

// Runs a cancellable breathing glow without introducing an extra animation library.
const animateBreathingGlow = (
    element: HTMLElement,
    preset: LyricEffectPreset,
    audioLevel = 0.5,
    duration = 1400,
) => element.animate(
    [
        { textShadow: resolveGlowShadow(preset, audioLevel * 0.5), transform: 'scale(1)' },
        { textShadow: resolveGlowShadow(preset, audioLevel), transform: `scale(${1.025 + audioLevel * 0.045})` },
    ],
    {
        duration,
        direction: 'alternate',
        easing: 'ease-in-out',
        iterations: Infinity,
    },
);

export const applyDouyinNeonEffect = (element: HTMLElement, audioLevel = 0.5) => (
    animateBreathingGlow(element, 'douyin-neon', audioLevel, 1180)
);

export const applyDouyinPurpleEffect = (element: HTMLElement, audioLevel = 0.5) => {
    const glow = animateBreathingGlow(element, 'douyin-purple', audioLevel, 1500);
    const hue = element.animate(
        [
            { filter: 'hue-rotate(0deg) saturate(1.05)' },
            { filter: 'hue-rotate(54deg) saturate(1.25)' },
            { filter: 'hue-rotate(0deg) saturate(1.05)' },
        ],
        { duration: 3600, easing: 'linear', iterations: Infinity },
    );
    return [glow, hue];
};

export const applyXhsMorandiEffect = (element: HTMLElement) => (
    animateBreathingGlow(element, 'xhs-morandi', 0.36, 3200)
);

export const applyXhsNoteRedEffect = (element: HTMLElement, text: string) => {
    element.textContent = text;
    return element.animate(
        [
            { opacity: 0.18, filter: 'blur(5px)', transform: 'translateY(8px)' },
            { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
        ],
        { duration: Math.max(240, text.length * 36), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
};

export const applyDazibaoRedEffect = (element: HTMLElement, beatDetected = false) => (
    element.animate(
        [
            { textShadow: resolveGlowShadow('dazibao-red', 0.45), transform: 'scale(1) rotate(0deg)' },
            {
                textShadow: resolveGlowShadow('dazibao-red', beatDetected ? 1 : 0.72),
                transform: `scale(${beatDetected ? 1.16 : 1.08}) rotate(${beatDetected ? 1.8 : 0}deg)`,
            },
            { textShadow: resolveGlowShadow('dazibao-red', 0.38), transform: 'scale(1) rotate(0deg)' },
        ],
        { duration: beatDetected ? 420 : 900, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    )
);

export const applyStaggerAnimation = (
    elements: HTMLElement[],
    preset: LyricEffectPreset,
) => {
    const animations = elements.map((element, index) => element.animate(
        [
            { opacity: 0, transform: 'translateY(26px) scale(0.88)' },
            { opacity: 1, transform: 'translateY(0) scale(1)', textShadow: resolveGlowShadow(preset, 0.42) },
        ],
        {
            delay: index * 42,
            duration: 520,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'both',
        },
    ));

    return animations;
};

export const syncAnimationWithAudio = (
    element: HTMLElement,
    audioData: AudioEffectData,
    preset: LyricEffectPreset,
) => {
    const { bassLevel, volumeLevel, beatDetected } = audioData;
    element.style.transform = `scale(${(1 + volumeLevel * 0.16).toFixed(3)})`;
    element.style.filter = `brightness(${(1 + bassLevel * 0.38).toFixed(3)})`;
    element.style.textShadow = resolveGlowShadow(preset, bassLevel * 0.75 + volumeLevel * 0.25);

    if (beatDetected) {
        applyDazibaoRedEffect(element, preset === 'dazibao-red');
    }
};

export const createParticleExplosion = (
    container: HTMLElement,
    centerX: number,
    centerY: number,
    color: string,
    count = 20,
) => {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 * i) / count;
        const distance = 46 + ((i * 37) % 80);
        particle.style.cssText = [
            'position:absolute',
            'width:4px',
            'height:4px',
            'border-radius:9999px',
            `background:${color}`,
            `left:${centerX}px`,
            `top:${centerY}px`,
            'pointer-events:none',
        ].join(';');
        container.appendChild(particle);
        particle.animate(
            [
                { opacity: 1, transform: 'translate(0, 0) scale(1)' },
                {
                    opacity: 0,
                    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                },
            ],
            { duration: 760 + (i % 5) * 70, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        ).addEventListener('finish', () => particle.remove(), { once: true });
    }
};

export const cleanupLyricEffects = (element: HTMLElement) => {
    element.getAnimations().forEach(animation => animation.cancel());
    element.style.transform = '';
    element.style.textShadow = '';
    element.style.filter = '';
};
