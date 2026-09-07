import React, { useMemo } from 'react';
import { useMotionValue, type MotionValue } from 'framer-motion';
import type { Interactive3dSceneTuning, Theme } from '../../../../types';
import { normalizeInteractive3dVisualPreset } from '../mineradioVisualPresets';
import { colorWithAlpha } from '../../colorMix';
import { resolveCoverAtmosphereDownsampleStyle } from '../../../../utils/visualizer/coverAtmosphereDownsample';
import { useCoverAtmosphereBreath } from './useCoverAtmosphereBreath';

// src/components/visualizer/geometric/cover-atmosphere/CoverAtmosphereStage.tsx
// Soft karaoke atmosphere: downsampled cover blur + theme wash. Lyrics stay a separate compositor.

export type CoverAtmosphereStageProps = {
    theme: Theme;
    sceneTuning?: Interactive3dSceneTuning;
    coverUrl?: string | null;
    atmosphereEnergy?: MotionValue<number>;
    audioPower?: MotionValue<number>;
    yielded?: boolean;
    playing?: boolean;
};

const CoverAtmosphereStage: React.FC<CoverAtmosphereStageProps> = ({
    theme,
    sceneTuning,
    coverUrl,
    atmosphereEnergy,
    audioPower,
    yielded = false,
    playing = true,
}) => {
    const preset = normalizeInteractive3dVisualPreset(sceneTuning?.visualPreset);
    const fallbackEnergy = useMotionValue(0.42);
    const fallbackPower = useMotionValue(0);
    const energyMv = atmosphereEnergy ?? fallbackEnergy;
    const powerMv = audioPower ?? fallbackPower;
    const washRef = useCoverAtmosphereBreath({
        energy: energyMv,
        power: powerMv,
        playing,
    });

    const wash = useMemo(() => {
        const accent = colorWithAlpha(theme.accentColor || theme.primaryColor || '#b19eef', 0.34);
        const primary = colorWithAlpha(theme.primaryColor || '#fafafa', 0.12);
        const bg = colorWithAlpha(theme.backgroundColor || '#09090b', 0.55);
        return {
            gradient: [
                `radial-gradient(ellipse 70% 55% at 50% 40%, ${accent} 0%, transparent 62%)`,
                `radial-gradient(ellipse 90% 70% at 50% 55%, ${primary} 0%, ${bg} 58%, rgba(2, 6, 10, 0.92) 100%)`,
            ].join(', '),
        };
    }, [theme.accentColor, theme.backgroundColor, theme.primaryColor]);

    const coverStyle = useMemo(
        () => (coverUrl ? resolveCoverAtmosphereDownsampleStyle(coverUrl) : null),
        [coverUrl],
    );

    return (
        <div
            className="absolute inset-0 overflow-hidden"
            data-testid="interactive-cover-r3f-stage"
            data-renderer="cover-atmosphere"
            data-visual-preset={preset}
            data-interactive-ready="true"
            data-first-frame="1"
            data-yielded={yielded ? '1' : '0'}
            data-audio-reactive={playing ? '1' : '0'}
            aria-hidden
            style={{ pointerEvents: 'none' }}
        >
            <div
                className="absolute inset-0"
                style={{ background: wash.gradient }}
            />
            {coverStyle ? (
                <div
                    data-testid="cover-atmosphere-blur"
                    style={coverStyle}
                />
            ) : (
                <div
                    className="absolute inset-0"
                    data-testid="cover-atmosphere-blur"
                    style={{
                        background: colorWithAlpha(theme.secondaryColor || theme.accentColor || '#44403c', 0.45),
                    }}
                />
            )}
            <div
                ref={washRef}
                className="absolute inset-0 bg-black"
                data-testid="cover-atmosphere-breath-wash"
                style={{ opacity: 0.28 }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 78% 70% at 50% 48%, transparent 40%, rgba(0,0,0,0.42) 100%)',
                }}
            />
        </div>
    );
};

export default CoverAtmosphereStage;
