import React from 'react';
import type { Interactive3dSceneTuning, Theme } from '../../../types';

// src/components/visualizer/backgrounds/Interactive3dAtmosphereTuningSliders.tsx
// Sensitivity / camera-punch sliders for smart atmosphere.

interface Interactive3dAtmosphereTuningSlidersProps {
    t: (key: string) => string;
    theme: Theme;
    tuning: Interactive3dSceneTuning;
    enabled: boolean;
    onTuningChange?: (patch: Partial<Interactive3dSceneTuning>) => void;
}

type SliderSpec = {
    key: 'atmosphereSensitivity' | 'cameraPunchStrength';
    labelKey: string;
    fallback: string;
    min: number;
    max: number;
    step: number;
};

const SLIDERS: SliderSpec[] = [
    {
        key: 'atmosphereSensitivity',
        labelKey: 'options.atmosphereSensitivity',
        fallback: '氛围灵敏度',
        min: 0,
        max: 1.5,
        step: 0.05,
    },
    {
        key: 'cameraPunchStrength',
        labelKey: 'options.cameraPunchStrength',
        fallback: '镜头强度',
        min: 0,
        max: 1.5,
        step: 0.05,
    },
];

export const Interactive3dAtmosphereTuningSliders: React.FC<Interactive3dAtmosphereTuningSlidersProps> = ({
    t,
    theme,
    tuning,
    enabled,
    onTuningChange,
}) => (
    <div
        className={`space-y-2.5 ${enabled ? '' : 'opacity-45'}`}
        data-testid="interactive3d-atmosphere-tuning"
    >
        {SLIDERS.map((slider) => {
            const value = tuning[slider.key];
            return (
                <label key={slider.key} className="block space-y-1">
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <span style={{ color: theme.primaryColor }}>
                            {t(slider.labelKey) || slider.fallback}
                        </span>
                        <span className="tabular-nums opacity-70" style={{ color: theme.secondaryColor }}>
                            {value.toFixed(2)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={value}
                        disabled={!onTuningChange || !enabled}
                        data-testid={`interactive3d-${slider.key}`}
                        onChange={(event) => onTuningChange?.({ [slider.key]: Number(event.target.value) })}
                        className="w-full accent-current"
                        style={{ color: theme.secondaryColor, accentColor: theme.secondaryColor }}
                    />
                </label>
            );
        })}
    </div>
);
