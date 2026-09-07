import React from 'react';
import type {
    Interactive3dSceneTuning,
    Theme,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import {
    applyMineradioVisualPreset,
    getMineradioPresetLabelFallback,
} from '../geometric/mineradioVisualPresets';
import { Interactive3dSectionLabel } from './Interactive3dSettingsPrimitives';

// src/components/visualizer/backgrounds/Interactive3dVisualPresetDeck.tsx
// Single Atmosphere entry for the soft cover-atmosphere interactive3d path.

interface Interactive3dVisualPresetDeckProps {
    t: (key: string) => string;
    theme: Theme;
    isDaylight: boolean;
    tuning: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
}

export const Interactive3dVisualPresetDeck: React.FC<Interactive3dVisualPresetDeckProps> = ({
    t,
    theme,
    isDaylight,
    tuning,
    onTuningChange,
}) => {
    const isActive = tuning.visualPreset === 'emily'
        || tuning.visualPreset === 'mineradioTunnel'
        || tuning.visualPreset === 'mineradioGalaxy';
    const glow = isActive
        ? colorWithAlpha(theme.primaryColor, 0.7)
        : colorWithAlpha(theme.secondaryColor, 0.42);

    return (
        <div className="space-y-2.5">
            <Interactive3dSectionLabel theme={theme}>
                {t('options.mineradioVisualPreset') || '视觉风格'}
            </Interactive3dSectionLabel>
            <div className="grid grid-cols-1 gap-2" data-testid="interactive3d-mineradio-presets">
                <button
                    type="button"
                    data-testid="interactive3d-preset-emily"
                    onClick={() => onTuningChange?.(applyMineradioVisualPreset('emily', tuning))}
                    className="min-w-0 rounded-2xl border p-2.5 text-left transition-all"
                    style={{
                        borderColor: isActive
                            ? colorWithAlpha(theme.secondaryColor, 0.44)
                            : colorWithAlpha(theme.secondaryColor, 0.14),
                        backgroundColor: isActive
                            ? (isDaylight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.94)')
                            : colorWithAlpha(theme.backgroundColor, 0.16),
                        color: isActive && !isDaylight ? '#09090b' : theme.primaryColor,
                    }}
                >
                    <div
                        className="relative h-14 overflow-hidden rounded-xl"
                        style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28) }}
                    >
                        <span
                            className="absolute inset-2 rounded-lg"
                            style={{
                                background: `radial-gradient(ellipse at 50% 45%, ${glow} 0%, ${colorWithAlpha(theme.accentColor || theme.primaryColor, 0.2)} 55%, transparent 80%)`,
                            }}
                        />
                        <span
                            className="absolute inset-0 opacity-50"
                            style={{
                                background: `linear-gradient(135deg, ${colorWithAlpha(theme.primaryColor, 0.35)}, transparent 60%)`,
                                filter: 'blur(6px)',
                            }}
                        />
                    </div>
                    <div className="mt-2 flex min-w-0 items-center">
                        <span className="truncate text-sm font-medium">
                            {t('options.mineradioPreset.emily') || getMineradioPresetLabelFallback('emily')}
                        </span>
                    </div>
                    <div
                        className="mt-0.5 truncate text-[11px]"
                        style={{
                            color: isActive && !isDaylight ? 'rgba(9,9,11,0.62)' : theme.secondaryColor,
                            opacity: isActive && !isDaylight ? 1 : 0.78,
                        }}
                    >
                        {t('options.interactive3dEffectCoverParticlesDesc')
                            || 'Colorful blurred cover wash'}
                    </div>
                </button>
            </div>
        </div>
    );
};
