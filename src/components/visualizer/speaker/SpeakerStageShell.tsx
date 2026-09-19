import React from 'react';
import type { Theme } from '../../../types';
import { colorWithAlpha } from '../colorMix';
import {
    resolveSpeakerGlassStyle,
    type ResolveSpeakerGlassStyleInput,
} from '../../../utils/visualizer/speakerStageShellMath';

// src/components/visualizer/speaker/SpeakerStageShell.tsx
// Soft fog/vignette wash only — no hard frame, no full-viewport backdrop-filter.

interface SpeakerStageShellProps {
    theme: Theme;
    speakerActive: boolean;
    isElectron?: boolean;
    qualityTier?: ResolveSpeakerGlassStyleInput['qualityTier'];
    reducedMotion?: boolean;
}

const SpeakerStageShell: React.FC<SpeakerStageShellProps> = ({
    theme,
    speakerActive,
    isElectron = false,
    qualityTier = 'auto',
    reducedMotion = false,
}) => {
    const glass = resolveSpeakerGlassStyle({
        speakerActive,
        isElectron,
        qualityTier,
        reducedMotion,
    });

    if (!glass) return null;

    const fogColor = colorWithAlpha('#05070c', glass.fogOpacity);
    const spotlight = colorWithAlpha(theme.primaryColor || theme.accentColor || '#ffffff', 0.05);

    return (
        <div
            aria-hidden="true"
            data-speaker-stage-glass={glass.tier}
            className="pointer-events-none absolute inset-0 z-[15]"
        >
            <div
                className="absolute inset-0"
                style={{
                    background: [
                        `radial-gradient(ellipse 58% 44% at 50% 46%, ${spotlight} 0%, transparent 72%)`,
                        `radial-gradient(ellipse 82% 72% at 50% 48%, ${fogColor} 0%, transparent 76%)`,
                    ].join(', '),
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 86% 78% at 50% 48%, transparent 34%, ${colorWithAlpha('#000000', glass.vignetteOpacity)} 100%)`,
                }}
            />
        </div>
    );
};

export default SpeakerStageShell;
