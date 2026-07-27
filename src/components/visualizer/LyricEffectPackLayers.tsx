import React from 'react';
import type { ResolvedLyricEffectPack } from '../../utils/lyricEffectPacks';
import type { LyricWordStatus } from '../../utils/lyrics/lyricWordStatusMath';
import { colorWithAlpha } from './colorMix';

// src/components/visualizer/LyricEffectPackLayers.tsx
// Shared DOM garnish for yehuo echo / neon glow / glitch RGB twins (beat via CSS vars).

type LyricEffectPackLayersProps = {
    glyph: React.ReactNode;
    status: LyricWordStatus;
    effectPack: ResolvedLyricEffectPack;
    glowColor: string;
    fontPx: number;
    /** Optional type styles shared with the face glyph (dazibao). */
    typeStyle?: React.CSSProperties;
};

/** Echo / glow / glitch twins behind the lyric face; neon scan is a class on the face itself. */
const LyricEffectPackLayers: React.FC<LyricEffectPackLayersProps> = ({
    glyph,
    status,
    effectPack,
    glowColor,
    fontPx,
    typeStyle,
}) => {
    const glitchActive = effectPack.glitch && status === 'active';
    const glowBeatActive = effectPack.glowBoost > 0 && status === 'active';
    const echoActive = effectPack.echo && status !== 'active';

    if (!echoActive && !glowBeatActive && !glitchActive) {
        return null;
    }

    return (
        <>
            {echoActive ? (
                <span
                    aria-hidden
                    className="absolute inset-0 select-none pointer-events-none"
                    style={{
                        ...typeStyle,
                        color: colorWithAlpha('#000000', Math.min(0.7, effectPack.echoOpacity + 0.18)),
                        opacity: `calc(${effectPack.echoOpacity} * var(--lyric-pack-echo-mul, 1))`,
                        transform: `scale(calc(${effectPack.echoScale} * (0.92 + 0.08 * var(--lyric-pack-echo-mul, 1)))) translate(0.03em, 0.05em)`,
                        transformOrigin: 'center center',
                        filter: 'blur(0.35px)',
                    } as React.CSSProperties}
                >
                    {glyph}
                </span>
            ) : null}
            {glowBeatActive ? (
                <span
                    aria-hidden
                    className="absolute inset-0 select-none pointer-events-none"
                    style={{
                        ...typeStyle,
                        color: 'transparent',
                        opacity: `calc(${0.2 + effectPack.glowBoost * 0.25} * var(--lyric-pack-glow-mul, 1))`,
                        textShadow: `0 0 ${Math.round(fontPx * (0.18 + effectPack.glowBoost * 0.28))}px ${colorWithAlpha(glowColor, 0.55)}`,
                    } as React.CSSProperties}
                >
                    {glyph}
                </span>
            ) : null}
            {glitchActive ? (
                <>
                    <span
                        aria-hidden
                        className="absolute inset-0 select-none pointer-events-none mix-blend-screen"
                        style={{
                            ...typeStyle,
                            color: colorWithAlpha('#ff3b5c', 0.28),
                            opacity: 'calc(0.55 * var(--lyric-pack-glitch-mul, 1))',
                            transform: `translate(calc(${-effectPack.glitchOffsetPx}px * var(--lyric-pack-glitch-mul, 1)), 0)`,
                        } as React.CSSProperties}
                    >
                        {glyph}
                    </span>
                    <span
                        aria-hidden
                        className="absolute inset-0 select-none pointer-events-none mix-blend-screen"
                        style={{
                            ...typeStyle,
                            color: colorWithAlpha('#3bd6ff', 0.28),
                            opacity: 'calc(0.55 * var(--lyric-pack-glitch-mul, 1))',
                            transform: `translate(calc(${effectPack.glitchOffsetPx}px * var(--lyric-pack-glitch-mul, 1)), 0)`,
                        } as React.CSSProperties}
                    >
                        {glyph}
                    </span>
                </>
            ) : null}
        </>
    );
};

export const isLyricEffectPackNeonActive = (
    effectPack: ResolvedLyricEffectPack,
    status: LyricWordStatus,
): boolean => effectPack.neonScan && status === 'active';

export default LyricEffectPackLayers;
