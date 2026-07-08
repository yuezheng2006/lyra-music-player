import React from 'react';
import type {
    Interactive3dQualityTier,
    Interactive3dSceneTuning,
    Theme,
} from '../../../types';
import { colorWithAlpha } from '../colorMix';
import { INTERACTIVE3D_QUALITY_TIER_OPTIONS } from '../geometric/interactive3dSceneRegistry';
import { Interactive3dSectionLabel } from './Interactive3dSettingsPrimitives';

// src/components/visualizer/backgrounds/Interactive3dQualityTierSelector.tsx
// Render quality selector for the interactive 3D WebGL path.

interface Interactive3dQualityTierSelectorProps {
    t: (key: string) => string;
    theme: Theme;
    isDaylight: boolean;
    tuning: Interactive3dSceneTuning;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
}

const getQualityTierLabel = (
    tier: Interactive3dQualityTier,
    t: (key: string) => string,
) => {
    switch (tier) {
        case 'auto':
            return t('options.interactive3dQualityAuto') || '自动';
        case 'high':
            return t('options.interactive3dQualityHigh') || '高';
        case 'balanced':
            return t('options.interactive3dQualityBalanced') || '均衡';
        case 'lite':
            return t('options.interactive3dQualityLite') || '轻量';
        default:
            return tier;
    }
};

export const Interactive3dQualityTierSelector: React.FC<Interactive3dQualityTierSelectorProps> = ({
    t,
    theme,
    isDaylight,
    tuning,
    onTuningChange,
}) => (
    <div className="space-y-2.5">
        <Interactive3dSectionLabel theme={theme}>
            {t('options.interactive3dQualityTier') || '渲染质量'}
        </Interactive3dSectionLabel>
        <div className="flex flex-wrap gap-2" data-testid="interactive3d-quality-tier-group">
            {INTERACTIVE3D_QUALITY_TIER_OPTIONS.map(tier => {
                const isActive = tuning.qualityTier === tier;
                return (
                    <button
                        key={tier}
                        type="button"
                        data-testid={`interactive3d-quality-${tier}`}
                        onClick={() => onTuningChange?.({ qualityTier: tier })}
                        className="px-3 py-2 rounded-full text-sm transition-all border"
                        style={{
                            borderColor: isActive
                                ? colorWithAlpha(theme.secondaryColor, 0.45)
                                : colorWithAlpha(theme.secondaryColor, 0.16),
                            backgroundColor: isActive
                                ? (isDaylight ? 'rgba(255,255,255,0.92)' : colorWithAlpha(theme.secondaryColor, 0.18))
                                : colorWithAlpha(theme.backgroundColor, 0.18),
                            color: theme.primaryColor,
                        }}
                    >
                        {getQualityTierLabel(tier, t)}
                    </button>
                );
            })}
        </div>
    </div>
);
