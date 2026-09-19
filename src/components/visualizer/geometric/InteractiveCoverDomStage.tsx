import React, { useMemo } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import type { Interactive3dSceneTuning, Theme } from '../../../types';
import type { GeometricQualityProfile } from './geometricQuality';
import { colorWithAlpha } from '../colorMix';
import { normalizeInteractive3dVisualPreset } from './mineradioVisualPresets';
import { useInteractiveSceneTransforms } from './useInteractiveSceneTransforms';
import {
    buildInteractiveCoverDomParticles,
    resolveInteractiveCoverDomPresetStyle,
} from '../../../utils/visualizer/interactiveCoverDomMath';

// src/components/visualizer/geometric/InteractiveCoverDomStage.tsx
// Electron-safe interactive3d stage: CSS 3D cover + soft particles (no WebGL).

export interface InteractiveCoverDomStageProps {
    theme: Theme;
    coverUrl?: string | null;
    sceneTuning?: Interactive3dSceneTuning;
    qualityProfile: GeometricQualityProfile;
    audioPower: MotionValue<number>;
    beatPulse?: MotionValue<number>;
    atmosphereEnergy?: MotionValue<number>;
    pointerX: MotionValue<number>;
    pointerY: MotionValue<number>;
    smartAtmosphereEnabled?: boolean;
    seed?: string | number;
    paused?: boolean;
}

const InteractiveCoverDomStage: React.FC<InteractiveCoverDomStageProps> = ({
    theme,
    coverUrl,
    sceneTuning,
    qualityProfile,
    audioPower,
    beatPulse,
    atmosphereEnergy,
    pointerX,
    pointerY,
    smartAtmosphereEnabled = true,
    seed = 'interactive3d',
    paused = false,
}) => {
    const preset = normalizeInteractive3dVisualPreset(sceneTuning?.visualPreset);
    const style = useMemo(
        () => resolveInteractiveCoverDomPresetStyle(preset, qualityProfile.tier),
        [preset, qualityProfile.tier],
    );
    const particles = useMemo(
        () => buildInteractiveCoverDomParticles(`${seed}:${style.preset}`, style.particleCount),
        [seed, style.particleCount, style.preset],
    );

    const transforms = useInteractiveSceneTransforms({
        audioPower,
        pointerX,
        pointerY,
        beatPulse,
        atmosphereEnergy,
        cinemaShake: sceneTuning?.cinemaShake ?? 0.45,
        rhythmIntensity: (sceneTuning?.rhythmIntensity ?? 0.85) * (smartAtmosphereEnabled ? 1 : 0.35),
        atmosphereSensitivity: sceneTuning?.atmosphereSensitivity ?? 1,
        cameraPunchStrength: sceneTuning?.cameraPunchStrength ?? 1,
        enabled: !paused,
    });

    const wash = `radial-gradient(ellipse at 50% 42%, ${colorWithAlpha(theme.secondaryColor, 0.34)} 0%, ${colorWithAlpha(theme.backgroundColor, 0.82)} 52%, rgba(2, 6, 10, 0.96) 100%)`;

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            data-testid="interactive-cover-dom-stage"
            data-visual-preset={style.preset}
            data-renderer="dom-cover"
            aria-hidden
        >
            <div
                className="absolute inset-0"
                style={{
                    background: wash,
                    opacity: style.washOpacity,
                }}
            />
            {coverUrl ? (
                <div
                    className="absolute inset-0 scale-125"
                    style={{
                        backgroundImage: `url(${coverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(48px) saturate(1.15)',
                        opacity: 0.38,
                        transform: 'translateZ(-80px)',
                    }}
                />
            ) : null}

            <motion.div
                className="absolute inset-0"
                style={{
                    x: transforms.sceneX,
                    y: transforms.sceneY,
                    rotate: transforms.sceneRotate,
                    scale: transforms.sceneScale,
                    rotateX: transforms.tiltX,
                    rotateY: transforms.tiltY,
                    transformStyle: 'preserve-3d',
                }}
            >
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            width: particle.size,
                            height: particle.size,
                            opacity: particle.opacity,
                            backgroundColor: theme.accentColor,
                            boxShadow: `0 0 ${Math.max(4, particle.size * 2)}px ${colorWithAlpha(theme.accentColor, 0.35)}`,
                            transform: `translate3d(-50%, -50%, ${particle.depth}px)`,
                        }}
                    />
                ))}

                <motion.div
                    className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: `min(52vmin, ${Math.round(420 * style.coverScale)}px)`,
                        aspectRatio: '1 / 1',
                        transformStyle: 'preserve-3d',
                    }}
                    animate={
                        style.spinSeconds > 0 && !paused
                            ? { rotateY: 360 }
                            : { rotateY: style.coverRotateY }
                    }
                    transition={
                        style.spinSeconds > 0 && !paused
                            ? { duration: style.spinSeconds, ease: 'linear', repeat: Infinity }
                            : { duration: 0.6 }
                    }
                >
                    <div
                        className="h-full w-full overflow-hidden rounded-[28px]"
                        style={{
                            backgroundColor: colorWithAlpha(theme.backgroundColor, 0.55),
                            border: `1px solid ${colorWithAlpha(theme.secondaryColor, 0.22)}`,
                            boxShadow: `
                                0 28px 80px ${colorWithAlpha('#000000', 0.55)},
                                0 0 0 1px ${colorWithAlpha(theme.primaryColor, 0.06)} inset
                            `,
                            filter: style.coverBlurPx > 0 ? `blur(${style.coverBlurPx}px)` : undefined,
                            transform: `rotateY(${style.coverRotateY}deg) translateZ(40px)`,
                        }}
                    >
                        {coverUrl ? (
                            <img
                                src={coverUrl}
                                alt=""
                                draggable={false}
                                className="h-full w-full object-cover"
                                style={{ display: 'block' }}
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center text-sm opacity-50"
                                style={{ color: theme.secondaryColor }}
                            >
                                Lyra
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default InteractiveCoverDomStage;
